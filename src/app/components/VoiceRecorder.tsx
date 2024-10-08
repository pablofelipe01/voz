'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const waveBars = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (isRecording && analyser && dataArray) {
      animateWaveform();
    }
  }, [isRecording, analyser, dataArray]);

  const toggleRecording = async () => {
    if (!selectedName) {
      alert('Please select a name before recording.');
      return;
    }

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
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
    setMediaRecorder(recorder);

    const context = new AudioContext();
    const analyserNode = context.createAnalyser();
    const source = context.createMediaStreamSource(stream);
    source.connect(analyserNode);
    analyserNode.fftSize = 256;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    setDataArray(dataArray);
    setAnalyser(analyserNode);

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = URL.createObjectURL(blob);
        audioPreviewRef.current.style.display = 'block';
      }
      sendData(blob); // Automatically send data after stopping recording
    };
    recorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const animateWaveform = () => {
    if (!analyser || !dataArray) return;

    analyser.getByteFrequencyData(dataArray);
    waveBars.current.forEach((bar, i) => {
      const value = dataArray[i * 2];
      const percent = value / 255;
      bar.style.height = `${percent * 100}%`;
    });

    if (isRecording) {
      requestAnimationFrame(animateWaveform);
    }
  };

  const sendData = async (blob: Blob) => {
    if (!blob) {
      alert('Please record audio before sending.');
      return;
    }

    if (!selectedName) {
      alert('Please select a name before sending.');
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('name', selectedName);

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
        if (audioPreviewRef.current) audioPreviewRef.current.style.display = 'none';
        reloadPage();
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
      {/* Name Selection */}
      <div className="flex justify-center mb-5">
        <select
          value={selectedName}
          onChange={(e) => setSelectedName(e.target.value)}
          className="py-2 px-4 rounded-md border bg-gray-800 text-white"
        >
          <option value="" disabled className="text-gray-400">Operador</option>
          <option value="Mario Barrera" className="text-black">Mario Barrera</option>
          <option value="Kevin Avila" className="text-black">Kevin Avila</option>
          <option value="Yeison Cogua" className="text-black">Yeison Cogua</option>
          <option value="Santiago Amaya" className="text-black">Santiago Amaya</option>
        </select>
      </div>

      {/* Instructions */}
      <div className="mb-5 text-center text-blue-900">
        <h3 className="text-lg font-semibold">Instrucciones:</h3>
        <ul className="list-disc list-inside">
          <li>Buenos días en alegría</li>
          <li>Comentario de Apertura</li>
          <li>Consumo de gas Inicial</li>
        </ul>
      </div>

      {/* Recording Wave Animation */}
      <div className="flex justify-center items-center mb-5">
        <div className="flex space-x-1 h-20">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-red-400 to-red-600 transition-all duration-100 ease-linear"
              style={{ height: '20%' }}
              ref={(el) => (waveBars.current[i] = el!)}
            ></div>
          ))}
        </div>
      </div>

      {/* Record/Stop Button */}
      <div className="flex justify-center mb-5">
        <button
          onClick={toggleRecording}
          className={`${isRecording ? 'bg-red-600' : 'bg-red-500'} text-white py-2 px-4 rounded-md`}
          disabled={isSending}
        >
          {isRecording ? '⏹ Stop' : '🎤 Inicio Turno'}
        </button>
      </div>

      {/* Audio Preview */}
      <audio ref={audioPreviewRef} controls className={`w-full ${audioBlob ? '' : 'hidden'} mb-5`}></audio>

      {/* Status Messages */}
      <div className="flex justify-center items-center mb-5">
        <div className="text-center">
          <div className="mb-2 text-white-800">
            Audio Status: {audioBlob ? '✅ Recorded' : '❌ Not recorded'}
          </div>
        </div>
      </div>
    </div>
  );
}