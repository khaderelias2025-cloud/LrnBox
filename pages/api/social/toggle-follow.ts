
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, targetId } = req.body;

  const currentUser = db.users.find(u => u.id === userId);
  const targetUser = db.users.find(u => u.id === targetId);

  if (!currentUser || !targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const following = currentUser.following || [];
  if (following.includes(targetId)) {
    currentUser.following = following.filter(id => id !== targetId);
    targetUser.followers = (targetUser.followers || []).filter(id => id !== userId);
  } else {
    currentUser.following = [...following, targetId];
    targetUser.followers = [...(targetUser.followers || []), userId];
  }

  res.status(200).json({ message: 'Follow toggled' });
}
