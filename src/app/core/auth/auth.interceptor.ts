// import { HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { Auth } from '@angular/fire/auth';

// export const authInterceptor: HttpInterceptorFn = async (req, next) => {
//   const auth = inject(Auth);
//   const token = await auth.currentUser?.getIdToken?.();
//   return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
// };
