// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Helper to get the WebSocket URL for the current host
export const getWebSocketURL = (path: string): string => {
  if (!isBrowser) {
    return `ws://localhost:8000/${path}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/${path}`;
};

// Helper to get the sync server URL (shown to users in SetupGuide)
const getSyncServerURL = (): string => {
  if (!isBrowser) {
    return 'http://localhost:8080/';
  }
  return `${window.location.origin}/taskchampion/`;
};

export const url = {
  // Backend API calls use relative URLs - nginx routes to backend
  backendURL: '/',

  // Frontend URL for redirects - just use root
  frontendURL: '/',

  // Sync server URL - derived from current origin
  // This is shown to users in SetupGuide for their taskwarrior config
  containerOrigin: getSyncServerURL(),

  // External URLs (unchanged)
  githubRepoURL: 'https://github.com/CCExtractor/ccsync',
  githubDocsURL: 'https://its-me-abhishek.github.io/ccsync-docs/',
  zulipURL: 'https://ccextractor.org/public/general/support/',
  taskwarriorURL: 'https://taskwarrior.org/docs/',
  taskchampionSyncServerURL:
    'https://github.com/GothenburgBitFactory/taskchampion-sync-server/tree/main',
};
