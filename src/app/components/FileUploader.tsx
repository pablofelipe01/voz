'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';

export default function FileUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const filesArray = Array.from(selectedFiles);

      if (filesArray.length + files.length > 2) {
        alert('You can only upload 2 files.');
        return;
      }

      setFiles((prevFiles) => [...prevFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const startDropboxAuth = () => {
    window.location.href = '/api/dropbox/auth';
  };

  const sendData = async () => {
    if (files.length !== 2) {
      alert('Please upload exactly 2 files before sending.');
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

      files.forEach((file) => {
        formData.append('files', file, file.name);
      });

      const response = await fetch('/api/upload', {
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
        alert('Data sent successfully!');
        setFiles([]);
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
      {/* Title */}
      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">File Uploader</h1>

      {/* Email Input */}
      <div className="mb-5">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        />
      </div>

      {/* File Input */}
      <div className="mb-5 text-sm text-gray-600">
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          className="w-full"
        />
        <p className="text-sm text-gray-600 mt-1">You must upload exactly 2 files.</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mb-5">
          <h2 className="text-lg  text-gray-600 font-semibold mb-2">Selected Files:</h2>
          <ul className="list-disc list-inside  text-gray-600">
            {files.map((file, index) => (
              <li key={index} className="flex justify-between items-center  text-gray-600">
                <span>{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:underline text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={sendData}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center"
        disabled={isSending || files.length !== 2}
      >
        {isSending ? <span>Sending...</span> : <span>Send Data</span>}
      </button>
    </div>
  );
}
