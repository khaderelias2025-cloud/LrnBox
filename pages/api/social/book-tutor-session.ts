
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';
import { TutorSession } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session: TutorSession = req.body;
  db.tutorSessions.unshift(session);

  res.status(201).json(session);
}
