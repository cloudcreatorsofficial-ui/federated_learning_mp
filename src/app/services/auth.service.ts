import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
      return false;
    } else {
      return true;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _authenticated = false;

  login(username: string, password: string): boolean {
    this._authenticated = username === 'admin' && password === 'password';
    return this._authenticated;
  }

  logout(): void {
    this._authenticated = false;
  }

  isAuthenticated(): boolean {
    return this._authenticated;
  }
}
