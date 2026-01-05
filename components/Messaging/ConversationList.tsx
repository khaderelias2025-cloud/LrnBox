
import { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, onSelect }) => {
  return (
    <div className="space-y-2">
      {conversations.map(convo => (
        <div key={convo.id} onClick={() => onSelect(convo.id)} className="p-2 rounded-lg cursor-pointer hover:bg-gray-700">
          <p className="font-bold">{convo.participantId}</p>
          <p className="text-sm text-gray-400">{convo.lastMessage}</p>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
