import { Component, inject, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LocalizePipe } from '../../../shared/pipes/localize.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
  <div class="page">
    <h1>{{ 'login.title' | localize }}</h1>
    <p>{{ 'login.signInPrompt' | localize }}</p>
    <button class="btn" (click)="google()"> {{ 'login.signInGoogle' | localize }}</button>
  </div>
  `,
  imports:[LocalizePipe]
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
