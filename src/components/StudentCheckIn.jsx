import { useEffect, useRef, useState } from 'react';
import { Camera, ShieldCheck, QrCode, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentCheckIn({ session, roster, onCheckIn, saveFaceTemplate, loadFaceTemplate }) {
  const [tab, setTab] = useState('face'); // 'face' | 'qr'
  const [selectedId, setSelectedId] = useState(roster[0]?.id || '');
  const [message, setMessage] = useState(null);

  return (
    <section className="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black/60 p-4 sm:p-5 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Student Check-In</h2>
        <div className="text-xs text-zinc-400">{session.active ? 'Session Active' : 'Waiting for session'}</div>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-zinc-400 mb-1">Select Your Name</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm">
          {roster.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => setTab('face')} className={`rounded-lg py-2 text-sm border ${tab==='face' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black border-transparent' : 'bg-white/5 border-white/10 text-white'}`}>
          <div className="flex items-center justify-center gap-2"><Camera className="h-4 w-4"/>Face Recognition</div>
        </button>
        <button onClick={() => setTab('qr')} className={`rounded-lg py-2 text-sm border ${tab==='qr' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-black border-transparent' : 'bg-white/5 border-white/10 text-white'}`}>
          <div className="flex items-center justify-center gap-2"><QrCode className="h-4 w-4"/>QR + PIN (Privacy)</div>
        </button>
      </div>

      {tab === 'face' ? (
        <FaceFlow session={session} studentId={selectedId} onCheckIn={(m) => setMessage(m)} saveFaceTemplate={saveFaceTemplate} loadFaceTemplate={loadFaceTemplate} />
      ) : (
        <QrPinFlow session={session} studentId={selectedId} onCheckIn={(m) => setMessage(m)} />
      )}

      {message && (
        <div className={`mt-3 text-sm rounded-md border p-3 flex items-start gap-2 ${message.ok ? 'border-green-500/30 bg-green-500/10 text-green-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-100'}`}>
          {message.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5"/> : <AlertCircle className="h-4 w-4 mt-0.5"/>}
          <div>
            <div className="font-medium">{message.ok ? 'Success' : 'Notice'}</div>
            <div className="text-xs opacity-90">{message.text}</div>
          </div>
        </div>
      )}
    </section>
  );
}

function FaceFlow({ session, studentId, onCheckIn, saveFaceTemplate, loadFaceTemplate }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [livePassed, setLivePassed] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHasTemplate(!!loadFaceTemplate(studentId));
  }, [studentId, loadFaceTemplate]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setLivePassed(false);
    } catch (e) {
      onCheckIn({ ok: false, text: 'Camera access denied or unavailable.' });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    const w = 240;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 180;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  };

  const livenessCheck = async () => {
    // Simple motion-based liveness: measure frame differences over ~1.5s
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return false;

    const w = 160;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 120;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    let prev = null;
    let motionScore = 0;
    const samples = 12;

    for (let i = 0; i < samples; i++) {
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h).data;
      if (prev) {
        let diff = 0;
        for (let p = 0; p < frame.length; p += 4) {
          diff += Math.abs(frame[p] - prev[p]);
          diff += Math.abs(frame[p + 1] - prev[p + 1]);
          diff += Math.abs(frame[p + 2] - prev[p + 2]);
        }
        motionScore += diff / (w * h);
      }
      prev = frame;
      await new Promise((res) => setTimeout(res, 120));
    }
    // Threshold tuned for basic movement; prompt user to blink/turn head
    return motionScore > 50; // arbitrary threshold
  };

  const enrollFace = async () => {
    if (!session.active) return onCheckIn({ ok: false, text: 'No active session.' });
    if (!streaming) await startCamera();
    const frame = captureFrame();
    if (!frame) return onCheckIn({ ok: false, text: 'Unable to capture frame.' });
    saveFaceTemplate(studentId, frame);
    setHasTemplate(true);
    onCheckIn({ ok: true, text: 'Face enrolled for this device.' });
  };

  const compareDataUrls = async (a, b) => {
    // naive pixel diff using canvas
    const imgA = await loadImage(a);
    const imgB = await loadImage(b);
    const w = 120, h = 120;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(imgA, 0, 0, w, h);
    const dA = ctx.getImageData(0, 0, w, h).data;
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(imgB, 0, 0, w, h);
    const dB = ctx.getImageData(0, 0, w, h).data;
    let diff = 0;
    for (let i = 0; i < dA.length; i += 4) {
      diff += Math.abs(dA[i] - dB[i]);
      diff += Math.abs(dA[i+1] - dB[i+1]);
      diff += Math.abs(dA[i+2] - dB[i+2]);
    }
    const avg = diff / (w * h);
    return avg; // lower is more similar
  };

  const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  const recognize = async () => {
    if (!session.active) return onCheckIn({ ok: false, text: 'No active session.' });
    if (!hasTemplate) return onCheckIn({ ok: false, text: 'No face enrolled. Please enroll first.' });
    setBusy(true);
    try {
      if (!streaming) await startCamera();
      const live = await livenessCheck();
      setLivePassed(live);
      if (!live) {
        setBusy(false);
        return onCheckIn({ ok: false, text: 'Liveness check failed. Blink or turn your head and try again.' });
      }
      const captured = captureFrame();
      const template = loadFaceTemplate(studentId);
      const score = await compareDataUrls(captured, template);
      // threshold: since naive, allow generous tolerance
      if (score < 80) {
        const result = onCheckIn({ studentId, method: 'face' });
        setBusy(false);
        return onCheckIn({ ok: result.ok, text: result.message || 'Checked in.' });
      } else {
        setBusy(false);
        return onCheckIn({ ok: false, text: 'Face mismatch. Ensure good lighting and frame your face.' });
      }
    } catch (e) {
      setBusy(false);
      return onCheckIn({ ok: false, text: 'Recognition failed.' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-white/10 overflow-hidden">
        <div className="bg-black/40 p-3 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/> Liveness {livePassed ? <span className="text-green-400">Passed</span> : <span className="text-zinc-400">Required</span>}</div>
          <div>{hasTemplate ? <span className="text-green-400">Face Enrolled</span> : <span className="text-amber-400">Enrollment Needed</span>}</div>
        </div>
        <div className="p-3">
          <div className="aspect-video rounded-md overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {!streaming && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={startCamera} className="rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-sm hover:bg-white/20">
                  Start Camera
                </button>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="text-[11px] text-zinc-400 mt-2">Tip: Ensure good lighting. For liveness, blink and turn your head slightly.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={enrollFace} disabled={!session.active || busy} className="rounded-lg py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50">Enroll Face</button>
        <button onClick={recognize} disabled={!session.active || busy} className="rounded-lg py-2 text-sm bg-gradient-to-r from-orange-500 to-amber-600 text-black font-semibold hover:brightness-110 disabled:opacity-50">
          {busy ? 'Checking…' : 'Recognize & Check-In'}
        </button>
      </div>
    </div>
  );
}

function QrPinFlow({ session, studentId, onCheckIn }) {
  const [qr, setQr] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  const submit = () => {
    if (!session.active) return onCheckIn({ ok: false, text: 'No active session.' });
    try {
      const data = JSON.parse(qr);
      if (data.sessionId === session.id && String(pin) === String(session.pin)) {
        const res = onCheckIn({ studentId, method: 'qr' });
        return onCheckIn({ ok: res.ok, text: res.message || 'Checked in.' });
      }
      return onCheckIn({ ok: false, text: 'QR or PIN mismatch.' });
    } catch (e) {
      return onCheckIn({ ok: false, text: 'Invalid QR data. Paste QR content from the session code.' });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Paste QR Data</label>
        <input value={qr} onChange={(e) => setQr(e.target.value)} placeholder='{"sessionId":"...","pin":"..."}' className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm"/>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">PIN</label>
        <div className="relative">
          <input type={showPin ? 'text' : 'password'} value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm pr-10"/>
          <button onClick={() => setShowPin((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
            {showPin ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
          </button>
        </div>
      </div>
      <button onClick={submit} disabled={!session.active} className="w-full rounded-lg py-2 text-sm bg-gradient-to-r from-orange-500 to-amber-600 text-black font-semibold hover:brightness-110 disabled:opacity-50">Check-In</button>
    </div>
  );
}
