
import { Box, User, Transaction, Notification, Conversation, Event, Reminder, Group } from '../types';
import { 
  MOCK_BOXES, 
  MOCK_USERS, 
  MOCK_TRANSACTIONS, 
  MOCK_NOTIFICATIONS, 
  MOCK_CONVERSATIONS, 
  MOCK_EVENTS, 
  MOCK_REMINDERS,
  MOCK_GROUPS
} from '../constants';

const KEYS = {
  BOXES: 'lrnbox_boxes',
  USERS: 'lrnbox_users',
  CURRENT_USER: 'lrnbox_current_user',
  TRANSACTIONS: 'lrnbox_transactions',
  NOTIFICATIONS: 'lrnbox_notifications',
  CONVERSATIONS: 'lrnbox_conversations',
  EVENTS: 'lrnbox_events',
  REMINDERS: 'lrnbox_reminders',
  GROUPS: 'lrnbox_groups'
};

const load = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return defaultValue;
  }
};

const save = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}`, e);
  }
};

export const storageService = {
  initialize: () => {
    if (!localStorage.getItem(KEYS.BOXES)) save(KEYS.BOXES, MOCK_BOXES);
    if (!localStorage.getItem(KEYS.USERS)) save(KEYS.USERS, MOCK_USERS);
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) save(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) save(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    if (!localStorage.getItem(KEYS.CONVERSATIONS)) save(KEYS.CONVERSATIONS, MOCK_CONVERSATIONS);
    if (!localStorage.getItem(KEYS.EVENTS)) save(KEYS.EVENTS, MOCK_EVENTS);
    if (!localStorage.getItem(KEYS.REMINDERS)) save(KEYS.REMINDERS, MOCK_REMINDERS);
    if (!localStorage.getItem(KEYS.GROUPS)) save(KEYS.GROUPS, MOCK_GROUPS);
  },

  getBoxes: (): Box[] => load(KEYS.BOXES, MOCK_BOXES),
  getUsers: (): User[] => load(KEYS.USERS, MOCK_USERS),
  getCurrentUser: (): User | null => load(KEYS.CURRENT_USER, null),
  getTransactions: (): Transaction[] => load(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS),
  getNotifications: (): Notification[] => load(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS),
  getConversations: (): Conversation[] => load(KEYS.CONVERSATIONS, MOCK_CONVERSATIONS),
  getEvents: (): Event[] => load(KEYS.EVENTS, MOCK_EVENTS),
  getReminders: (): Reminder[] => load(KEYS.REMINDERS, MOCK_REMINDERS),
  getGroups: (): Group[] => load(KEYS.GROUPS, MOCK_GROUPS),

  saveBoxes: (boxes: Box[]) => save(KEYS.BOXES, boxes),
  saveUsers: (users: User[]) => save(KEYS.USERS, users),
  saveCurrentUser: (user: User | null) => save(KEYS.CURRENT_USER, user),
  saveTransactions: (txs: Transaction[]) => save(KEYS.TRANSACTIONS, txs),
  saveNotifications: (notifs: Notification[]) => save(KEYS.NOTIFICATIONS, notifs),
  saveConversations: (convos: Conversation[]) => save(KEYS.CONVERSATIONS, convos),
  saveEvents: (events: Event[]) => save(KEYS.EVENTS, events),
  saveReminders: (reminders: Reminder[]) => save(KEYS.REMINDERS, reminders),
  saveGroups: (groups: Group[]) => save(KEYS.GROUPS, groups),
  
  clearSession: () => localStorage.removeItem(KEYS.CURRENT_USER),

  createBackup: (): string => {
    const backup: Record<string, any> = {};
    Object.values(KEYS).forEach(key => {
      backup[key] = localStorage.getItem(key);
    });
    return JSON.stringify(backup);
  },

  restoreBackup: (jsonString: string): boolean => {
    try {
      const backup = JSON.parse(jsonString);
      Object.values(KEYS).forEach(key => {
        if (backup[key]) {
          localStorage.setItem(key, backup[key]);
        }
      });
      return true;
    } catch (e) {
      return false;
    }
  }
};
