import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TuiButton, TuiInput, TuiLoader, TuiTextfield } from '@taiga-ui/core';
import { TuiAvatar, TuiChip, TuiStatus, TuiTextarea } from '@taiga-ui/kit';
import { firstValueFrom, take } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { ChatApiService } from '../../core/chat-api.service';
import { Channel, ChatUser, Message } from '../../models/chat.model';
import { User } from '../../models/user.model';
import { authActions } from '../../store/auth/auth.actions';
import { selectAuthUser } from '../../store/auth/auth.selectors';

const CHAT_DB_KEY = 'reglab.chat-db.v1';

function pickChannelId(
  preferred: string | null | undefined,
  current: string | null | undefined,
  channels: ReadonlyArray<Channel>,
): string | null {
  const ok = (id: string | null | undefined) =>
    id && channels.some((channel) => channel.id === id) ? id : null;
  return ok(preferred) ?? ok(current) ?? channels[0]?.id ?? null;
}

type DisplayMessage = Message & { authorName: string };

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TuiTextfield,
    TuiButton,
    TuiInput,
    TuiLoader,
    TuiAvatar,
    TuiChip,
    TuiStatus,
    TuiTextarea,
  ],
  templateUrl: './chats.page.html',
  styleUrl: './chats.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatsPageComponent implements OnInit, OnDestroy {
  private readonly storageListener = (event: StorageEvent) => {
    if (event.key !== CHAT_DB_KEY) return;
    this.loadInitialData(this.selectedChatId() ?? undefined);
  };

  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ChatApiService);
  private readonly auth = inject(AuthService);

  private currentChatUserId: string | null = null;

  readonly user = toSignal(this.store.select(selectAuthUser), {
    initialValue: null as User | null,
  });

  readonly chats = signal<ReadonlyArray<Channel>>([]);
  readonly allChatUsers = signal<ReadonlyArray<ChatUser>>([]);
  readonly messages = signal<ReadonlyArray<Message>>([]);
  readonly channelMembers = signal<ReadonlyArray<ChatUser>>([]);
  readonly selectedChatId = signal<string | null>(null);

  readonly selectedChat = computed(() => {
    const id = this.selectedChatId();
    return id ? (this.chats().find((channel) => channel.id === id) ?? null) : null;
  });

  readonly displayMessages = computed<ReadonlyArray<DisplayMessage>>(() => {
    const users = this.allChatUsers();
    return this.messages().map((message) => ({
      ...message,
      authorName:
        users.find((chatUser) => chatUser.id === message.fromUser)?.username ?? message.fromUser,
    }));
  });

  readonly loadingChats = signal(false);
  readonly loadingMessages = signal(false);
  readonly sendingMessage = signal(false);
  readonly messagesPanelLoading = computed(() => this.loadingChats() || this.loadingMessages());

  readonly messagesLoaderHint = 'Загрузка сообщений...';
  readonly emptyChannelGifSrc = '/images/empty-channel.gif';

  readonly messageForm = this.fb.nonNullable.group({
    text: ['', [Validators.required, Validators.maxLength(500)]],
  });
  readonly channelForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });
  readonly userForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    window.addEventListener('storage', this.storageListener);
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  selectChat(chatId: string): void {
    this.selectedChatId.set(chatId);
    this.loadMessages(chatId);
    this.loadChannelMembers(chatId);
  }

  async send(): Promise<void> {
    if (this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const user = this.user();
    const content = this.messageForm.controls.text.value.trim();
    const chatId = this.selectedChatId();
    const fromUserId = this.currentChatUserId;
    if (!chatId || !user || !content || !fromUserId) return;

    this.sendingMessage.set(true);
    try {
      await firstValueFrom(this.api.sendMessage(chatId, fromUserId, content));
      await this.loadMessages(chatId);
    } finally {
      this.sendingMessage.set(false);
    }
    this.messageForm.reset({ text: '' });
  }

  async createChannel(): Promise<void> {
    if (this.channelForm.invalid) return;
    const name = this.channelForm.controls.name.value.trim();
    if (!name) return;
    if (!this.currentChatUserId) {
      return;
    }

    const channel = await firstValueFrom(this.api.createChannel(name, this.currentChatUserId));
    await this.loadInitialData(channel.id);
    this.channelForm.reset({ name: '' });
  }

  async addExistingUserToSelectedChannel(): Promise<void> {
    if (this.userForm.invalid) return;
    const username = this.userForm.controls.username.value.trim();
    if (!username) return;

    const currentChatId = this.selectedChatId();
    if (!currentChatId) {
      return;
    }

    const key = username.toLowerCase();
    const users = await firstValueFrom(this.api.getUsers());
    let target = users.find((chatUser) => chatUser.username.trim().toLowerCase() === key);

    if (!target) {
      const registered = this.auth.getUserByLogin(username);
      if (!registered) {
        return;
      }
      target = await firstValueFrom(
        this.api.ensureChatUserAndSync(registered.login, registered.password),
      );
    }

    await firstValueFrom(this.api.addUserToChannel(currentChatId, target.id));
    await this.loadInitialData(currentChatId);
    this.userForm.reset({ username: '' });
  }

  logout(): void {
    this.store.dispatch(authActions.logoutRequested());
  }

  private async loadInitialData(preferredChatId?: string): Promise<void> {
    this.loadingChats.set(true);
    try {
      const user = await firstValueFrom(this.store.select(selectAuthUser).pipe(take(1)));
      if (!user) {
        this.currentChatUserId = null;
        this.chats.set([]);
        this.allChatUsers.set([]);
        this.messages.set([]);
        this.channelMembers.set([]);
        this.selectedChatId.set(null);
        return;
      }

      const chatUser = await firstValueFrom(
        this.api.ensureChatUserAndSync(user.login, user.password),
      );
      this.currentChatUserId = chatUser.id;

      const [chats, users] = await Promise.all([
        firstValueFrom(this.api.getChannelsForMember(chatUser.id)),
        firstValueFrom(this.api.getUsers()),
      ]);
      this.chats.set(chats);
      this.allChatUsers.set(users);

      const nextId = pickChannelId(preferredChatId, this.selectedChatId(), chats);
      this.selectedChatId.set(nextId);
      if (nextId) {
        await Promise.all([this.loadMessages(nextId), this.loadChannelMembers(nextId)]);
      } else {
        this.messages.set([]);
        this.channelMembers.set([]);
      }
    } finally {
      this.loadingChats.set(false);
    }
  }

  private async loadMessages(chatId: string): Promise<void> {
    this.loadingMessages.set(true);
    try {
      this.messages.set(await firstValueFrom(this.api.getMessages(chatId)));
    } finally {
      this.loadingMessages.set(false);
    }
  }

  private async loadChannelMembers(channelId: string): Promise<void> {
    this.channelMembers.set(await firstValueFrom(this.api.getUsersInChannel(channelId)));
  }
}
