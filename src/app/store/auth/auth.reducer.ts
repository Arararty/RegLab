import { createFeature, createReducer, on } from '@ngrx/store';

import { User } from '../../models/user.model';
import { authActions } from './auth.actions';

export type AuthState = Readonly<{
  user: User | null;
  error: string | null;
  loginPending: boolean;
}>;

const initialState: AuthState = {
  user: null,
  error: null,
  loginPending: false,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(authActions.hydrate, (state, { user }) => ({ ...state, user, loginPending: false })),
    on(authActions.loginSubmitted, (state) => ({ ...state, error: null, loginPending: true })),
    on(authActions.setUser, (state, { user }) => ({
      ...state,
      user,
      error: null,
      loginPending: false,
    })),
    on(authActions.setError, (state, { error }) => ({ ...state, error, loginPending: false })),
    on(authActions.clearError, (state) => ({ ...state, error: null })),
  ),
});
