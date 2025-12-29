export const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://helpinghand-api-327510394438.us-central1.run.app'
  : `${window.location.protocol}//${window.location.hostname}:3000`;