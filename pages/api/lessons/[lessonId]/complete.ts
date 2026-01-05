
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../mock-db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { lessonId } = req.query;
  const { userId } = req.body;

  db.boxes.forEach(box => {
    const lesson = box.lessons.find(l => l.id === lessonId);
    if (lesson) {
      const completedByUserIds = lesson.completedByUserIds || [];
      if (!completedByUserIds.includes(userId)) {
        lesson.isCompleted = true;
        lesson.completionCount = (lesson.completionCount || 0) + 1;
        lesson.completedByUserIds = [...completedByUserIds, userId];
      }
    }
  });

  res.status(200).json({ message: 'Lesson completed' });
}
