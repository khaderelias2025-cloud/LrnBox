
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, boxId } = req.body;

  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const favorites = user.favoriteBoxIds || [];
  if (favorites.includes(boxId)) {
    user.favoriteBoxIds = favorites.filter(id => id !== boxId);
  } else {
    user.favoriteBoxIds = [...favorites, boxId];
  }

  res.status(200).json({ message: 'Favorite toggled' });
}
