import { environment } from '../../../environments/environment';

const apiBase = environment.apiUrl;

export const API_ENDPOINTS = {
  auth: `${apiBase}/auth`,
  admin: `${apiBase}/admin`,
  candidate: `${apiBase}/candidate`,
  proctoring: `${apiBase}/proctoring`,
  shared: apiBase
} as const;
