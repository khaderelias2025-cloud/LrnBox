
import React, { useState, useEffect, useRef } from 'react';
import { Group, User, Box, Conversation, Event, Message } from '../types';
import { X, Users, Package, MessageCircle, Send, MoreHorizontal, Image as ImageIcon, Calendar, Clock, MapPin, Paperclip, Smile, Check, CheckCheck, Reply, Trash2, BookOpen, ExternalLink, ArrowRight, UserPlus, Search, Plus } from 'lucide-react';
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
  onEditGroup?: (group: Group) => void;
  onUpdateGroup?: (group: Group) => void;
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
    onViewEvent,
    onEditGroup,
    onUpdateGroup
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'content' | 'events' | 'chat'>('members');
  const [messageText, setMessageText] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'file'; url: string; name: string } | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(conversation?.messages || []);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef<number>(0);

  useEffect(() => {
      setLocalMessages(conversation?.messages || []);
  }, [conversation]);

  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
  const isCreator = cohort.creatorId === currentUser.id;

  // Filter users for quick add (followers/following not in group)
  const nonMembers = allUsers.filter(u => 
    !cohort.memberIds.includes(u.id) && 
    u.id !== currentUser.id &&
    u.role !== 'institute' &&
    (currentUser.following?.includes(u.id) || currentUser.followers?.includes(u.id)) &&
    (u.name.toLowerCase().includes(quickAddSearch.toLowerCase()) || u.handle.toLowerCase().includes(quickAddSearch.toLowerCase()))
  );

  const handleSend = (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageText.trim() && !attachment) return;
      onSendMessage(messageText || '[Attachment]');
      setMessageText('');
      setReplyTo(null);
      setAttachment(null);
  };

  const handleQuickAdd = (userId: string) => {
      if (onUpdateGroup) {
          onUpdateGroup({
              ...cohort,
              memberIds: [...cohort.memberIds, userId]
          });
      }
  };

  const renderMembers = () => (
    <div className="p-5 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Group Members ({members.length})</h3>
        <div className="flex gap-2">
            {isCreator && (
                <button 
                    onClick={() => setIsQuickAddOpen(!isQuickAddOpen)} 
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${isQuickAddOpen ? 'bg-slate-800 text-white shadow-inner' : 'text-primary-600 hover:text-primary-700 bg-primary-50'}`}
                >
                    {isQuickAddOpen ? <X size={14} /> : <UserPlus size={14} />} 
                    {isQuickAddOpen ? 'Close' : 'Add Members'}
                </button>
            )}
            {isCreator && onEditGroup && (
                <button onClick={() => onEditGroup(cohort)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <MoreHorizontal size={16} />
                </button>
            )}
        </div>
      </div>

      {isQuickAddOpen && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 animate-in slide-in-from-top-2 duration-300">
              <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-100 bg-white"
                    placeholder="Search followers..."
                    value={quickAddSearch}
                    onChange={e => setQuickAddSearch(e.target.value)}
                  />
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {nonMembers.length > 0 ? nonMembers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2">
                              <img src={user.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-100" alt="" />
                              <div className="min-w-0">
                                  <p className="font-bold text-slate-800 text-xs truncate">{user.name}</p>
                                  <p className="text-[10px] text-slate-500">{user.handle}</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => handleQuickAdd(user.id)}
                            className="bg-primary-600 text-white p-1.5 rounded-lg hover:bg-primary-700 transition-all active:scale-95 shadow-sm"
                          >
                              <Plus size={14} />
                          </button>
                      </div>
                  )) : (
                      <p className="text-center py-4 text-xs text-slate-400 italic">No connections found to add.</p>
                  )}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900 text-sm truncate">{member.name}</p>
                  {member.id === cohort.creatorId && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold border border-yellow-200">Admin</span>}
                </div>
                <p className="text-xs text-slate-500 truncate">{member.handle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="p-5 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Shared with Group ({sharedBoxes.length})</h3>
      {sharedBoxes.length > 0 ? (
        <div className="space-y-3">
          {sharedBoxes.map(box => (
            <div key={box.id} onClick={() => onViewBox(box.id)} className="flex gap-4 p-4 border border-slate-200 rounded-2xl hover:border-primary-300 hover:shadow-md transition-all bg-white cursor-pointer group shadow-sm">
                <img src={box.coverImage} alt="" className="w-24 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-slate-900 group-hover:text-primary-600 truncate">{box.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{box.description}</p>
                </div>
                <ArrowRight size={18} className="self-center text-slate-300 group-hover:text-primary-600" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"><Package size={40} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-400 text-sm">No boxes shared with this group yet.</p></div>
      )}
    </div>
  );

  const renderEvents = () => (
    <div className="p-5 space-y-4">
      <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Group Events ({sharedEvents.length})</h3>
      {sharedEvents.length > 0 ? (
        <div className="space-y-3">
          {sharedEvents.map(event => (
            <div key={event.id} onClick={() => onViewEvent?.(event.id)} className="flex items-center gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer bg-white shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-700 shrink-0 border border-indigo-100">
                <span className="text-[10px] font-bold uppercase">{event.date.split(' ')[0]}</span>
                <span className="text-lg font-bold">{event.date.split(' ')[1].replace(',', '')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-sm truncate">{event.title}</h4>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Clock size={10} /> {event.time}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"><Calendar size={40} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-400 text-sm">No upcoming events for this group.</p></div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[450px] bg-slate-50/30">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {localMessages.length > 0 ? (
                localMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const sender = allUsers.find(u => u.id === msg.senderId);
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && <img src={sender?.avatar} className="w-8 h-8 rounded-full object-cover self-end mb-1 border border-slate-200" alt="" />}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && <span className="text-[10px] text-slate-400 mb-0.5 ml-1">{sender?.name}</span>}
                                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-1">{msg.timestamp}</span>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageCircle size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">Welcome to {cohort.name} chat!</p>
                </div>
            )}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2">
            <input 
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                placeholder="Message group..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
            />
            <button type="submit" disabled={!messageText.trim()} className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 shadow-md active:scale-95">
                <Send size={20} />
            </button>
        </form>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
        
        {/* Dynamic Image Header */}
        <div className="relative h-48 flex-shrink-0 bg-slate-900">
          {cohort.image ? (
            <img src={cohort.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-primary-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full backdrop-blur-md transition-all z-20"><X size={20} /></button>
          
          <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
             <div className="flex items-center gap-4">
                {cohort.image ? (
                    <img src={cohort.image} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl" alt="" />
                ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center shadow-xl"><Users size={32} /></div>
                )}
                <div className="min-w-0">
                    <h2 className="font-bold text-2xl drop-shadow-md truncate">{cohort.name}</h2>
                    <div className="flex items-center gap-3 text-white/80 text-xs font-medium mt-1">
                        <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded backdrop-blur-md">{members.length} Members</span>
                        <span>•</span>
                        <span>Since {cohort.createdAt}</span>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white px-4 shrink-0 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('members')} className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'members' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Users size={18} /> Members</button>
            <button onClick={() => setActiveTab('chat')} className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'chat' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><MessageCircle size={18} /> Group Chat</button>
            <button onClick={() => setActiveTab('content')} className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'content' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Package size={18} /> Shared Content</button>
            <button onClick={() => setActiveTab('events')} className={`px-5 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'events' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Calendar size={18} /> Events</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'members' && renderMembers()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'content' && renderContent()}
            {activeTab === 'events' && renderEvents()}
        </div>
      </div>
    </div>
  );
};

export default CohortDetailModal;
