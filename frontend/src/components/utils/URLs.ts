const isTesting = false;

export const url = isTesting
  ? {
      backendURL: '',
      frontendURL: '',
      containerOrigin: '',
    }
  : {
      backendURL: import.meta.env.VITE_BACKEND_URL,
      frontendURL: import.meta.env.VITE_FRONTEND_URL,
      containerOrigin: import.meta.env.VITE_CONTAINER_ORIGIN,
    };
