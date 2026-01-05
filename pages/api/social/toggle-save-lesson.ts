
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, lessonId } = req.body;

  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const saved = user.savedLessonIds || [];
  if (saved.includes(lessonId)) {
    user.savedLessonIds = saved.filter(id => id !== lessonId);
  } else {
    user.savedLessonIds = [...saved, lessonId];
  }

  res.status(200).json({ message: 'Lesson save toggled' });
}
