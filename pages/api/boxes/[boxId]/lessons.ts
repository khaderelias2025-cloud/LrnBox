
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';
import { Lesson } from '../../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { boxId } = req.query;
  const lessonData: Lesson = req.body;

  const box = db.boxes.find(b => b.id === boxId);

  if (!box) {
    return res.status(404).json({ message: 'Box not found' });
  }

  const newLesson: Lesson = { ...lessonData, id: `l-${Date.now()}`, boxId: boxId as string };
  box.lessons.push(newLesson);

  res.status(201).json(newLesson);
}
