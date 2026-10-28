import { useState, useCallback } from 'react';
import type { ProcessingState } from '../types/pdf';

export function usePdfProcessing() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    statusMessage: '',
    error: null,
    resultUrl: null,
    resultFilename: null,
  });

  const startProcessing = useCallback((initialMessage: string = 'Starting...') => {
    setState({
      isProcessing: true,
      progress: 0,
      statusMessage: initialMessage,
      error: null,
      resultUrl: null,
      resultFilename: null,
    });
  }, []);

  const updateProgress = useCallback((progress: number, message: string) => {
    setState((prev) => ({
      ...prev,
      progress,
      statusMessage: message,
    }));
  }, []);

  const finishProcessing = useCallback((resultBytes: Uint8Array, filename: string) => {
    const blob = new Blob([resultBytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setState({
      isProcessing: false,
      progress: 100,
      statusMessage: 'Completed successfully!',
      error: null,
      resultUrl: url,
      resultFilename: filename,
    });
  }, []);

  const failProcessing = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    setState((prev) => ({
      ...prev,
      isProcessing: false,
      error: message,
      statusMessage: 'Error occurred',
    }));
  }, []);

  const resetProcessing = useCallback(() => {
    if (state.resultUrl) {
      URL.revokeObjectURL(state.resultUrl);
    }
    setState({
      isProcessing: false,
      progress: 0,
      statusMessage: '',
      error: null,
      resultUrl: null,
      resultFilename: null,
    });
  }, [state.resultUrl]);

  return {
    ...state,
    startProcessing,
    updateProgress,
    finishProcessing,
    failProcessing,
    resetProcessing,
  };
}
