import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideTaiga } from '@taiga-ui/core';

import { routes } from './app.routes';
import { fakeRestApiInterceptor } from './core/fake-rest-api.interceptor';
import { AuthEffects } from './store/auth/auth.effects';
import { authFeature } from './store/auth/auth.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([fakeRestApiInterceptor])),
    provideRouter(routes),
    provideTaiga(),
    provideStore({
      [authFeature.name]: authFeature.reducer,
      router: routerReducer,
    }),
    provideRouterStore(),
    provideEffects([AuthEffects]),
    ...(isDevMode()
      ? [
          provideStoreDevtools({
            maxAge: 40,
            connectInZone: true,
          }),
        ]
      : []),
  ],
};
