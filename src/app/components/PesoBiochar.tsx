'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function PesoBiochar() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(60); // Inicializar el cronómetro a 60 segundos

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const waveBars = useRef<HTMLDivElement[]>([]);

  // Efecto para el cronómetro: inicia 3 segundos después de comenzar la grabación
  useEffect(() => {
    let timer: number | null = null;
    let countdownStartTimeout: number | null = null;

    if (isRecording && countdown === 60) {
      // Retrasar el inicio del cronómetro 3 segundos
      countdownStartTimeout = window.setTimeout(() => {
        timer = window.setInterval(() => {
          setCountdown((prevCountdown) => {
            if (prevCountdown > 0) return prevCountdown - 1;
            if (timer !== null) clearInterval(timer);
            // Detener la grabación automáticamente cuando el cronómetro llega a 0
            stopRecording();
            return 0;
          });
        }, 1000); // Disminuir el cronómetro cada segundo
      }, 3000); // Iniciar el cronómetro 3 segundos después de comenzar a grabar
    }

    return () => {
      if (timer !== null) clearInterval(timer); // Limpiar el intervalo del cronómetro
      if (countdownStartTimeout !== null) clearTimeout(countdownStartTimeout); // Limpiar el timeout inicial
    };
  }, [isRecording, countdown]);

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
      sendData(blob); // Enviar datos automáticamente después de detener la grabación
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

  const sendData = async (blob: Blob) => {
    if (!blob) {
      alert('Por favor, graba audio antes de enviar.');
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append('audio', blob, 'recording.ogg');

    try {
      const response = await fetch('https://hook.us2.make.com/wxpxhrhg3qgim71xteampkaw2sg4vmaw', {
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
        if (audioPreviewRef.current) audioPreviewRef.current.style.display = 'none';
        reloadPage(); // Recargar la página después de enviar los datos
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

  return (
    <div>
      {/* Instrucciones */}
      <div className="mb-5 text-center text-blue-900">
        <h3 className="text-lg font-semibold">Instrucciones:</h3>
        <ul className="list-disc list-inside">
          <li>Decir solo el peso de biochar en kilos cuando la lona este full</li>
        
        </ul>
      </div>

      {/* Cronómetro */}
      {isRecording && (
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
          className={`${isRecording ? 'bg-red-600' : 'bg-green-500'} text-white py-2 px-4 rounded-md`}
          disabled={isSending}
        >
          {isRecording ? '⏹ Detener' : 'Peso Biochar'}
        </button>
      </div>

      {/* Vista previa de audio */}
      <audio ref={audioPreviewRef} controls className={`w-full ${audioBlob ? '' : 'hidden'} mb-5`}></audio>

      {/* Mensajes de estado */}
      <div className="flex justify-center items-center mb-5">
        <div className="text-center">
          <div className="mb-2 text-black-800">
            Estado del audio: {audioBlob ? '✅ Grabado' : '❌ No grabado'}
          </div>
        </div>
      </div>
    </div>
  );
}
