import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  // Firebase observable user (null when signed out)
  user$: Observable<import('@firebase/auth').User | null> = user(this.auth);

  private _u = signal<import('@firebase/auth').User | null>(null);
  displayName = computed(() => this._u()?.displayName ?? null);
  email       = computed(() => this._u()?.email ?? null);

  constructor() {
    this.user$.subscribe(u => this._u.set(u));
  }

  async loginWithGoogle() {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async logout() {
    await signOut(this.auth);
  }
}
