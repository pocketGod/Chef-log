// auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, of } from 'rxjs';
import { switchMap, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const db = inject(Firestore);

  return auth.user$.pipe(
    take(1),
    switchMap(u => {
      if (!u?.email) {
        return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
      }
      const ref = doc(db, 'allowList', u.email);
      return from(getDoc(ref)).pipe(
        map(snap => {
          if (snap.exists()) return true;
          alert('Your account is not authorized for this app.');
          auth.logout();
          return router.createUrlTree(['/login'], { queryParams: { unauthorized: 1 } });
        })
      );
    })
  );
};
