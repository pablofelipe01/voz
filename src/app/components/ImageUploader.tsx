'use client';

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function ImageUploader() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [imageName, setImageName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setImageName(selectedFile.name); // Set initial image name
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      alert('Please select a valid image file.');
      setFile(null);
      setPreviewUrl('');
      setImageName('');
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl('');
    setImageName('');
  };

  const startDropboxAuth = () => {
    window.location.href = '/api/dropbox/auth';
  };

  const sendData = async () => {
    if (!file) {
      alert('Please upload an image before sending.');
      return;
    }

    if (!email) {
      alert('Please provide an email address.');
      return;
    }

    if (!imageName.trim()) {
      alert('Please provide a name for the image.');
      return;
    }

    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('imageName', imageName);
      formData.append('file', file, imageName); // Use the custom image name

      // Use an absolute URL here
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/upload-image`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        alert('Image uploaded successfully!');
        setFile(null);
        setEmail('');
        setPreviewUrl('');
        setImageName('');
      } else if (response.status === 401) {
        startDropboxAuth();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to send data. Please try again. Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Home Icon for Reload */}
      <div className="text-center mb-5">
        <button onClick={reloadPage} className="text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9-5v12m12 0h-3m-6 0h-3m9-7v7" />
          </svg>
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-center mb-5 text-blue-800">Image Uploader</h1>

      <div className="mb-5">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        />
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Enter image name"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md text-gray-900"
        />
      </div>

      <div className="mb-5 flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Click
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {previewUrl && (
        <div className="mb-5">
          <h2 className="text-lg text-gray-600 font-semibold mb-2">Image Preview:</h2>
          <div className="relative">
            <img src={previewUrl} alt="Preview" className="w-full rounded-md" />
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <button
        onClick={sendData}
        className="w-full bg-indigo-500 text-white py-3 rounded-md flex justify-center items-center transition-colors duration-300 hover:bg-indigo-600"
        disabled={isSending || !file}
      >
        {isSending ? (
          <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        <span>{isSending ? 'Uploading...' : 'Upload'}</span>
      </button>

      {/* Status Message */}
      <div className="mt-5 text-center text-blue-800">
        Image Status: {file ? '✅ Uploaded' : '❌ Not uploaded'}
      </div>
    </div>
  );
}