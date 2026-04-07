import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, mergeMap, of, throwError } from 'rxjs';

import { FAKE_API_BASE } from './api-base';
import { AuthBackendService } from './auth-backend.service';
import { ChatBackendService } from './chat-backend.service';

function pathnameOnly(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new URL(url).pathname;
  }
  const queryIndex = url.indexOf('?');
  return queryIndex >= 0 ? url.slice(0, queryIndex) : url;
}

function jsonBody<T>(req: HttpRequest<unknown>): T {
  return req.body as T;
}

function asHttp<T>(source: Observable<T>): Observable<HttpResponse<T>> {
  return source.pipe(
    mergeMap((body) => of(new HttpResponse<T>({ status: 200, body }))),
    catchError((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Ошибка';
      const status = message === 'Неверный логин или пароль' ? 401 : 400;
      return throwError(
        () =>
          new HttpErrorResponse({
            status,
            statusText: message,
            error: { message },
          }),
      );
    }),
  );
}

export const fakeRestApiInterceptor: HttpInterceptorFn = (req, next) => {
  const path = pathnameOnly(req.url);
  if (!path.startsWith(FAKE_API_BASE)) {
    return next(req);
  }

  const rel = path.slice(FAKE_API_BASE.length) || '/';
  const auth = inject(AuthBackendService);
  const chat = inject(ChatBackendService);

  try {
    if (rel === '/auth/login' && req.method === 'POST') {
      const { login, password } = jsonBody<{ login: string; password: string }>(req);
      return asHttp(auth.loginLocal(login, password));
    }

    if (rel === '/auth/logout' && req.method === 'POST') {
      return asHttp(auth.logoutLocal());
    }

    if (rel === '/chat/profile/sync' && req.method === 'POST') {
      const { login, password } = jsonBody<{ login: string; password: string }>(req);
      return asHttp(chat.ensureChatUserAndSync(login, password));
    }

    if (rel === '/chat/channels' && req.method === 'GET') {
      const userId = req.params.get('userId');
      if (!userId) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: { message: 'Требуется query-параметр userId' },
            }),
        );
      }
      return asHttp(chat.getChannelsForMember(userId));
    }

    if (rel === '/chat/channels' && req.method === 'POST') {
      const { name, creatorUserId } = jsonBody<{ name: string; creatorUserId: string }>(req);
      return asHttp(chat.createChannel(name, creatorUserId));
    }

    if (rel === '/chat/users' && req.method === 'GET') {
      return asHttp(chat.getUsers());
    }

    const messagesMatch = /^\/chat\/channels\/([^/]+)\/messages$/.exec(rel);
    if (messagesMatch && req.method === 'GET') {
      return asHttp(chat.getMessages(messagesMatch[1]));
    }
    if (messagesMatch && req.method === 'POST') {
      const { fromUserId, content } = jsonBody<{ fromUserId: string; content: string }>(req);
      return asHttp(chat.sendMessage(messagesMatch[1], fromUserId, content));
    }

    const membersMatch = /^\/chat\/channels\/([^/]+)\/members$/.exec(rel);
    if (membersMatch && req.method === 'GET') {
      return asHttp(chat.getUsersInChannel(membersMatch[1]));
    }
    if (membersMatch && req.method === 'POST') {
      const { userId } = jsonBody<{ userId: string }>(req);
      return asHttp(chat.addUserToChannel(membersMatch[1], userId));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка';
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 400,
          statusText: message,
          error: { message },
        }),
    );
  }

  return throwError(
    () =>
      new HttpErrorResponse({
        status: 404,
        error: { message: `Неизвестный эндпоинт: ${req.method} ${rel}` },
      }),
  );
};
