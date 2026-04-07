import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideTaiga } from '@taiga-ui/core';
import { App } from './app';
import { AuthBackendService } from './core/auth-backend.service';
import { AuthService } from './core/auth.service';
import { fakeRestApiInterceptor } from './core/fake-rest-api.interceptor';
import { StorageService } from './core/storage.service';
import { authFeature } from './store/auth/auth.reducer';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer }),
        provideTaiga(),
        StorageService,
        AuthBackendService,
        AuthService,
        provideHttpClient(withInterceptors([fakeRestApiInterceptor])),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
