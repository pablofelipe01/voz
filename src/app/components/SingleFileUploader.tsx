'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';

export default function SingleFileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const startDropboxAuth = () => {
    window.location.href = '/api/dropbox/auth';
  };

  const sendData = async () => {
    if (!file) {
      alert('Please upload a file before sending.');
      return;
    }

    if (!email) {
      alert('Please provide an email address.');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('file', file);

      const response = await fetch('/api/upload-single', {
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
        alert('File uploaded successfully!');
        setFile(null);
        setEmail('');
      } else if (response.status === 401) {
        // Not authenticated, start Dropbox auth
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
      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Single File Uploader</h1>

      <div className="mb-5">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        />
      </div>

      <div className="mb-5 text-sm text-gray-600">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="w-full"
        />
        <p className="text-sm text-gray-600 mt-1">Please upload a single file.</p>
      </div>

      {file && (
        <div className="mb-5">
          <h2 className="text-lg text-gray-600 font-semibold mb-2">Selected File:</h2>
          <div className="flex justify-between items-center text-gray-600">
            <span>{file.name}</span>
            <button
              onClick={removeFile}
              className="text-red-500 hover:underline text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      <button
        onClick={sendData}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center"
        disabled={isSending || !file}
      >
        {isSending ? <span>Sending...</span> : <span>Upload File</span>}
      </button>
    </div>
  );
}