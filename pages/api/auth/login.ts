
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../mock-db';
import { User, Transaction } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { handle } = req.body;
  const normalizedInput = handle.toLowerCase().trim();

  const user = db.users.find(u => {
    const uHandle = u.handle.toLowerCase();
    return uHandle === normalizedInput || uHandle === (normalizedInput.startsWith('@') ? normalizedInput : `@${normalizedInput}`);
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const today = new Date().toDateString();
  if (user.lastLoginDate !== today) {
    user.points += 50;
    user.streak = (user.streak || 0) + 1;
    user.lastLoginDate = today;

    const tx: Transaction = {
      id: `t-streak-${Date.now()}`,
      type: 'credit',
      amount: 50,
      description: `Daily Login Bonus (Day ${user.streak})`,
      timestamp: new Date().toLocaleDateString()
    };
    db.transactions.unshift(tx);
  }

  res.status(200).json(user);
}
