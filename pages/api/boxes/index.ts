
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../mock-db';
import { Box } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return res.status(200).json(db.boxes);
    case 'POST':
      const newBox: Box = { ...req.body, id: `b-${Date.now()}` };
      db.boxes.unshift(newBox);
      return res.status(201).json(newBox);
    case 'PUT':
      const updatedBox: Box = req.body;
      db.boxes = db.boxes.map(b => b.id === updatedBox.id ? updatedBox : b);
      return res.status(200).json(updatedBox);
    case 'DELETE':
      const { boxId } = req.query;
      db.boxes = db.boxes.filter(b => b.id !== boxId);
      return res.status(204).end();
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
