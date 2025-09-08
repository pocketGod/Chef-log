import { Component, inject, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <h1>Login</h1>
    <p>Sign in with your Google account.</p>
    <button (click)="google()">Sign in with Google</button>
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  constructor() {
    effect(() => {
      const u = this.auth.email(); // signal from AuthService
      if (u) this.goHome();
    });
  }

  async google() {
    await this.auth.loginWithGoogle();
    this.goHome();
  }

  private goHome() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dishes';
    this.router.navigateByUrl(returnUrl);
  }
}
