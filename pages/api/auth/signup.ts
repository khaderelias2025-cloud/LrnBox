
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../mock-db';
import { User } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const userData: Partial<User> = req.body;

  const newUser: User = {
    id: `u-${Date.now()}`,
    name: userData.name || '',
    handle: userData.handle?.startsWith('@') ? userData.handle : `@${userData.handle}`,
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

  db.users.push(newUser);

  res.status(201).json(newUser);
}
