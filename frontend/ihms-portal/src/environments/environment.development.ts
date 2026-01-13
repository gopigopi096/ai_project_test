// Development environment configuration
// Used for local development with `ng serve`
export const environment = {
  production: false,
  // For local development, API calls go through Angular CLI proxy to gateway
  apiUrl: '/api',
  authUrl: '/api/auth',
  // Direct gateway URL for development without proxy
  gatewayUrl: 'http://localhost:8080'
};

