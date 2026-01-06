
import React, { useState, useEffect, useRef } from 'react';
import { Group, User, Box, Conversation, Event, Message } from '../types';
import { X, Users, Package, MessageCircle, Send, MoreHorizontal, Image as ImageIcon, Calendar, Clock, MapPin, Paperclip, Smile, Check, CheckCheck, Reply, Trash2, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import BoxCard from './BoxCard';
import { playMessageSound } from '../services/soundService';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohort: Group; 
  currentUser: User;
  allUsers: User[];
  sharedBoxes: Box[];
  sharedEvents?: Event[];
  conversation?: Conversation;
  onSendMessage: (text: string) => void;
  onViewBox: (boxId: string) => void;
  onViewEvent?: (eventId: string) => void;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '🙏'];

const CohortDetailModal: React.FC<GroupDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    cohort, 
    currentUser, 
    allUsers, 
    sharedBoxes, 
    sharedEvents = [],
    conversation, 
    onSendMessage,
    onViewBox,
    onViewEvent
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'content' | 'events' | 'chat'>('members');
  const [messageText, setMessageText] = useState('');
  
  // Rich Messaging State
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'file'; url: string; name: string } | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(conversation?.messages || []);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setLocalMessages(conversation?.messages || []);
  }, [conversation]);

  // Sound and Scroll Effect
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        }, 100);
    }

    if (conversation) {
        if (conversation.messages.length > lastMsgCountRef.current) {
            const lastMsg = conversation.messages[conversation.messages.length - 1];
            if (lastMsg.senderId === currentUser.id) {
                playMessageSound('sent');
            } else {
                playMessageSound('received');
            }
        }
        lastMsgCountRef.current = conversation.messages.length;
    }
  }, [activeTab, conversation?.messages?.length, conversation, currentUser.id]);

  if (!isOpen) return null;

  const members = allUsers.filter(u => cohort.memberIds.includes(u.id));
  const creator = allUsers.find(u => u.id === cohort.creatorId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const isImage = file.type.startsWith('image/');
          const url = URL.createObjectURL(file);
          setAttachment({
              type: isImage ? 'image' : 'file',
              url,
              name: file.name
          });
      }
  };

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageText.trim() && !attachment) return;
      
      const newMessage: Message = {
          id: `m-${Date.now()}`,
          senderId: currentUser.id,
          text: messageText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          replyTo: replyTo ? { 
              id: replyTo.id, 
              text: replyTo.text, 
              senderName: allUsers.find(u => u.id === replyTo.senderId)?.name || 'User' 
          } : undefined,
          attachment: attachment || undefined,
          status: 'sent'
      };

      setLocalMessages([...localMessages, newMessage]);
      onSendMessage(messageText || (attachment ? '[Attachment]' : ''));
      setMessageText('');
      setReplyTo(null);
      setAttachment(null);
  };

  const handleReaction = (msgId: string, emoji: string) => {
      setLocalMessages(prev => prev.map(m => {
          if (m.id === msgId) {
              const currentReactions = m.reactions || {};
              const newCount = (currentReactions[emoji] || 0) + 1;
              return { ...m, reactions: { ...currentReactions, [emoji]: newCount } };
          }
          return m;
      }));
      setHoveredMessageId(null);
  };

  const renderMembers = () => (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Group Members ({members.length})</h3>
      </div>
      <div className="space-y-2">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
            <div className="flex items-center gap-3">
              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                  {member.id === cohort.creatorId && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">Admin</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{member.handle}</p>
              </div>
            </div>
            {member.id !== currentUser.id && (
                <button className="text-xs font-bold text-primary-600 hover:underline">View Profile</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Shared Learning Boxes ({sharedBoxes.length})</h3>
        <p className="text-[10px] text-slate-400 font-medium italic">Available to all group members</p>
      </div>

      {sharedBoxes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {sharedBoxes.map(box => (
            <div 
                key={box.id} 
                onClick={() => onViewBox(box.id)} 
                className="group relative flex flex-col sm:flex-row gap-4 p-4 border border-slate-200 rounded-2xl hover:shadow-lg transition-all bg-white cursor-pointer hover:border-primary-200"
            >
                <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden shrink-0">
                    <img src={box.coverImage} alt={box.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate pr-2">{box.title}</h4>
                            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded uppercase">{box.category}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{box.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><BookOpen size={12} /> {box.lessons.length} Lessons</span>
                            <span className="flex items-center gap-1"><Users size={12} /> {box.subscribers} Learners</span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewBox(box.id);
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-primary-600 group-hover:bg-primary-600 group-hover:text-white px-3 py-1.5 rounded-lg transition-all"
                        >
                           Open Box <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Package size={48} className="mx-auto mb-3 text-slate-300" />
          <h4 className="font-bold text-slate-700">No content shared yet</h4>
          <p className="text-xs text-slate-500 mt-1">Learning boxes shared with this cohort will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderEvents = () => (
    <div className="p-4 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Group Events ({sharedEvents.length})</h3>
      {sharedEvents.length > 0 ? (
        <div className="space-y-3">
          {sharedEvents.map(event => (
            <div 
                key={event.id} 
                onClick={() => onViewEvent && onViewEvent(event.id)}
                className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow bg-white cursor-pointer hover:border-indigo-100"
            >
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600 font-bold shrink-0 border border-indigo-100 shadow-sm">
                    <span className="text-[10px] uppercase">{event.date.split(' ')[0]}</span>
                    <span className="text-lg leading-none mt-0.5">{event.date.split(' ')[1].replace(',','')}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{event.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                       <span className="flex items-center gap-1"><Clock size={12} /> {event.time}</span>
                       <span className="flex items-center gap-1"><MapPin size={12} /> {event.isOnline ? 'Online' : event.location || 'TBA'}</span>
                    </div>
                </div>
                <div className="text-slate-300">
                    <ExternalLink size={18} />
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Calendar size={48} className="mx-auto mb-3 text-slate-300" />
          <h4 className="font-bold text-slate-700">No events scheduled</h4>
          <p className="text-xs text-slate-500 mt-1">Check back later for group meetups and webinars.</p>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
      <div className="flex flex-col h-full absolute inset-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={chatContainerRef}>
              {localMessages.length > 0 ? (
                  localMessages.map(msg => {
                      const isMe = msg.senderId === currentUser.id;
                      const sender = allUsers.find(u => u.id === msg.senderId);
                      return (
                          <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group relative`} onMouseEnter={() => setHoveredMessageId(msg.id)} onMouseLeave={() => setHoveredMessageId(null)}>
                              {!isMe && (
                                  <img src={sender?.avatar || "https://via.placeholder.com/32"} alt={sender?.name} className="w-8 h-8 rounded-full self-end mb-1 object-cover" />
                              )}
                              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                  {!isMe && <span className="text-[10px] text-slate-500 ml-1 mb-0.5">{sender?.name || 'Unknown'}</span>}
                                  
                                  {hoveredMessageId === msg.id && (
                                        <div className={`absolute -top-8 ${isMe ? 'right-0' : 'left-10'} bg-white shadow-lg border border-slate-100 rounded-full flex p-1 gap-1 z-10 animate-in fade-in zoom-in duration-150`}>
                                            {REACTIONS.map(emoji => (
                                                <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="hover:bg-slate-100 p-1 rounded-full text-lg leading-none transition-transform hover:scale-125">{emoji}</button>
                                            ))}
                                            <div className="w-px bg-slate-200 mx-1"></div>
                                            <button onClick={() => setReplyTo(msg)} className="text-slate-400 hover:text-blue-500 p-1"><Reply size={14} /></button>
                                        </div>
                                  )}

                                  <div className={`relative p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-800 rounded-bl-none'}`}>
                                      {msg.replyTo && (
                                            <div className={`mb-2 pl-2 border-l-4 text-xs ${isMe ? 'border-white/30 text-white/80' : 'border-slate-300 text-slate-500'}`}>
                                                <span className="font-bold block">{msg.replyTo.senderName}</span>
                                                <span className="line-clamp-1">{msg.replyTo.text}</span>
                                            </div>
                                      )}
                                      
                                      {msg.attachment && (
                                            <div className="mb-2">
                                                {msg.attachment.type === 'image' ? (
                                                    <img src={msg.attachment.url} alt="attachment" className="rounded-lg max-h-32 object-cover" />
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-black/10 p-2 rounded">
                                                        <Paperclip size={16} /> <span className="underline">{msg.attachment.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                      )}

                                      {msg.text}

                                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className={`absolute -bottom-3 ${isMe ? 'left-0' : 'right-0'} flex gap-1`}>
                                                {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                    <span key={emoji} className="bg-white border border-slate-200 shadow-sm rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-0.5">
                                                        {emoji} <span className="font-bold text-slate-600">{count}</span>
                                                    </span>
                                                ))}
                                            </div>
                                      )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-1 mx-1 flex items-center gap-1">
                                      {msg.timestamp}
                                      {isMe && <CheckCheck size={12} className="text-slate-400" />}
                                  </span>
                              </div>
                          </div>
                      );
                  })
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <MessageCircle size={32} className="mb-2 opacity-50" />
                      <p className="text-sm">Start the conversation!</p>
                      <p className="text-xs">Say hello to the group.</p>
                  </div>
              )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              {replyTo && (
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-t-lg border-b border-slate-200 text-xs text-slate-600 mb-1">
                        <div>
                            <span className="font-bold mr-1">Replying to User</span>
                            <span className="truncate block max-w-[200px] opacity-70">{replyTo.text}</span>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={14} /></button>
                    </div>
              )}
              {attachment && (
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-t-lg border-b border-slate-200 text-xs text-slate-600 mb-1">
                        <div className="flex items-center gap-2">
                            {attachment.type === 'image' ? <ImageIcon size={14} /> : <Paperclip size={14} />}
                            <span className="truncate max-w-[200px]">{attachment.name}</span>
                        </div>
                        <button onClick={() => setAttachment(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={14} /></button>
                    </div>
              )}
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                  <div className="flex gap-1 text-slate-400">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-slate-100 rounded-full"><Paperclip size={20} /></button>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  </div>
                  <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:border-primary-500 focus:bg-white transition-colors"
                      placeholder="Message the group..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button 
                      type="submit"
                      disabled={!messageText.trim() && !attachment}
                      className="p-2 bg-primary-600 text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 hover:bg-primary-700 transition-colors"
                  >
                      <Send size={20} />
                  </button>
              </form>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] max-h-[800px] animate-in zoom-in duration-200">
        <div className="h-40 bg-slate-800 relative flex-shrink-0">
            {cohort.image ? (
                <img src={cohort.image} alt={cohort.name} className="w-full h-full object-cover opacity-60" />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-80" />
            )}
            <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 backdrop-blur-sm transition-all z-10">
                <X size={20} />
            </button>
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent text-white">
                <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-500/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">Group Workspace</span>
                </div>
                <h2 className="text-3xl font-bold">{cohort.name}</h2>
                <p className="text-sm opacity-90 line-clamp-1 mt-1">{cohort.description || "A collaborative space for learning and discussion."}</p>
            </div>
        </div>

        <div className="flex border-b border-slate-200 bg-white flex-shrink-0 overflow-x-auto no-scrollbar shadow-sm">
            <button 
                onClick={() => setActiveTab('members')}
                className={`flex-1 min-w-max py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'members' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Users size={18} /> Members
            </button>
            <button 
                onClick={() => setActiveTab('content')}
                className={`flex-1 min-w-max py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'content' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Package size={18} /> Shared Content
            </button>
            <button 
                onClick={() => setActiveTab('events')}
                className={`flex-1 min-w-max py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'events' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <Calendar size={18} /> Events
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 min-w-max py-4 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <MessageCircle size={18} /> Group Chat
            </button>
        </div>

        <div className="flex-1 relative overflow-hidden bg-white">
            {activeTab === 'members' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar">{renderMembers()}</div>}
            {activeTab === 'content' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar">{renderContent()}</div>}
            {activeTab === 'events' && <div className="absolute inset-0 overflow-y-auto custom-scrollbar">{renderEvents()}</div>}
            {activeTab === 'chat' && renderChat()}
        </div>
      </div>
    </div>
  );
};

export default CohortDetailModal;
