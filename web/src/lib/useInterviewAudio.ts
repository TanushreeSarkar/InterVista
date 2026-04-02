import { useState, useRef, useEffect, useCallback } from 'react';

interface UseInterviewAudioProps {
  onSilenceDetected: (audioBlob: Blob) => void;
  silenceDuration?: number; // 2000ms default
}

export function useInterviewAudio({
  onSilenceDetected,
  silenceDuration = 2000,
}: UseInterviewAudioProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // User is speaking?
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio Setup for Silence Detection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Setup Recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onSilenceDetected(audioBlob);
        audioChunksRef.current = [];
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      detectSilence();

    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSilenceDetected]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsSpeaking(false);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }
  }, []);

  const detectSilence = () => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    // Normalize roughly to dB (simplified)
    // 0 = silence, 128 = loud (approx range in Uint8)
    // Threshold ~20 is roughly silence
    
    if (average > 10) { // Speaking
        setIsSpeaking(true);
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    } else { // Silent
        setIsSpeaking(false);
        if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
                // Trigger auto-send
                stopRecording(); 
            }, silenceDuration);
        }
    }

    requestAnimationFrame(detectSilence);
  };
  
  // Clean up
  useEffect(() => {
      return () => {
          stopRecording();
      }
  }, [stopRecording]);

  return { isRecording, isSpeaking, startRecording, stopRecording };
}
