
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../mock-db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { eventId } = req.query;
  const { userId } = req.body;

  const event = db.events.find(e => e.id === eventId);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  event.isJoined = !event.isJoined;
  event.attendees = event.isJoined ? event.attendees + 1 : event.attendees - 1;

  res.status(200).json(event);
}
