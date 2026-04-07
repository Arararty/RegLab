import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { User } from '../../models/user.model';

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    Hydrate: props<{ user: User | null }>(),
    'Login Submitted': props<{ login: string; password: string }>(),
    'Logout Requested': emptyProps(),
    'Set User': props<{ user: User | null }>(),
    'Set Error': props<{ error: string }>(),
    'Clear Error': emptyProps(),
  },
});
