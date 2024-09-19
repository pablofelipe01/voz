'use client';

import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function VoiceRecorderUploader() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [email, setEmail] = useState('');
  const [recordingName, setRecordingName] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access the microphone. Please check your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const startDropboxAuth = () => {
    window.location.href = '/api/dropbox/auth';
  };

  const sendData = async () => {
    if (!audioBlob) {
      alert('Please record audio before uploading.');
      return;
    }

    if (!email) {
      alert('Please provide an email address.');
      return;
    }

    if (!recordingName) {
      alert('Please provide a name for your recording.');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('file', audioBlob, `${recordingName}.wav`);

      const response = await fetch('/api/upload-voice', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        alert('Audio uploaded successfully!');
        setAudioBlob(null);
        setEmail('');
        setRecordingName('');
      } else if (response.status === 401) {
        startDropboxAuth();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Failed to send data. Please try again. Error: ${error.message}`);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Voice Recorder Uploader</h1>

      <div className="mb-5">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900 mb-2"
        />
        <input
          type="text"
          placeholder="Enter recording name"
          value={recordingName}
          onChange={(e) => setRecordingName(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        />
      </div>

      <div className="mb-5 flex justify-center space-x-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-red-500 text-white py-2 px-4 rounded-md"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-gray-500 text-white py-2 px-4 rounded-md"
          >
            Stop Recording
          </button>
        )}
        {audioBlob && !isPlaying && (
          <button
            onClick={playAudio}
            className="bg-green-500 text-white py-2 px-4 rounded-md"
          >
            Play
          </button>
        )}
        {isPlaying && (
          <button
            onClick={stopAudio}
            className="bg-yellow-500 text-white py-2 px-4 rounded-md"
          >
            Stop
          </button>
        )}
      </div>

      {audioBlob && (
        <div className="mb-5 text-center text-gray-600">
          Audio recorded! You can play it back or upload it.
        </div>
      )}

      <button
        onClick={sendData}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center"
        disabled={isSending || !audioBlob}
      >
        {isSending ? <span>Uploading...</span> : <span>Upload Audio</span>}
      </button>
    </div>
  );
}