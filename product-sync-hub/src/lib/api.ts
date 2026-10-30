import { compressImageTo500KB } from "./imageCompression";

const rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').trim();
const normalizedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') 
  ? rawUrl 
  : `https://${rawUrl}`;
const API_URL = normalizedUrl.replace(/\/+$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_URL}${cleanPath}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    if (!path.includes('/auth/')) {
        window.location.reload();
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  
  // Special upload method for multipart form data (compresses image to max 500KB)
  upload: async (file: File, onProgress?: (progress: number) => void) => {
    const token = localStorage.getItem('token');
    const processedFile = await compressImageTo500KB(file, onProgress);
    const formData = new FormData();
    formData.append('image', processedFile);

    const response = await fetch(`${API_URL}/api/upload.php`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data as { publicUrl: string };
  }
};
