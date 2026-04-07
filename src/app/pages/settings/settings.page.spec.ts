import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { provideTaiga } from '@taiga-ui/core';

import { AuthBackendService } from '../../core/auth-backend.service';
import { AuthService } from '../../core/auth.service';
import { ChatBackendService } from '../../core/chat-backend.service';
import { fakeRestApiInterceptor } from '../../core/fake-rest-api.interceptor';
import { StorageService } from '../../core/storage.service';
import { authActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { SettingsPageComponent } from './settings.page';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let component: SettingsPageComponent;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [
        provideRouter([]),
        provideStore(
          { [authFeature.name]: authFeature.reducer },
          {
            initialState: {
              auth: {
                user: { login: 'user1', password: 'user1' },
                error: null,
                loginPending: false,
              },
            },
          },
        ),
        provideTaiga(),
        StorageService,
        AuthBackendService,
        ChatBackendService,
        AuthService,
        provideHttpClient(withInterceptors([fakeRestApiInterceptor])),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show settings title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Settings');
  });

  it('should render current user login from store', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('user1');
  });

  it('should dispatch logoutRequested when logout is called', () => {
    const store = TestBed.inject(Store);
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    component.logout();
    expect(dispatchSpy).toHaveBeenCalledWith(authActions.logoutRequested());
  });
});
