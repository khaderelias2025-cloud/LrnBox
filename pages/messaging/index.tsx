
import { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import ConversationList from '../../components/Messaging/ConversationList';
import MessageView from '../../components/Messaging/MessageView';
import { Conversation, Message, User } from '../../types';
import { MOCK_CONVERSATIONS, MOCK_USERS } from '../../constants';

const MessagingPage = () => {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  const handleSend = (text: string) => {
    // Implement send logic
  };

  const conversationsWithUsers: (Conversation & { user: User | undefined })[] = MOCK_CONVERSATIONS.map(convo => ({
    ...convo,
    user: MOCK_USERS.find(u => u.id === convo.participantId)
  }));

  const selectedConversation = conversationsWithUsers.find(c => c.id === selectedConvo);

  return (
    <Layout>
      <div className="grid grid-cols-3 gap-4 h-full">
        <div className="col-span-1 bg-gray-800 p-4 rounded-lg">
          <ConversationList conversations={conversationsWithUsers} onSelect={setSelectedConvo} />
        </div>
        <div className="col-span-2 bg-gray-800 p-4 rounded-lg">
          {selectedConversation ? (
            <MessageView messages={selectedConversation.messages as unknown as Message[]} onSend={handleSend} />
          ) : (
            <div className="flex items-center justify-center h-full">Select a conversation</div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MessagingPage;
