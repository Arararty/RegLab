import { authActions } from './auth.actions';
import { authFeature } from './auth.reducer';

describe('auth reducer', () => {
  it('stores user with setUser', () => {
    const state = authFeature.reducer(
      undefined,
      authActions.setUser({ user: { login: 'user1', password: 'user1' } }),
    );
    expect(state.user?.login).toBe('user1');
    expect(state.loginPending).toBe(false);
  });

  it('stores auth error with setError', () => {
    const state = authFeature.reducer(
      undefined,
      authActions.setError({ error: 'неверный логин или пароль' }),
    );
    expect(state.error).toBe('неверный логин или пароль');
    expect(state.loginPending).toBe(false);
  });

  it('loginSubmitted marks pending; setUser clears pending', () => {
    let state = authFeature.reducer(
      undefined,
      authActions.loginSubmitted({ login: 'user1', password: 'user1' }),
    );
    expect(state.loginPending).toBe(true);
    state = authFeature.reducer(
      state,
      authActions.setUser({ user: { login: 'user1', password: 'user1' } }),
    );
    expect(state.loginPending).toBe(false);
  });

  it('loginSubmitted then setError clears pending', () => {
    let state = authFeature.reducer(
      undefined,
      authActions.loginSubmitted({ login: 'x', password: 'y' }),
    );
    state = authFeature.reducer(state, authActions.setError({ error: 'fail' }));
    expect(state.loginPending).toBe(false);
    expect(state.error).toBe('fail');
  });
});
