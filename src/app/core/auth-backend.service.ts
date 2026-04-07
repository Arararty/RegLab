import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { StorageService } from './storage.service';
import { User } from '../models/user.model';

type StoredAuth = Readonly<{ users: ReadonlyArray<User> }>;

const AUTH_KEY = 'reglab.auth.v1';
const AUTH_SESSION_KEY = 'reglab.auth.session.v1';
const DEFAULT_USERS: ReadonlyArray<User> = [
  { login: 'user1', password: 'user1' },
  { login: 'user2', password: 'user2' },
  { login: 'user3', password: 'user 3' },
];

@Injectable({ providedIn: 'root' })
export class AuthBackendService {
  constructor(private readonly storage: StorageService) {
    this.ensureSeed();
  }

  getCurrentUser(): User | null {
    return this.storage.getSessionJson<User | null>(AUTH_SESSION_KEY, null);
  }

  loginLocal(login: string, password: string): Observable<User> {
    const state = this.storage.getJson<StoredAuth>(AUTH_KEY, { users: [] });
    const found = state.users.find((user) => user.login === login);

    if (!found || found.password !== password) {
      return throwError(() => new Error('Неверный логин или пароль')).pipe(delay(300));
    }

    this.storage.setSessionJson(AUTH_SESSION_KEY, found);
    return of(found).pipe(delay(300));
  }

  logoutLocal(): Observable<void> {
    this.storage.removeSession(AUTH_SESSION_KEY);
    return of(void 0).pipe(delay(150));
  }

  getUserByLogin(login: string): User | null {
    const trimedLogin = login.trim().toLowerCase();
    if (!trimedLogin) return null;
    const state = this.storage.getJson<StoredAuth>(AUTH_KEY, { users: [] });
    return state.users.find((user) => user.login.trim().toLowerCase() === trimedLogin) ?? null;
  }

  private ensureSeed(): void {
    const state = this.storage.getJson<StoredAuth>(AUTH_KEY, { users: [] });
    const merged = [...state.users];
    for (const user of DEFAULT_USERS) {
      if (!merged.some((item) => item.login === user.login)) merged.push(user);
    }
    this.storage.setJson<StoredAuth>(AUTH_KEY, { users: merged });
  }
}
