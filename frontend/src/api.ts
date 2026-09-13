import type { AnalyzeResponse, ApiError } from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://ai-pitch-auditor.vercel.app';

export async function analyzePitch(
  audioFile: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append('audio', audioFile);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded, e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as AnalyzeResponse;
          resolve(data);
        } catch {
          reject({
            message: 'Received an unexpected response format from the server.',
            type: 'unexpected',
          } as ApiError);
        }
      } else if (xhr.status === 422) {
        let detail = 'The audio file was rejected by the server.';
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.detail?.length > 0) {
            detail = errData.detail
              .map((d: { msg: string }) => d.msg)
              .join('; ');
          }
        } catch {
          // use default
        }
        reject({ message: detail, status: 422, type: 'validation' } as ApiError);
      } else if (xhr.status >= 500) {
        reject({
          message:
            'The analysis server encountered an error. Please try again in a moment.',
          status: xhr.status,
          type: 'server',
        } as ApiError);
      } else {
        reject({
          message: `Request failed with status ${xhr.status}.`,
          status: xhr.status,
          type: 'server',
        } as ApiError);
      }
    };

    xhr.onerror = () => {
      reject({
        message:
          'Could not reach the analysis server. Check your connection and try again.',
        type: 'network',
      } as ApiError);
    };

    xhr.ontimeout = () => {
      reject({
        message:
          'The request timed out. The server may be busy — please try again.',
        type: 'network',
      } as ApiError);
    };

    xhr.open('POST', `${API_BASE_URL}/api/analyze`);
    xhr.timeout = 300000;
    xhr.send(formData);
  });
}
