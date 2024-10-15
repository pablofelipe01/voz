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
  const [countdown, setCountdown] = useState(60);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const waveBars = useRef<HTMLDivElement[]>([]);
  const timerRef = useRef<number | null>(null); // Usamos useRef para el intervalo

  // Efecto para manejar el cronómetro
  useEffect(() => {
    if (isCountdownActive && timerRef.current === null) {
      timerRef.current = window.setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown > 1) {
            return prevCountdown - 1;
          } else {
            stopRecording(); // Detener la grabación cuando el cronómetro llegue a 0
            setIsCountdownActive(false);
            return 0;
          }
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isCountdownActive]); // Solo depende de isCountdownActive

  useEffect(() => {
    if (isRecording && analyser && dataArray) {
      animateWaveform();
    }
  }, [isRecording, analyser, dataArray]);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setCountdown(60); // Reiniciar el cronómetro al iniciar una nueva grabación
        setIsCountdownActive(false); // Asegurarse de que el cronómetro no esté activo
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
    setIsCountdownActive(false); // Detener el cronómetro si está activo
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    // Limpiar el intervalo
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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

  const sendData = async () => {
    if (!audioBlob) {
      alert('Por favor, graba audio antes de enviar.');
      return;
    }

    if (!number) {
      alert('Por favor, selecciona un operador.');
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append('number', number); // Agregar número al FormData
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
        alert('¡Datos enviados exitosamente!');
        setAudioBlob(null);
        setNumber('');
        if (audioPreviewRef.current) audioPreviewRef.current.style.display = 'none';
      } else {
        throw new Error(`El servidor respondió con estado: ${response.status}. Respuesta: ${responseText}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Error al enviar datos. Por favor, intenta de nuevo. Error: ${error.message}`);
      } else {
        alert('Error al enviar datos. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const startCountdown = () => {
    if (!isRecording) {
      alert('Por favor, inicia la grabación antes de iniciar el cronómetro.');
      return;
    }
    setIsCountdownActive(true);
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

      {/* Botón para iniciar el cronómetro */}
      <div className="flex justify-center mb-5">
        <button
          onClick={startCountdown}
          className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center"
          disabled={!isRecording || isCountdownActive}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          </svg>
          Iniciar Cronómetro
        </button>
      </div>

      {/* Cronómetro */}
      {isCountdownActive && (
        <div className="mb-5 text-center text-red-600">
          <h3 className="text-lg font-semibold">Tiempo restante: {countdown} segundos</h3>
        </div>
      )}

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

      {/* Botón de enviar */}
      <button
        onClick={sendData}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center"
        disabled={isSending}
      >
        {isSending ? <span>Enviando...</span> : <span>Enviar Datos</span>}
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
