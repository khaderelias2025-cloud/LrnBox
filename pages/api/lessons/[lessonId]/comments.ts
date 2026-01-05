
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../mock-db';
import { Comment } from '../../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { lessonId } = req.query;
  const { userId, content } = req.body;

  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const newComment: Comment = {
    id: `c-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: content,
    timestamp: 'Just now'
  };

  db.boxes.forEach(box => {
    const lesson = box.lessons.find(l => l.id === lessonId);
    if (lesson) {
      lesson.comments = [...(lesson.comments || []), newComment];
    }
  });

  res.status(201).json(newComment);
}
