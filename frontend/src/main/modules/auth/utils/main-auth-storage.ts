const MAIN_AUTH_TOKEN_KEY = 'bluffing_coffee_main_token';

export function getMainAuthToken(): string | null {
  return window.localStorage.getItem(MAIN_AUTH_TOKEN_KEY);
}

export function setMainAuthToken(token: string): void {
  window.localStorage.setItem(MAIN_AUTH_TOKEN_KEY, token);
}

export function clearMainAuthToken(): void {
  window.localStorage.removeItem(MAIN_AUTH_TOKEN_KEY);
}

export function getMainAuthHeaders() {
  const token = getMainAuthToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}
