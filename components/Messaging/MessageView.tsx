
import { Message } from '../../types';

interface MessageViewProps {
  messages: Message[];
  onSend: (text: string) => void;
}

const MessageView: React.FC<MessageViewProps> = ({ messages, onSend }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`p-2 rounded-lg ${msg.senderId === 'me' ? 'bg-blue-600 self-end' : 'bg-gray-700 self-start'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="p-4">
        <input
          type="text"
          className="w-full p-2 bg-gray-700 rounded-lg"
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSend(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};

export default MessageView;
