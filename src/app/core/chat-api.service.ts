import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FAKE_API_BASE } from './api-base';
import { Channel, ChatUser, Message } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly base = `${FAKE_API_BASE}/chat`;

  constructor(private readonly http: HttpClient) {}

  getChannelsForMember(userId: string): Observable<ReadonlyArray<Channel>> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<ReadonlyArray<Channel>>(`${this.base}/channels`, { params });
  }

  ensureChatUserAndSync(login: string, password: string): Observable<ChatUser> {
    return this.http.post<ChatUser>(`${this.base}/profile/sync`, { login, password });
  }

  getUsers(): Observable<ReadonlyArray<ChatUser>> {
    return this.http.get<ReadonlyArray<ChatUser>>(`${this.base}/users`);
  }

  getUsersInChannel(channelId: string): Observable<ReadonlyArray<ChatUser>> {
    return this.http.get<ReadonlyArray<ChatUser>>(`${this.base}/channels/${channelId}/members`);
  }

  getMessages(channelId: string): Observable<ReadonlyArray<Message>> {
    return this.http.get<ReadonlyArray<Message>>(`${this.base}/channels/${channelId}/messages`);
  }

  sendMessage(channelId: string, fromUserId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.base}/channels/${channelId}/messages`, {
      fromUserId,
      content,
    });
  }

  createChannel(name: string, creatorUserId: string): Observable<Channel> {
    return this.http.post<Channel>(`${this.base}/channels`, { name, creatorUserId });
  }

  addUserToChannel(channelId: string, userId: string): Observable<Channel> {
    return this.http.post<Channel>(`${this.base}/channels/${channelId}/members`, { userId });
  }
}
