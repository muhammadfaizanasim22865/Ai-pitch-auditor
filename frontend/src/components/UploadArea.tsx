import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  FileAudio,
  X,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Mic,
} from 'lucide-react';
import { RecordPitch } from './RecordPitch';

const ACCEPTED_FORMATS = '.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac';
const ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/aac',
  'audio/x-flac',
  'audio/x-aac',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

type InputMode = 'record' | 'upload';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClearFile: () => void;
  onAnalyze: () => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export function UploadArea({
  onFileSelect,
  selectedFile,
  onClearFile,
  onAnalyze,
  isUploading,
  uploadProgress,
  error,
}: UploadAreaProps) {
  const [mode, setMode] = useState<InputMode>('record');
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExt = ACCEPTED_FORMATS.split(',').includes(ext);
    const validType =
      ACCEPTED_TYPES.includes(file.type) ||
      file.type.startsWith('audio/');
    if (!validExt && !validType) {
      return `Unsupported format. Accepted: ${ACCEPTED_FORMATS}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is 50 MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setValidationError(err);
        return;
      }
      setValidationError(null);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayError = validationError || error;

  const switchMode = (newMode: InputMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setValidationError(null);
      onClearFile();
    }
  };

  return (
    <div className="w-full">
      {/* Mode tabs */}
      <div className="mb-5 flex gap-2 rounded-xl border border-white/[0.06] bg-ink-850/60 p-1.5">
        <button
          onClick={() => switchMode('record')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-display text-sm font-medium transition-all ${
            mode === 'record'
              ? 'bg-ink-700 text-white shadow-sm'
              : 'text-ink-400 hover:text-ink-200'
          }`}
          aria-pressed={mode === 'record'}
        >
          <Mic className="h-4 w-4" />
          Record Pitch
        </button>
        <button
          onClick={() => switchMode('upload')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-display text-sm font-medium transition-all ${
            mode === 'upload'
              ? 'bg-ink-700 text-white shadow-sm'
              : 'text-ink-400 hover:text-ink-200'
          }`}
          aria-pressed={mode === 'upload'}
        >
          <Upload className="h-4 w-4" />
          Upload Audio
        </button>
      </div>

      {/* Record mode */}
      {mode === 'record' && !selectedFile && (
        <RecordPitch onFileSelect={onFileSelect} disabled={isUploading} />
      )}

      {/* Upload mode - drag & drop */}
      {mode === 'upload' && !selectedFile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload pitch audio"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-lime-400/60 bg-lime-400/[0.04] glow-lime'
              : 'border-white/[0.08] bg-ink-850/50 hover:border-white/[0.15] hover:bg-ink-800/50'
          }`}
        >
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="relative flex flex-col items-center justify-center px-6 py-16 sm:py-20">
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 ${
                isDragging
                  ? 'border-lime-400/40 bg-lime-400/10 scale-110'
                  : 'border-white/[0.08] bg-ink-800 group-hover:border-lime-500/20 group-hover:bg-ink-750'
              }`}
            >
              <Upload
                className={`h-7 w-7 transition-colors duration-300 ${
                  isDragging
                    ? 'text-lime-400'
                    : 'text-ink-300 group-hover:text-lime-400'
                }`}
              />
            </div>
            <p className="font-display text-lg font-medium text-white">
              {isDragging
                ? 'Drop your pitch audio here'
                : 'Drag & drop your pitch audio'}
            </p>
            <p className="mt-2 text-sm text-ink-300">
              or{' '}
              <span className="text-lime-400 underline underline-offset-2">
                browse files
              </span>
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {['MP3', 'WAV', 'M4A', 'OGG', 'WEBM', 'FLAC', 'AAC'].map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-md border border-white/[0.06] bg-ink-800 px-2.5 py-1 font-mono text-[11px] tracking-wider text-ink-300"
                >
                  {fmt}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-400">Max 50 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Selected file preview (shared by both modes) */}
      {selectedFile && (
        <div className="rounded-2xl border border-white/[0.08] bg-ink-850/80 p-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-lime-500/20 bg-lime-500/[0.06]">
              <FileAudio className="h-6 w-6 text-lime-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 font-mono text-xs text-ink-300">
                {formatSize(selectedFile.size)}
              </p>
              {isUploading && (
                <div className="mt-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-lime-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-ink-400">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
            {!isUploading && (
              <button
                onClick={() => {
                  onClearFile();
                  setValidationError(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-ink-300 transition-all hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-400"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {!isUploading && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onAnalyze}
                disabled={isUploading}
                className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-lime-500 to-lime-600 px-6 py-3.5 font-display text-sm font-semibold text-ink-950 transition-all hover:from-lime-400 hover:to-lime-500 hover:shadow-lg hover:shadow-lime-500/20 disabled:opacity-50"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <ShieldCheck className="h-4 w-4" />
                Analyze Pitch
              </button>
              <button
                onClick={() => {
                  onClearFile();
                  setValidationError(null);
                }}
                className="rounded-xl border border-white/[0.08] bg-ink-800 px-6 py-3.5 font-display text-sm font-medium text-ink-200 transition-all hover:border-white/[0.15] hover:bg-ink-750"
              >
                {mode === 'record' ? 'Record Again' : 'Replace File'}
              </button>
            </div>
          )}
        </div>
      )}

      {displayError && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 animate-fade-in">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-300">
              {displayError}
            </p>
            <p className="mt-1 text-xs text-red-300/60">
              Please select a valid audio file and try again.
            </p>
          </div>
        </div>
      )}

      {isUploading && uploadProgress === 100 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 animate-fade-in">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <p className="text-sm font-medium text-cyan-300">
            Upload complete — analysis in progress...
          </p>
        </div>
      )}
    </div>
  );
}
