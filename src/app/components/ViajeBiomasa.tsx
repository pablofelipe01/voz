'use client';

import { useState } from 'react';

export default function ViajeBiomasa() {
  const [isSending, setIsSending] = useState(false);

  const handleClick = async () => {
    setIsSending(true);

    try {
      const response = await fetch('https://hook.us2.make.com/qiqhprf9yoz182gn94gw0no6fl2hvdn0', {
        method: 'POST',
      });

      const responseText = await response.text();
      console.log('Response from server:', responseText);

      if (response.ok) {
        alert('Webhook activated successfully!');
      } else {
        throw new Error(`Server responded with status: ${response.status}. Response: ${responseText}`);
      }
    } catch (error) {
      console.error('Error activating webhook:', error);
      alert(`Failed to activate webhook. Please try again. Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Circular Button */}
      <button
        onClick={handleClick}
        disabled={isSending}
        className="text-white text-lg font-semibold h-32 w-32 bg-blue-600 rounded-full shadow-lg transform transition-all hover:shadow-2xl hover:scale-105 active:scale-95 active:shadow-md disabled:opacity-50 flex items-center justify-center"
      >
        VIAJE
      </button>
    </div>
  );
}
