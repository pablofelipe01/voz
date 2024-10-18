/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [number, setNumber] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [isSending, setIsSending] = useState(false);

  

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const waveBars = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (isRecording && analyser && dataArray) {
      animateWaveform();
    }
  }, [isRecording, analyser, dataArray]);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startRecording(stream);
      } catch (err: unknown) {
        console.error('Error accessing microphone:', err);
        alert('Error al acceder al micrófono. Por favor, asegúrate de haber concedido permisos.');
      }
    } else {
      stopRecording();
    }
  };

  const startRecording = (stream: MediaStream) => {
    setIsRecording(true);
    const recorder = new MediaRecorder(stream);
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
      const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
      setAudioBlob(blob);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = URL.createObjectURL(blob);
        audioPreviewRef.current.style.display = 'block';
      }
    };
    recorder.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
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

  const downloadAudio = () => {
    if (!audioBlob) {
      alert('Por favor, graba audio antes de descargar.');
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recording.ogg'; // Set the filename
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up the DOM
    URL.revokeObjectURL(url); // Release the object URL
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div>
      {/* Icono de Inicio para Recargar */}
      <div className="text-center mb-5">
        <button onClick={reloadPage} className="text-blue-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9-5v12m12 0h-3m-6 0h-3m9-7v7" />
          </svg>
        </button>
      </div>

      {/* Título */}
      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Data</h1>

      {/* Selección de Operador */}
      <div className="mb-5">
        <select
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        >
          <option value="" disabled className="text-gray-400">
            Operador
          </option>
          <option value="Mario Barrera" className="text-black">
            Mario Barrera
          </option>
          <option value="Kevin Avila" className="text-black">
            Kevin Avila
          </option>
          <option value="Yeison Cogua" className="text-black">
            Yeison Cogua
          </option>
          <option value="Santiago Amaya" className="text-black">
            Santiago Amaya
          </option>
        </select>
      </div>

      {/* Instrucciones */}
      <div className="mb-5 text-blue-800">
        <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Instrucciones:</h1>
        <ul className="list-disc list-inside">
          <li>Saludo</li>
          <li>Consumo de gas Inicial</li>
          <li>Hertz</li>
          <li>Peso por Minuto</li>
        </ul>
      </div>

      {/* Animación de la onda de grabación */}
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

      {/* Botón de grabar/detener */}
      <div className="flex justify-center mb-5">
        <button
          onClick={toggleRecording}
          className={`${isRecording ? 'bg-red-600' : 'bg-red-500'} text-white py-2 px-4 rounded-md`}
          disabled={isSending}
        >
          {isRecording ? '⏹ Detener' : '🎤 Grabar'}
        </button>
      </div>

      {/* Vista previa de audio */}
      <audio ref={audioPreviewRef} controls className={`w-full ${audioBlob ? '' : 'hidden'} mb-5`}></audio>

      {/* Botón de descargar */}
      <button
        onClick={downloadAudio}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center"
      >
        Descargar Audio
      </button>

      {/* Mensajes de estado */}
      <div className="flex justify-center items-center mb-5">
        <div className="text-center">
          <div className="mb-2 text-blue-800">
            Estado del audio: {audioBlob ? '✅ Grabado' : '❌ No grabado'}
          </div>
        </div>
      </div>
    </div>
  );
}
