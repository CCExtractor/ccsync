const isTesting = false;

export const url = isTesting
  ? {
      backendURL: '',
      frontendURL: '',
      containerOrigin: '',
      githubRepoURL: '',
      githubDocsURL: '',
      zulipURL: '',
      taskwarriorURL: '',
      taskchampionSyncServerURL: '',
    }
  : {
      backendURL: import.meta.env.VITE_BACKEND_URL,
      frontendURL: import.meta.env.VITE_FRONTEND_URL,
      containerOrigin: import.meta.env.VITE_CONTAINER_ORIGIN,
      githubRepoURL: 'https://github.com/CCExtractor/ccsync',
      githubDocsURL: 'https://its-me-abhishek.github.io/ccsync-docs/',
      zulipURL: 'https://ccextractor.org/public/general/support/',
      taskwarriorURL: 'https://taskwarrior.org/docs/',
      taskchampionSyncServerURL:
        'https://github.com/GothenburgBitFactory/taskchampion-sync-server/tree/main',
    };
