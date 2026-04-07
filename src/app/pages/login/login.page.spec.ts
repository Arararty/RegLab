import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngrx/store';
import { provideTaiga } from '@taiga-ui/core';

import { AuthBackendService } from '../../core/auth-backend.service';
import { AuthService } from '../../core/auth.service';
import { ChatBackendService } from '../../core/chat-backend.service';
import { fakeRestApiInterceptor } from '../../core/fake-rest-api.interceptor';
import { StorageService } from '../../core/storage.service';
import { authActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { LoginPageComponent } from './login.page';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideStore({ [authFeature.name]: authFeature.reducer }),
        provideTaiga(),
        StorageService,
        AuthBackendService,
        ChatBackendService,
        AuthService,
        provideHttpClient(withInterceptors([fakeRestApiInterceptor])),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show authorization title', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Авторизация');
  });

  it('should not dispatch login when form is invalid', () => {
    const store = TestBed.inject(Store);
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    component.form.patchValue({ login: 'ab', password: 'x' });
    component.submit();
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it('should dispatch clearError and loginSubmitted when form is valid', () => {
    const store = TestBed.inject(Store);
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    component.form.patchValue({ login: 'user1', password: 'user1' });
    component.submit();
    expect(dispatchSpy).toHaveBeenCalledWith(authActions.clearError());
    expect(dispatchSpy).toHaveBeenCalledWith(
      authActions.loginSubmitted({ login: 'user1', password: 'user1' }),
    );
  });
});
