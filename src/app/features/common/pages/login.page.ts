import { Component, inject, effect, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LocalizePipe } from '../../../shared/pipes/localize.pipe';
import { TranslationService } from '../../../shared/services/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="page">
      <h1>{{ 'login.title' | localize }}</h1>
      <p>{{ 'login.signInPrompt' | localize }}</p>
      <button class="btn" (click)="google()">{{ 'login.signInGoogle' | localize }}</button>
    </div>
  `,
  imports: [LocalizePipe],
})
export class LoginPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationSvc = inject(TranslationService)

  constructor() {
    effect(() => {
      const u = this.auth.email(); // signal from AuthService
      if (u) this.goHome();
    });
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('unauthorized')) {
      alert(this.translationSvc.t('login.unaothorized'));
    }
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
