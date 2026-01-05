
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../mock-db';
import { Message, Conversation } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { senderId, participantId, text, groupId } = req.body;

  const user = db.users.find(u => u.id === senderId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const newMessage: Message = {
    id: `m-${Date.now()}`,
    senderId: user.id,
    text: text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'sent'
  };

  let convo = db.conversations.find(c => groupId ? c.groupId === groupId : (c.participantId === participantId && !c.groupId));

  if (convo) {
    convo.messages.push(newMessage);
    convo.lastMessage = text;
    convo.timestamp = 'Just now';
  } else {
    const newConvo: Conversation = {
      id: `c-${Date.now()}`,
      participantId: groupId ? '' : participantId,
      groupId: groupId,
      lastMessage: text,
      timestamp: 'Just now',
      unreadCount: 0,
      messages: [newMessage]
    };
    db.conversations.unshift(newConvo);
  }

  res.status(201).json(newMessage);
}
