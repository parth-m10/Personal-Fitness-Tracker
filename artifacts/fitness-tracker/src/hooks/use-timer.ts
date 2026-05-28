import { useState, useEffect, useRef, useCallback } from "react";

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isDone: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTimer(initialSeconds: number, onComplete?: () => void): TimerState {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset when initial duration changes (e.g. different exercise card mounts)
  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  return { timeLeft, isRunning, isDone: timeLeft === 0, start, pause, reset };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
