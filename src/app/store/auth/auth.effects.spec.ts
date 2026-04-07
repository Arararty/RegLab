import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, ReplaySubject, firstValueFrom, of, throwError } from 'rxjs';
import { take } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { authActions } from './auth.actions';
import { AuthEffects } from './auth.effects';

describe('AuthEffects', () => {
  let actions$: ReplaySubject<Action>;
  let effects: AuthEffects;
  let auth: { login: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    auth = {
      login: vi.fn(),
      logout: vi.fn(),
    };
    navigateByUrl = vi.fn().mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$ as Observable<Action>),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });

    effects = TestBed.inject(AuthEffects);
  });

  it('loginSubmitted dispatches setUser and navigates home on success', async () => {
    const user = { login: 'user1', password: 'user1' };
    auth.login.mockReturnValue(of(user));

    const out = firstValueFrom(effects.login$.pipe(take(1)));
    actions$.next(authActions.loginSubmitted({ login: 'user1', password: 'user1' }));

    await expect(out).resolves.toEqual(authActions.setUser({ user }));
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('loginSubmitted dispatches setError on auth failure', async () => {
    auth.login.mockReturnValue(throwError(() => new Error('Неверный логин или пароль')));

    const out = firstValueFrom(effects.login$.pipe(take(1)));
    actions$.next(authActions.loginSubmitted({ login: 'x', password: 'y' }));

    await expect(out).resolves.toEqual(
      authActions.setError({ error: 'неверный  логин или пароль' }),
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('logoutRequested clears user and navigates to login', async () => {
    auth.logout.mockReturnValue(of(undefined));

    const out = firstValueFrom(effects.logout$.pipe(take(1)));
    actions$.next(authActions.logoutRequested());

    await expect(out).resolves.toEqual(authActions.setUser({ user: null }));
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('logoutRequested still clears session when logout errors', async () => {
    auth.logout.mockReturnValue(throwError(() => new Error('network')));

    const out = firstValueFrom(effects.logout$.pipe(take(1)));
    actions$.next(authActions.logoutRequested());

    await expect(out).resolves.toEqual(authActions.setUser({ user: null }));
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
