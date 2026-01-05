
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';
import { Group } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return res.status(200).json(db.groups);
    case 'POST':
      const newGroup: Group = { ...req.body, id: `g-${Date.now()}` };
      db.groups.unshift(newGroup);
      return res.status(201).json(newGroup);
    case 'PUT':
      const updatedGroup: Group = req.body;
      db.groups = db.groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
      return res.status(200).json(updatedGroup);
    case 'DELETE':
      const { groupId } = req.query;
      db.groups = db.groups.filter(g => g.id !== groupId);
      return res.status(204).end();
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
