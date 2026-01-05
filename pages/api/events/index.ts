
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';
import { Event } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return res.status(200).json(db.events);
    case 'POST':
      const newEvent: Event = { ...req.body, id: `e-${Date.now()}` };
      db.events.unshift(newEvent);
      return res.status(201).json(newEvent);
    case 'PUT':
      const updatedEvent: Event = req.body;
      db.events = db.events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
      return res.status(200).json(updatedEvent);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
