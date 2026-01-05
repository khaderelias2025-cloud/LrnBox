
import { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import ConversationList from '../../components/Messaging/ConversationList';
import MessageView from '../../components/Messaging/MessageView';
import { Conversation, Message } from '../../types';

const conversations: Conversation[] = [
  { id: '1', participantId: 'User2', lastMessage: 'Hey there!' },
  { id: '2', participantId: 'User3', lastMessage: 'See you tomorrow' },
];

const messages: { [key: string]: Message[] } = {
  '1': [
    { id: '1', text: 'Hey there!', senderId: 'User2' },
    { id: '2', text: 'Hi! How are you?', senderId: 'me' },
  ],
  '2': [
    { id: '1', text: 'See you tomorrow', senderId: 'User3' },
  ],
};

const MessagingPage = () => {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  const handleSend = (text: string) => {
    // Implement send logic
  };

  return (
    <Layout>
      <div className="grid grid-cols-3 gap-4 h-full">
        <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
          <ConversationList conversations={conversations} onSelect={setSelectedConvo} />
        </div>
        <div className="col-span-2 bg-gray-800 p-4 rounded-lg">
          {selectedConvo ? (
            <MessageView messages={messages[selectedConvo]} onSend={handleSend} />
          ) : (
            <div className="flex items-center justify-center h-full">Select a conversation</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MessagingPage;
