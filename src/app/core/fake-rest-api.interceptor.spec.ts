import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { FAKE_API_BASE } from './api-base';
import { AuthBackendService } from './auth-backend.service';
import { ChatBackendService } from './chat-backend.service';
import { fakeRestApiInterceptor } from './fake-rest-api.interceptor';
import { StorageService } from './storage.service';

describe('Fake REST API contract (HttpClientTestingModule)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('POST /auth/login sends JSON body', async () => {
    const body = { login: 'testuser', password: 'testpass' };
    const p = firstValueFrom(
      http.post<{ login: string }>(`${FAKE_API_BASE}/auth/login`, body),
    );
    const req = httpMock.expectOne(`${FAKE_API_BASE}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(body);
    await p;
  });

  it('GET /chat/channels uses userId query param', async () => {
    const userId = 'member-1';
    const p = firstValueFrom(
      http.get(`${FAKE_API_BASE}/chat/channels`, { params: { userId } }),
    );
    const req = httpMock.expectOne(
      (request) =>
        request.url.includes('/chat/channels') && request.params.get('userId') === userId,
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
    await p;
  });
});

describe('fakeRestApiInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        AuthBackendService,
        ChatBackendService,
        provideHttpClient(withInterceptors([fakeRestApiInterceptor])),
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  it('serves chat users from localStorage-backed backend', async () => {
    const users = await firstValueFrom(http.get<unknown[]>(`${FAKE_API_BASE}/chat/users`));
    expect(Array.isArray(users)).toBe(true);
  });

  it('returns 401 for bad login', async () => {
    await expect(
      firstValueFrom(
        http.post(`${FAKE_API_BASE}/auth/login`, { login: 'nope', password: 'nope' }),
      ),
    ).rejects.toBeTruthy();
  });
});
