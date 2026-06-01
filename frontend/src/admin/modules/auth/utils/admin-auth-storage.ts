const ADMIN_AUTH_TOKEN_KEY = 'bluffing_coffee_admin_token';

export function getAdminAuthToken(): string | null {
  return window.localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
}

export function setAdminAuthToken(token: string): void {
  window.localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, token);
}

export function clearAdminAuthToken(): void {
  window.localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
}

export function getAdminAuthHeaders() {
  const token = getAdminAuthToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}
