/** Prototype session. Cookie only no identity provider. */

export const SESSION_COOKIE = "kraya-session";

export const DEMO_EMAIL = "operator@kraya.ai";
export const DEMO_PASSWORD = "command";

export function credentialsMatch(email: string, password: string): boolean {
  return email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;
}

export function writeSession(): void {
  document.cookie = `${SESSION_COOKIE}=operator; path=/; max-age=31536000; samesite=lax`;
}

export function clearSession(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
