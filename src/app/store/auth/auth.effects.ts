import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { authActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.loginSubmitted),
      switchMap(({ login, password }) =>
        this.auth.login(login, password).pipe(
          switchMap((user) => {
            this.router.navigateByUrl('/');
            return of(authActions.setUser({ user }));
          }),
          catchError(() =>
            of(
              authActions.setError({
                error: 'неверный  логин или пароль',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.logoutRequested),
      switchMap(() =>
        this.auth.logout().pipe(
          map(() => authActions.setUser({ user: null })),
          catchError(() => of(authActions.setUser({ user: null }))),
          tap(() => this.router.navigateByUrl('/login')),
        ),
      ),
    ),
  );
}
