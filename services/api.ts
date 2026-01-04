
import { storageService } from './storage';
import { User, Box, Lesson, Transaction, Notification, Conversation, TutorSession, ViewState } from '../types';

// Simulate network latency
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (handle: string): Promise<User> => {
      await delay(800);
      const users = storageService.getUsers();
      const user = users.find(u => u.handle === handle || u.handle === `@${handle}`);
      if (!user) throw new Error("User not found");
      
      const today = new Date().toDateString();
      if (user.lastLoginDate !== today) {
        // Daily login logic "server-side"
        user.points += 50;
        user.streak = (user.streak || 0) + 1;
        user.lastLoginDate = today;
        
        // Record transaction
        const tx: Transaction = {
          id: `t-streak-${Date.now()}`,
          type: 'credit',
          amount: 50,
          description: `Daily Login Bonus (Day ${user.streak})`,
          timestamp: new Date().toLocaleDateString()
        };
        const txs = storageService.getTransactions();
        storageService.saveTransactions([tx, ...txs]);
      }
      
      storageService.saveCurrentUser(user);
      return user;
    },
    signup: async (userData: Partial<User>): Promise<User> => {
      await delay(1000);
      const users = storageService.getUsers();
      if (users.find(u => u.handle === userData.handle)) throw new Error("Handle already taken");
      
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: userData.name || '',
        handle: userData.handle || '',
        avatar: userData.avatar || '',
        role: userData.role || 'student',
        bio: userData.bio || '',
        points: 100,
        followers: [],
        following: [],
        subscribedBoxIds: [],
        favoriteBoxIds: [],
        savedLessonIds: [],
        streak: 1,
        lastLoginDate: new Date().toDateString(),
        ...userData
      };
      
      storageService.saveUsers([...users, newUser]);
      storageService.saveCurrentUser(newUser);
      return newUser;
    }
  },

  content: {
    getBoxes: async (): Promise<Box[]> => {
      await delay(400);
      return storageService.getBoxes();
    },
    createBox: async (box: Box): Promise<Box> => {
      await delay(1200);
      const boxes = storageService.getBoxes();
      const updatedBoxes = [box, ...boxes];
      storageService.saveBoxes(updatedBoxes);
      return box;
    },
    updateBox: async (updatedBox: Box): Promise<Box> => {
      await delay(600);
      const boxes = storageService.getBoxes();
      const next = boxes.map(b => b.id === updatedBox.id ? updatedBox : b);
      storageService.saveBoxes(next);
      return updatedBox;
    },
    deleteBox: async (boxId: string): Promise<void> => {
      await delay(800);
      const boxes = storageService.getBoxes();
      storageService.saveBoxes(boxes.filter(b => b.id !== boxId));
    },
    addLesson: async (boxId: string, lesson: Lesson): Promise<Lesson> => {
      await delay(1000);
      const boxes = storageService.getBoxes();
      const box = boxes.find(b => b.id === boxId);
      if (!box) throw new Error("Box not found");
      
      box.lessons = [lesson, ...box.lessons];
      storageService.saveBoxes(boxes.map(b => b.id === boxId ? box : b));
      return lesson;
    },
    completeLesson: async (userId: string, lessonId: string): Promise<void> => {
      const boxes = storageService.getBoxes();
      let found = false;
      boxes.forEach(box => {
        const lesson = box.lessons.find(l => l.id === lessonId);
        if (lesson) {
          if (!lesson.completedByUserIds?.includes(userId)) {
            lesson.completedByUserIds = [...(lesson.completedByUserIds || []), userId];
            lesson.completionCount = (lesson.completionCount || 0) + 1;
            found = true;
          }
        }
      });
      if (found) storageService.saveBoxes(boxes);
    }
  },

  social: {
    toggleFollow: async (currentUserId: string, targetUserId: string): Promise<void> => {
      await delay(300);
      const users = storageService.getUsers();
      const currentUser = users.find(u => u.id === currentUserId);
      const targetUser = users.find(u => u.id === targetUserId);
      
      if (!currentUser || !targetUser) return;
      
      const isFollowing = currentUser.following.includes(targetUserId);
      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== targetUserId);
        targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
      } else {
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUserId);
      }
      
      storageService.saveUsers(users);
      storageService.saveCurrentUser(currentUser);
    },
    sendMessage: async (convo: Conversation): Promise<void> => {
      const convos = storageService.getConversations();
      const existing = convos.find(c => c.id === convo.id);
      if (existing) {
        Object.assign(existing, convo);
      } else {
        convos.unshift(convo);
      }
      storageService.saveConversations(convos);
    }
  },

  wallet: {
    purchasePoints: async (userId: string, amount: number): Promise<number> => {
      await delay(2000);
      const users = storageService.getUsers();
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      
      user.points += amount;
      
      const tx: Transaction = {
        id: `t-buy-${Date.now()}`,
        type: 'credit',
        amount: amount,
        description: `Purchased ${amount} Points Pack`,
        timestamp: new Date().toLocaleDateString()
      };
      
      const txs = storageService.getTransactions();
      storageService.saveTransactions([tx, ...txs]);
      storageService.saveUsers(users);
      storageService.saveCurrentUser(user);
      
      return user.points;
    }
  }
};
