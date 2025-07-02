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
      backendURL: 'http://localhost:8000/',
      frontendURL: 'http://localhost:80',
      containerOrigin: 'http://localhost:8080/',
      githubRepoURL: 'https://github.com/CCExtractor/ccsync',
      githubDocsURL: 'https://its-me-abhishek.github.io/ccsync-docs/',
      zulipURL: 'https://ccextractor.org/public/general/support/',
      taskwarriorURL: 'https://taskwarrior.org/docs/',
      taskchampionSyncServerURL:
        'https://github.com/GothenburgBitFactory/taskchampion-sync-server/tree/main',
    };
