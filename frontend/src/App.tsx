import { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LandingPage } from '@/components/LandingPage';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { ErrorState } from '@/components/ErrorState';
import { analyzePitch } from '@/api';
import type { AnalyzeResponse, ApiError } from '@/types';

type AppState = 'idle' | 'uploading' | 'analyzing' | 'results' | 'error';

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setLastFile(selectedFile);
    setState('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      const data = await analyzePitch(selectedFile, (loaded, total) => {
        const pct = Math.round((loaded / total) * 100);
        setUploadProgress(pct);
        if (pct >= 100) {
          setState('analyzing');
        }
      });

      setResults(data);
      setState('results');
    } catch (err) {
      setError(err as ApiError);
      setState('error');
    }
  }, [selectedFile]);

  const handleRetry = useCallback(() => {
    if (lastFile) {
      setSelectedFile(lastFile);
      setState('idle');
      setError(null);
      setUploadProgress(0);
      // Re-run analysis
      setTimeout(() => {
        setLastFile(lastFile);
        setState('uploading');
        setUploadProgress(0);
        analyzePitch(lastFile, (loaded, total) => {
          const pct = Math.round((loaded / total) * 100);
          setUploadProgress(pct);
          if (pct >= 100) {
            setState('analyzing');
          }
        })
          .then((data) => {
            setResults(data);
            setState('results');
          })
          .catch((err) => {
            setError(err as ApiError);
            setState('error');
          });
      }, 100);
    } else {
      handleReset();
    }
  }, [lastFile]);

  const handleReset = useCallback(() => {
    setState('idle');
    setSelectedFile(null);
    setResults(null);
    setError(null);
    setUploadProgress(0);
    setLastFile(null);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950">
      <Header />

      <main className="pt-16">
        {state === 'idle' && (
          <LandingPage
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClearFile={handleClearFile}
            onAnalyze={handleAnalyze}
            isUploading={false}
            uploadProgress={0}
            error={error?.message || null}
          />
        )}

        {(state === 'uploading' || state === 'analyzing') && (
          <AnalysisProgress
            fileName={selectedFile?.name || lastFile?.name || 'audio file'}
          />
        )}

        {state === 'results' && results && (
          <ResultsDashboard data={results} onReset={handleReset} />
        )}

        {state === 'error' && error && (
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
}
