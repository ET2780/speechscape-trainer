import { useState, useEffect, useRef } from 'react';

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        console.log('Camera access granted, setting up video stream');
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => {
      track.stop();
      console.log('Stopped video track:', track.label);
    });
  };

  return {
    videoRef,
    error,
    startCamera,
    stopCamera
  };
};