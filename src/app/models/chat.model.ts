export type ChatUser = Readonly<{
  id: string;
  username: string;
  password: string;
  isOnline: boolean;
}>;

export type Channel = Readonly<{
  id: string;
  name: string;
}>;

export type UserChannel = Readonly<{
  userId: string;
  channelId: string;
}>;

export type Message = Readonly<{
  id: string;
  fromUser: string;
  channelId: string;
  content: string;
}>;
