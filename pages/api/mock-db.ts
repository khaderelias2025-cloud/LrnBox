
import { User, Box, Lesson, Transaction, Notification, Conversation, Message, TutorSession, ViewState, Comment, Event, Group } from '../../types';

let users: User[] = [];
let boxes: Box[] = [];
let lessons: Lesson[] = [];
let transactions: Transaction[] = [];
let notifications: Notification[] = [];
let conversations: Conversation[] = [];
let messages: Message[] = [];
let tutorSessions: TutorSession[] = [];
let viewStates: ViewState[] = [];
let comments: Comment[] = [];
let events: Event[] = [];
let groups: Group[] = [];

export const db = {
  users,
  boxes,
  lessons,
  transactions,
  notifications,
  conversations,
  messages,
  tutorSessions,
  viewStates,
  comments,
  events,
  groups,
};
