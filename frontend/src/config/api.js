// Keep the API on the same origin in development so Vite's proxy
// forwards /api requests to the Django server on port 8000.
const DEFAULT_API_URL = "";

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_URL;

export const API_BASE_URL =
  configuredApiUrl.replace(/\/+$/, "");

export const apiUrl = (path = "") => {
  const cleanPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${API_BASE_URL}${cleanPath}`;
};
