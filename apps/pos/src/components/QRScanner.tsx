'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Button, Text, useToast } from '@chakra-ui/react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const toast = useToast();

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      toast({
        title: '카메라 접근 실패',
        description: '카메라 권한을 확인해주세요.',
        status: 'error',
      });
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsScanning(false);
    }
  };

  useEffect(() => {
    let animationFrame: number;

    const scanQRCode = () => {
      if (isScanning && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            onScan(code.data);
            stopScanning();
            return;
          }
        }

        animationFrame = requestAnimationFrame(scanQRCode);
      }
    };

    if (isScanning) {
      scanQRCode();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      stopScanning();
    };
  }, [isScanning, onScan]);

  return (
    <Box position="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          maxWidth: '500px',
          display: isScanning ? 'block' : 'none'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      <Button
        onClick={isScanning ? stopScanning : startScanning}
        colorScheme={isScanning ? 'red' : 'blue'}
        mt={4}
      >
        {isScanning ? '스캔 중지' : 'QR 스캔 시작'}
      </Button>
      {isScanning && (
        <Text mt={2} fontSize="sm" color="gray.500">
          QR 코드를 카메라에 비춰주세요
        </Text>
      )}
    </Box>
  );
}
