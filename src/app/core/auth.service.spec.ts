import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { AuthBackendService } from './auth-backend.service';
import { ChatBackendService } from './chat-backend.service';
import { fakeRestApiInterceptor } from './fake-rest-api.interceptor';
import { StorageService } from './storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let storage: StorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        AuthBackendService,
        ChatBackendService,
        StorageService,
        provideHttpClient(withInterceptors([fakeRestApiInterceptor])),
      ],
    });

    service = TestBed.inject(AuthService);
    storage = TestBed.inject(StorageService);
  });

  it('seeds default users for login', async () => {
    const u1 = await firstValueFrom(service.login('user1', 'user1'));
    expect(u1.login).toBe('user1');
    const u3 = await firstValueFrom(service.login('user3', 'user 3'));
    expect(u3.login).toBe('user3');
  });

  it('clears current user on logout', async () => {
    await firstValueFrom(service.login('user1', 'user1'));
    await firstValueFrom(service.logout());

    const currentUser = storage.getSessionJson<unknown>('reglab.auth.session.v1', null);
    expect(currentUser).toBeNull();
  });

  it('allows login after user is appended to auth store', async () => {
    const authStoreKey = 'reglab.auth.v1';
    const state = storage.getJson<{ users: User[] }>(authStoreKey, { users: [] });
    storage.setJson(authStoreKey, {
      users: [...state.users, { login: 'new-user', password: 'pass-123' }],
    });
    const user = await firstValueFrom(service.login('new-user', 'pass-123'));
    expect(user.login).toBe('new-user');
  });
});
