
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';
import { Transaction } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.query;
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Add some mock transactions for demo purposes
  if (db.transactions.length === 0) {
    const mockTransactions: Transaction[] = [
      {
        id: 't-1',
        type: 'credit',
        amount: 200,
        description: 'Initial Points',
        timestamp: '2024-07-15'
      },
      {
        id: 't-2',
        type: 'debit',
        amount: 50,
        description: 'Bought a hint for a lesson',
        timestamp: '2024-07-16'
      }
    ];
    db.transactions.push(...mockTransactions);
  }

  res.status(200).json({ points: user.points, transactions: db.transactions });
}
