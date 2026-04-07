import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FAKE_API_BASE } from './api-base';
import { AuthBackendService } from './auth-backend.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly backend: AuthBackendService,
  ) {}

  getCurrentUser(): User | null {
    return this.backend.getCurrentUser();
  }

  login(login: string, password: string): Observable<User> {
    return this.http.post<User>(`${FAKE_API_BASE}/auth/login`, { login, password });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${FAKE_API_BASE}/auth/logout`, {});
  }

  getUserByLogin(login: string): User | null {
    return this.backend.getUserByLogin(login);
  }
}
