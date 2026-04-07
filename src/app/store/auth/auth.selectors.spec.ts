import { selectAuthLoginPending, selectIsAuthenticated } from './auth.selectors';

describe('auth selectors', () => {
  it('selectIsAuthenticated is false when user is null', () => {
    expect(selectIsAuthenticated.projector(null)).toBe(false);
  });

  it('selectIsAuthenticated is true when user exists', () => {
    expect(selectIsAuthenticated.projector({ login: 'user1', password: 'user1' })).toBe(true);
  });

  it('selectAuthLoginPending reads pending flag', () => {
    expect(selectAuthLoginPending.projector({ user: null, error: null, loginPending: true })).toBe(
      true,
    );
  });
});
