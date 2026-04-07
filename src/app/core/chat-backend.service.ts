import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { StorageService } from './storage.service';
import { Channel, ChatUser, Message, UserChannel } from '../models/chat.model';

type ChatDb = Readonly<{
  users: ReadonlyArray<ChatUser>;
  channels: ReadonlyArray<Channel>;
  userChannels: ReadonlyArray<UserChannel>;
  messages: ReadonlyArray<Message>;
}>;

const CHAT_DB_KEY = 'reglab.chat-db.v1';

export const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000001';

@Injectable({ providedIn: 'root' })
export class ChatBackendService {
  constructor(private readonly storage: StorageService) {
    this.ensureSeed();
  }

  getChannelsForMember(userId: string): Observable<ReadonlyArray<Channel>> {
    const db = this.readDb();
    const channelIds = new Set(
      db.userChannels.filter((user) => user.userId === userId).map((user) => user.channelId),
    );
    const list = db.channels.filter((channel) => channelIds.has(channel.id));
    const sorted = [...list].sort((channelA, channelB) => {
      if (channelA.id === 'general' || channelA.name === 'general') return -1;
      if (channelB.id === 'general' || channelB.name === 'general') return 1;
      if (channelA.id === GENERAL_CHANNEL_ID) return -1;
      if (channelB.id === GENERAL_CHANNEL_ID) return 1;
      return channelA.name.localeCompare(channelB.name);
    });
    return of(sorted).pipe(delay(250));
  }

  ensureChatUserAndSync(login: string, password: string): Observable<ChatUser> {
    let db = this.readDb();
    db = this.ensureGeneralChannel(db);

    let chatUser = db.users.find((user) => user.username === login);
    let users = db.users;
    if (!chatUser) {
      chatUser = {
        id: crypto.randomUUID(),
        username: login,
        password,
        isOnline: true,
      };
      users = [...users, chatUser];
    }

    const general = db.channels.find(
      (channel) =>
        channel.id === GENERAL_CHANNEL_ID ||
        channel.id === 'general' ||
        channel.name.toLowerCase() === 'general',
    )!;

    let userChannels = db.userChannels;
    const hasGeneralLink = userChannels.some(
      (userChannel) => userChannel.userId === chatUser!.id && userChannel.channelId === general.id,
    );
    if (!hasGeneralLink) {
      userChannels = [...userChannels, { userId: chatUser!.id, channelId: general.id }];
    }

    this.addToLocalstorage({ ...db, users, userChannels });

    return of(chatUser).pipe(delay(200));
  }

  getUsers(): Observable<ReadonlyArray<ChatUser>> {
    return of(this.readDb().users).pipe(delay(250));
  }

  getUsersInChannel(channelId: string): Observable<ReadonlyArray<ChatUser>> {
    const db = this.readDb();
    const ids = new Set(
      db.userChannels
        .filter((userChannel) => userChannel.channelId === channelId)
        .map((userChannel) => userChannel.userId),
    );
    const users = db.users.filter((user) => ids.has(user.id));
    return of(users).pipe(delay(150));
  }

  getMessages(channelId: string): Observable<ReadonlyArray<Message>> {
    const data = this.readDb().messages.filter((message) => message.channelId === channelId);
    return of(data).pipe(delay(250));
  }

  sendMessage(channelId: string, fromUserId: string, content: string): Observable<Message> {
    const db = this.readDb();
    const message: Message = {
      id: crypto.randomUUID(),
      channelId,
      fromUser: fromUserId,
      content,
    };

    this.addToLocalstorage({
      ...db,
      messages: [...db.messages, message],
    });

    return of(message).pipe(delay(150));
  }

  createChannel(name: string, creatorUserId: string): Observable<Channel> {
    const db = this.readDb();
    const id = crypto.randomUUID();
    const channel: Channel = { id, name };

    const userChannels: UserChannel[] = [
      ...db.userChannels,
      { userId: creatorUserId, channelId: id },
    ];

    this.addToLocalstorage({
      ...db,
      channels: [...db.channels, channel],
      userChannels,
    });

    return of(channel).pipe(delay(200));
  }

  addUserToChannel(channelId: string, userId: string): Observable<Channel> {
    const db = this.readDb();
    const selectedChannel = db.channels.find((channel) => channel.id === channelId);
    if (!selectedChannel) {
      return of({ id: channelId, name: '' }).pipe(delay(200));
    }

    const exists = db.userChannels.some(
      (userChannel) => userChannel.userId === userId && userChannel.channelId === channelId,
    );
    const userChannels = exists ? db.userChannels : [...db.userChannels, { userId, channelId }];

    this.addToLocalstorage({ ...db, userChannels });

    return of(selectedChannel).pipe(delay(200));
  }

  private ensureGeneralChannel(db: ChatDb): ChatDb {
    const hasGeneral = db.channels.some(
      (channel) =>
        channel.id === GENERAL_CHANNEL_ID ||
        channel.id === 'general' ||
        channel.name.toLowerCase() === 'general',
    );
    if (hasGeneral) return db;
    return {
      ...db,
      channels: [...db.channels, { id: GENERAL_CHANNEL_ID, name: 'general' }],
    };
  }

  private addToLocalstorage(next: ChatDb): void {
    this.storage.setJson(CHAT_DB_KEY, next);
  }

  private readDb(): ChatDb {
    const raw = this.storage.getJson<Partial<ChatDb>>(CHAT_DB_KEY, {});
    return {
      users: raw.users ?? [],
      channels: raw.channels ?? [],
      userChannels: raw.userChannels ?? [],
      messages: raw.messages ?? [],
    };
  }

  private ensureSeed(): void {
    if (this.readDb().channels.length > 0) {
      return;
    }

    const channels: Channel[] = [{ id: GENERAL_CHANNEL_ID, name: 'general' }];
    const users: ChatUser[] = [];
    const userChannels: UserChannel[] = [];
    const messages: Message[] = [];

    this.addToLocalstorage({ users, channels, userChannels, messages });
  }
}
