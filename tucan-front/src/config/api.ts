// API configuration
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: {
      login: `${API_BASE_URL}/api/auth/login`,
      register: `${API_BASE_URL}/api/auth/register`,
      logout: `${API_BASE_URL}/api/auth/logout`,
    },
    courses: `${API_BASE_URL}/api/courses`,
    quizzes: `${API_BASE_URL}/api/quizzes`,
    users: `${API_BASE_URL}/api/users`,
    teachers: `${API_BASE_URL}/api/teachers`,
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export default apiConfig;
