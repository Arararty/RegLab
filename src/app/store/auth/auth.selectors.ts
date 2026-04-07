import { createSelector } from '@ngrx/store';

import { authFeature } from './auth.reducer';

export const selectAuthUser = authFeature.selectUser;
export const selectIsAuthenticated = createSelector(selectAuthUser, Boolean);
export const selectAuthError = authFeature.selectError;
export const selectAuthLoginPending = authFeature.selectLoginPending;
