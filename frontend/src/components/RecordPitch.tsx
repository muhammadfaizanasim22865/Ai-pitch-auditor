import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';

interface RecordPitchProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

type RecordState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'converting'
  | 'recorded'
  | 'error';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function pickRecordingMimeType(): string {
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/m4a',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  '',
  ];
  for (const type of candidates) {
    if (!type) return '';
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function isBackendAccepted(mimeType: string): boolean {
  return (
    mimeType.includes('wav') ||
    mimeType.includes('mp4') ||
    mimeType.includes('m4a') ||
    mimeType.includes('mpeg') ||
    mimeType.includes('mp3')
  );
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < numFrames; frame++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = buffer.getChannelData(ch)[frame];
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

async function convertToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await audioContext.close();
  return audioBufferToWav(audioBuffer);
}

export function RecordPitch({ onFileSelect, disabled }: RecordPitchProps) {
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setAudioUrl(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
      revokeAudioUrl();
    };
  }, [cleanupStream, revokeAudioUrl]);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    revokeAudioUrl();
    setElapsed(0);
    setRecordState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const mimeType = pickRecordingMimeType();

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const recordedMimeType = recorder.mimeType || mimeType || 'audio/webm';
        const rawBlob = new Blob(chunksRef.current, { type: recordedMimeType });
        cleanupStream();

        let finalBlob: Blob;
        let finalName: string;
        let finalType: string;

        if (isBackendAccepted(recordedMimeType)) {
          finalBlob = rawBlob;
          const ext = recordedMimeType.includes('mp4') || recordedMimeType.includes('m4a')
            ? 'm4a'
            : recordedMimeType.includes('mpeg') || recordedMimeType.includes('mp3')
              ? 'mp3'
              : 'wav';
          finalName = `pitch-recording.${ext}`;
          finalType = recordedMimeType;
        } else {
          setRecordState('converting');
          try {
            finalBlob = await convertToWav(rawBlob);
            finalName = 'pitch-recording.wav';
            finalType = 'audio/wav';
          } catch {
            setRecordState('error');
            setErrorMsg(
              'Could not process the recording. Please try again or use the Upload Audio option.',
            );
            return;
          }
        }

        const file = new File([finalBlob], finalName, { type: finalType });

        console.log('[RecordPitch] Recorded file:', {
          recordedMimeType: finalType,
          recordedFileName: finalName,
          recordedFileType: file.type,
          recordedFileSize: file.size,
        });

        const url = URL.createObjectURL(finalBlob);
        audioUrlRef.current = url;
        setAudioUrl(url);

        setRecordState('recorded');
        onFileSelect(file);
      };

      recorder.onerror = () => {
        cleanupStream();
        setRecordState('error');
        setErrorMsg('Recording failed. Please check your microphone and try again.');
      };

      recorder.start();
      setRecordState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      cleanupStream();
      setRecordState('error');
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setErrorMsg(
          'Microphone access was denied. Please allow microphone permission in your browser settings and try again.',
        );
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setErrorMsg(
          'No microphone was found. Please connect a microphone and try again.',
        );
      } else {
        setErrorMsg(
          'Could not access the microphone. Please check your device and try again.',
        );
      }
    }
  }, [cleanupStream, onFileSelect, revokeAudioUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reRecord = useCallback(() => {
    revokeAudioUrl();
    setElapsed(0);
    setErrorMsg(null);
    setRecordState('idle');
  }, [revokeAudioUrl]);

  return (
    <div className="w-full">
      {recordState === 'idle' && (
        <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/[0.08] bg-ink-850/50 px-6 py-16 transition-all sm:py-20">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="relative flex flex-col items-center">
            <button
              onClick={startRecording}
              disabled={disabled}
              aria-label="Start recording"
              className="group relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-lime-500/30 bg-ink-800 transition-all hover:border-lime-400/60 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 rounded-full bg-lime-500/10 blur-xl opacity-0 transition-opacity group-hover:opacity-100" />
              <Mic className="relative h-8 w-8 text-lime-400" />
            </button>
            <p className="font-display text-lg font-medium text-white">
              Record Your Pitch
            </p>
            <p className="mt-2 text-sm text-ink-300">
              Click the microphone to start recording
            </p>
          </div>
        </div>
      )}

      {recordState === 'requesting' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-white/[0.08] bg-ink-850/50 px-6 py-16 sm:py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-400" />
          <p className="font-display text-base font-medium text-white">
            Requesting microphone access...
          </p>
          <p className="mt-2 text-sm text-ink-400">
            Please allow microphone permission when prompted
          </p>
        </div>
      )}

      {recordState === 'recording' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-400/30 bg-red-400/[0.03] px-6 py-16 sm:py-20">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl animate-pulse-glow" />
            <div className="absolute inset-0 rounded-full border-2 border-red-400/30" />
            <div className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
              <span className="h-4 w-4 rounded-full bg-red-400 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <span className="font-mono text-xs tracking-widest text-red-400">
              RECORDING
            </span>
          </div>
          <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-white">
            {formatTime(elapsed)}
          </p>
          <button
            onClick={stopRecording}
            className="mt-6 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/15 px-6 py-3 font-display text-sm font-semibold text-red-300 transition-all hover:bg-red-500/25 hover:border-red-400/50"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop Recording
          </button>
        </div>
      )}

      {recordState === 'converting' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-cyan-400/20 bg-cyan-400/[0.03] px-6 py-16 sm:py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-cyan-400" />
          <p className="font-display text-base font-medium text-white">
            Processing recording...
          </p>
          <p className="mt-2 text-sm text-ink-400">
            Converting audio for analysis
          </p>
        </div>
      )}

      {recordState === 'recorded' && audioUrl && (
        <div className="rounded-2xl border border-white/[0.08] bg-ink-850/80 p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-lime-500/20 bg-lime-500/[0.06]">
              <Mic className="h-5 w-5 text-lime-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Recording complete</p>
              <p className="font-mono text-xs text-ink-300">
                {formatTime(elapsed)} · ready for analysis
              </p>
            </div>
          </div>
          <audio
            controls
            src={audioUrl}
            className="w-full rounded-lg"
            aria-label="Recording playback preview"
          />
          <button
            onClick={reRecord}
            disabled={disabled}
            className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-ink-800 px-4 py-2.5 text-sm font-medium text-ink-200 transition-all hover:border-white/[0.15] hover:bg-ink-750 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Re-record
          </button>
        </div>
      )}

      {recordState === 'error' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-400/20 bg-red-400/[0.03] px-6 py-16 sm:py-20">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="mb-4 max-w-sm text-center text-sm leading-relaxed text-red-300">
            {errorMsg}
          </p>
          <button
            onClick={reRecord}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-ink-800 px-5 py-2.5 text-sm font-medium text-ink-200 transition-all hover:border-white/[0.15] hover:bg-ink-750"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
