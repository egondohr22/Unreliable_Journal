import { API_MODE, LOCAL_API_URL, PRODUCTION_API_URL } from '@env';

// Determine which API URL to use based on API_MODE environment variable
// To switch between local and production:
// 1. Edit frontend/.env
// 2. Change API_MODE to 'local' or 'production'
// 3. Restart the Metro bundler (stop and run 'npm start' again)

const getBaseUrl = () => {
  const mode = API_MODE || 'local';

  if (mode === 'production') {
    return PRODUCTION_API_URL;
  }

  // Default to local
  return LOCAL_API_URL;
};

const API_BASE_URL = getBaseUrl();

console.log(`API Mode: ${API_MODE || 'local'}`);
console.log(`API Base URL: ${API_BASE_URL}`);

export const API = {
  BASE_URL: API_BASE_URL,

  ENDPOINTS: {
    AUTH: {
      REGISTER: `${API_BASE_URL}/auth/register`,
      LOGIN: `${API_BASE_URL}/auth/login`,
      ME: `${API_BASE_URL}/auth/me`,
    },
    NOTES: {
      GET_ALL: `${API_BASE_URL}/notes`,
      GET_ONE: (noteId) => `${API_BASE_URL}/notes/${noteId}`,
      CREATE: `${API_BASE_URL}/notes`,
      UPDATE: (noteId) => `${API_BASE_URL}/notes/${noteId}`,
      DELETE: (noteId) => `${API_BASE_URL}/notes/${noteId}`,
      LEAVE: (noteId) => `${API_BASE_URL}/notes/${noteId}/leave`,
    },
    USER: {
      GET_PROFILE: `${API_BASE_URL}/user/profile`,
      UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
      LOGOUT: `${API_BASE_URL}/user/logout`,
    }
  }
};

export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
