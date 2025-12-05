export class TokenService {
  static setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  static getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  static removeToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  static setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static clear(): void {
    this.removeToken();
  }

  // Проверка срока действия токена (JWT)
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
