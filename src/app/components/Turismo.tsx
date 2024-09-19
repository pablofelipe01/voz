'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

export default function Turismo() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [email, setEmail] = useState(''); // State to hold the email address
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendData = async () => {
    if (!audioBlob && !photo) {
      alert('Please record audio or upload/take a photo before sending.');
      return;
    }
  
    if (!email) {
      alert('Please provide an email address.');
      return;
    }
  
    setIsSending(true);
  
    const formData = new FormData();
    formData.append('email', email); // Add email to the FormData
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.ogg');
    }
    if (photo) {
      formData.append('photo', photo, photo.name);
    }

    try {
      const response = await fetch('https://hook.us2.make.com/2fp108b73ybc24s77xscy1u4cfivj0on', {
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
        setPhoto(null);
        setEmail('');
        setPhotoPreviewUrl(null);
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
      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Turismo & Image</h1>

     {/* Email Input */}
<div className="mb-5">
  <input
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className="w-full border border-gray-300 p-2 rounded-md text-gray-900" // Added text color class
  />
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
      <div className="flex justify-between mb-5">
        <button
          onClick={toggleRecording}
          className={`${isRecording ? 'bg-red-600' : 'bg-red-500'} text-white py-2 px-4 rounded-md`}
        >
          {isRecording ? '⏹ Stop' : '🎤 Record'}
        </button>
        <button
          onClick={() => photoInputRef.current?.click()}
          className="bg-blue-500 text-white py-2 px-4 rounded-md"
        >
          📷 Upload
        </button>
        <input
          type="file"
          ref={photoInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handlePhotoUpload}
        />
        {/* <button className="bg-green-500 text-white py-2 px-4 rounded-md">
          📸 Take Photo
        </button> */}
      </div>

      {/* Photo Preview */}
      {photoPreviewUrl && (
        <div className="mb-5">
          <img src={photoPreviewUrl} alt="Photo preview" className="w-full rounded-md" />
        </div>
      )}

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
          <div className="mb-2 text-blue-800">
            Photo Status: {photo ? '✅ Uploaded' : '❌ Not uploaded'}
          </div>
        </div>
      </div>
    </div>
  );
}
