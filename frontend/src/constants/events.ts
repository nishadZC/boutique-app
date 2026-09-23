// Fired by code outside the React tree (e.g. the axios interceptor in
// services/api.ts) when a request comes back unauthenticated, so the global
// login modal can be opened without that code needing React context.
export const AUTH_REQUIRED_EVENT = 'auth:required';
