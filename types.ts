
export interface User {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  followers: any[];
  following: any[];
  streak: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
}

export interface Box {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  lessons: Lesson[];
}

export interface Conversation {
  id: string;
  participantId: string;
  lastMessage: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
}
