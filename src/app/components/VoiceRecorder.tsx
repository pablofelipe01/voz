'use client';

import {  useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [number, setNumber] = useState(''); // State to hold the selected operator
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isSending, setIsSending] = useState(false);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestAnimationFrameRef = useRef<number | null>(null);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startRecording(stream);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Error accessing microphone. Please ensure you have granted microphone permissions.");
      }
    } else {
      stopRecording();
    }
  };

  const startRecording = (stream: MediaStream) => {
    setIsRecording(true);
    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;

    source.connect(analyser);

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
      setAudioBlob(blob);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = URL.createObjectURL(blob);
        audioPreviewRef.current.style.display = 'block';
      }
    };
    recorder.start();
    drawWaveform();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    cancelAnimationFrame(requestAnimationFrameRef.current!);
  };

  const drawWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const ctx = canvas.getContext("2d");

    const draw = () => {
      requestAnimationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = "rgb(255, 0, 0)";

      ctx!.beginPath();
      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx!.moveTo(x, y);
        } else {
          ctx!.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx!.lineTo(canvas.width, canvas.height / 2);
      ctx!.stroke();
    };

    draw();
  };

  const sendData = async () => {
    if (!audioBlob) {
      alert('Please record audio before sending.');
      return;
    }

    if (!number) {
      alert('Please select an operator.');
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append('number', number); // Add number to the FormData
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.ogg');
    }

    try {
      const response = await fetch('https://hook.us2.make.com/nip7vj86ndf2vv1t7r6jw6yoky18u4t7', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();

      if (response.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        alert('Data sent successfully!');
        setAudioBlob(null);
        setNumber('');
        if (audioPreviewRef.current) audioPreviewRef.current.style.display = 'none';
      } else {
        throw new Error(`Server responded with status: ${response.status}. Response: ${responseText}`);
      }
    } catch (error) {
      alert(`Failed to send data. Please try again. Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div>
      {/* Home Icon for Reload */}
      <div className="text-center mb-5">
        <button onClick={reloadPage} className="text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9-5v12m12 0h-3m-6 0h-3m9-7v7" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Data</h1>

      {/* Operator Dropdown */}
      <div className="mb-5">
        <select
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        >
          <option value="" disabled className="text-gray-400">Operador</option>
          <option value="Mario Barrera" className="text-black">Mario Barrera</option>
          <option value="Kevin Avila" className="text-black">Kevin Avila</option>
          <option value="Yeison Cogua" className="text-black">Yeison Cogua</option>
          <option value="Santiago Amaya" className="text-black">Santiago Amaya</option>
        </select>
      </div>

      {/* Recording Wave Canvas */}
      <div className="flex justify-center items-center mb-5">
        <canvas ref={canvasRef} width={300} height={80} className="w-full" />
      </div>

      {/* Instructions */}
      <div className="mb-5 text-blue-800">
        <p>Instrucciones:</p>
        <ul className="list-disc list-inside">
          <li>Buenos días en alegría</li>
          <li>Comentario de Apertura</li>
          <li>Consumo de gas Inicial</li>
        </ul>
      </div>

      {/* Record/Stop Button */}
      <div className="flex justify-center mb-5">
        <button
          onClick={toggleRecording}
          className={`${isRecording ? 'bg-red-600' : 'bg-red-500'} text-white py-2 px-4 rounded-md`}
        >
          {isRecording ? '⏹ Stop' : '🎤 Record'}
        </button>
      </div>

      {/* Audio Preview */}
      <audio ref={audioPreviewRef} controls className={`w-full ${audioBlob ? '' : 'hidden'} mb-5`}></audio>

      {/* Send Button */}
      <button
        onClick={sendData}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center"
        disabled={isSending}
      >
        {isSending ? <span>Sending...</span> : <span>Send Data</span>}
      </button>

      {/* Status Messages */}
      <div className="flex justify-center items-center mb-5">
        <div className="text-center">
          <div className="mb-2 text-blue-800">
            Audio Status: {audioBlob ? '✅ Recorded' : '❌ Not recorded'}
          </div>
        </div>
      </div>
    </div>
  );
}