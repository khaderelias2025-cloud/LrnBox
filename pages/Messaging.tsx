
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Conversation, User, Group, Message } from '../types';
import { Send, MoreHorizontal, Image as ImageIcon, Paperclip, Search, Edit, X, UserPlus, MessageCircle, Users, ArrowLeft, Smile, Reply, Check, CheckCheck, Trash2 } from 'lucide-react';
import { playMessageSound } from '../services/soundService';

interface MessagingProps {
  currentUser: User;
  conversations: Conversation[];
  users: User[];
  initialParticipantId?: string | null;
  onSendMessage: (participantId: string, text: string) => void;
  groups?: Group[];
  onGroupMessage?: (groupId: string, text: string) => void;
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '🙏'];

const Messaging: React.FC<MessagingProps> = ({ currentUser, conversations, users, initialParticipantId, onSendMessage, groups = [], onGroupMessage }) => {
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'people' | 'groups'>('chats');
  const [isMobileChatView, setIsMobileChatView] = useState(false);
  
  // New Messaging State
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'file'; url: string; name: string } | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [localConversations, setLocalConversations] = useState<Conversation[]>(conversations); // Local state to handle optimistic updates for reactions/replies

  // New Chat State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatTab, setNewChatTab] = useState<'people' | 'groups'>('people');

  // Refs
  const lastConvoIdRef = useRef<string | null>(null);
  const lastMsgCountRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setLocalConversations(conversations);
  }, [conversations]);

  // Handle deep linking to a specific user for messaging
  useEffect(() => {
    if (initialParticipantId) {
        const existing = localConversations.find(c => c.participantId === initialParticipantId);
        if (existing) {
            setActiveConvoId(existing.id);
            setActiveTab('chats');
            setIsMobileChatView(true);
        } else {
            setActiveTab('people');
            setNewChatSearch(users.find(u => u.id === initialParticipantId)?.name || '');
        }
    } else if (!activeConvoId && localConversations.length > 0 && activeTab === 'chats' && window.innerWidth >= 768) {
        setActiveConvoId(localConversations[0].id);
    }
  }, [initialParticipantId, activeTab]);

  const activeConversation = localConversations.find(c => c.id === activeConvoId);
  const isGroupChat = !!activeConversation?.groupId;
  const activeGroup = isGroupChat ? groups.find(c => c.id === activeConversation?.groupId) : null;
  const activeUser = !isGroupChat && activeConversation ? users.find(u => u.id === activeConversation?.participantId) : null;

  // Sound Effect Logic
  useEffect(() => {
    if (activeConversation) {
        if (activeConversation.id !== lastConvoIdRef.current) {
            lastConvoIdRef.current = activeConversation.id;
            lastMsgCountRef.current = activeConversation.messages.length;
        } else {
            if (activeConversation.messages.length > lastMsgCountRef.current) {
                const lastMsg = activeConversation.messages[activeConversation.messages.length - 1];
                if (lastMsg.senderId === currentUser.id) {
                    playMessageSound('sent');
                } else {
                    playMessageSound('received');
                }
                lastMsgCountRef.current = activeConversation.messages.length;
            }
        }
    }
  }, [activeConversation, currentUser.id]);

  // Logic Helpers
  const connections = useMemo(() => {
    return users.filter(u => 
        u.id !== currentUser.id &&
        currentUser.following?.includes(u.id) &&
        currentUser.followers?.includes(u.id)
    );
  }, [users, currentUser]);

  const filteredConnections = connections.filter(u => 
    u.name.toLowerCase().includes(newChatSearch.toLowerCase()) ||
    u.handle.toLowerCase().includes(newChatSearch.toLowerCase())
  );

  const myGroups = useMemo(() => {
      return groups.filter(c => c.memberIds.includes(currentUser.id) || c.creatorId === currentUser.id);
  }, [groups, currentUser.id]);

  const filteredGroups = myGroups.filter(c => 
      c.name.toLowerCase().includes(newChatSearch.toLowerCase())
  );

  const handleStartConversation = (targetUserId: string) => {
      const existing = localConversations.find(c => c.participantId === targetUserId && !c.groupId);
      if (existing) {
          setActiveConvoId(existing.id);
          setActiveTab('chats');
      } else {
          onSendMessage(targetUserId, "👋 Hi!");
          setActiveTab('chats');
      }
      setIsNewChatModalOpen(false);
      setNewChatSearch('');
      setIsMobileChatView(true);
  };

  const handleStartGroupConversation = (groupId: string) => {
      const existing = localConversations.find(c => c.groupId === groupId);
      if (existing) {
          setActiveConvoId(existing.id);
          setActiveTab('chats');
      } else {
          if (onGroupMessage) onGroupMessage(groupId, "👋 Hello everyone!");
          setActiveTab('chats');
      }
      setIsNewChatModalOpen(false);
      setNewChatSearch('');
      setIsMobileChatView(true);
  };

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachment) return;
    
    if (activeConversation) {
        const newMessage: Message = {
            id: `m-${Date.now()}`,
            senderId: currentUser.id,
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            replyTo: replyTo ? { 
                id: replyTo.id, 
                text: replyTo.text, 
                senderName: users.find(u => u.id === replyTo.senderId)?.name || 'User' 
            } : undefined,
            attachment: attachment || undefined,
            status: 'sent'
        };

        // Optimistic Update
        const updatedConversations = localConversations.map(c => {
            if (c.id === activeConversation.id) {
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessage: attachment ? (inputText || 'Sent an attachment') : inputText,
                    timestamp: 'Just now'
                };
            }
            return c;
        });
        setLocalConversations(updatedConversations);

        // Simulate Delivered/Read Status
        setTimeout(() => {
             setLocalConversations(prev => prev.map(c => {
                 if (c.id === activeConversation.id) {
                     return {
                         ...c,
                         messages: c.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' } : m)
                     };
                 }
                 return c;
             }));
        }, 2000);

        // Call Parent (Legacy/Persistence)
        if (isGroupChat && activeGroup && onGroupMessage) {
            onGroupMessage(activeGroup.id, inputText || (attachment ? '[Attachment]' : ''));
        } else if (activeUser) {
            onSendMessage(activeUser.id, inputText || (attachment ? '[Attachment]' : ''));
        }
    }

    setInputText('');
    setReplyTo(null);
    setAttachment(null);
  };

  const handleReaction = (msgId: string, emoji: string) => {
      if (!activeConversation) return;
      
      const updatedConversations = localConversations.map(c => {
          if (c.id === activeConversation.id) {
              const updatedMessages = c.messages.map(m => {
                  if (m.id === msgId) {
                      const currentReactions = m.reactions || {};
                      const newCount = (currentReactions[emoji] || 0) + 1;
                      return { ...m, reactions: { ...currentReactions, [emoji]: newCount } };
                  }
                  return m;
              });
              return { ...c, messages: updatedMessages };
          }
          return c;
      });
      setLocalConversations(updatedConversations);
      setHoveredMessageId(null);
  };

  const handleDeleteMessage = (msgId: string) => {
      if (!activeConversation) return;
      if (!window.confirm("Delete this message for everyone?")) return;

      const updatedConversations = localConversations.map(c => {
          if (c.id === activeConversation.id) {
              return { ...c, messages: c.messages.filter(m => m.id !== msgId) };
          }
          return c;
      });
      setLocalConversations(updatedConversations);
  };

  const handleConversationClick = (convoId: string) => {
      setActiveConvoId(convoId);
      setIsMobileChatView(true);
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-140px)] flex border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden my-6 relative">
      
      {/* Left Sidebar */}
      <div className={`w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-white ${isMobileChatView ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Messaging</h2>
          <div className="flex gap-2 text-slate-500">
             <button onClick={() => setIsNewChatModalOpen(true)} className="hover:text-primary-600 hover:bg-slate-100 p-1 rounded-full transition-colors"><Edit size={20} /></button>
          </div>
        </div>
        
        <div className="flex border-b border-slate-100">
            <button onClick={() => setActiveTab('chats')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'chats' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <MessageCircle size={16} /> Chats
            </button>
            <button onClick={() => setActiveTab('groups')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'groups' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Users size={16} /> Groups
            </button>
            <button onClick={() => setActiveTab('people')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'people' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <UserPlus size={16} /> People
            </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="Search..."
              value={newChatSearch}
              onChange={(e) => setNewChatSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' ? (
              localConversations.length > 0 ? (
                  localConversations.map(convo => {
                    let displayName = '';
                    let displayAvatar = '';
                    let isGroup = false;

                    if (convo.groupId) {
                        const group = groups.find(c => c.id === convo.groupId);
                        if (!group) return null;
                        displayName = group.name;
                        displayAvatar = group.image || '';
                        isGroup = true;
                    } else {
                        const otherUser = users.find(u => u.id === convo.participantId);
                        if (!otherUser) return null;
                        displayName = otherUser.name;
                        displayAvatar = otherUser.avatar;
                    }

                    if (newChatSearch && !displayName.toLowerCase().includes(newChatSearch.toLowerCase())) return null;
                    const isActive = activeConvoId === convo.id;
                    
                    return (
                      <button key={convo.id} onClick={() => handleConversationClick(convo.id)} className={`w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors border-l-4 ${isActive ? 'border-primary-600 bg-slate-50' : 'border-transparent'}`}>
                        <div className="relative flex-shrink-0">
                          {isGroup && !displayAvatar ? (
                              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Users size={20} /></div>
                          ) : (
                              <img src={displayAvatar} alt={displayName} className={`w-12 h-12 object-cover ${isGroup ? 'rounded-lg' : 'rounded-full'}`} />
                          )}
                          {!isGroup && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-semibold text-slate-900 truncate">{displayName}</h4>
                              <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{convo.timestamp}</span>
                          </div>
                          <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                            {convo.unreadCount > 0 && <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mr-2"></span>}
                            {convo.lastMessage || <span className="italic text-slate-400">Draft</span>}
                          </p>
                        </div>
                      </button>
                    );
                  })
              ) : <div className="p-8 text-center text-slate-500 text-sm">No conversations yet.</div>
          ) : activeTab === 'groups' ? (
              filteredGroups.length > 0 ? (
                  filteredGroups.map(group => (
                      <button key={group.id} onClick={() => handleStartGroupConversation(group.id)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-l-4 border-transparent">
                        {group.image ? <img src={group.image} alt={group.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" /> : <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200"><Users size={20} /></div>}
                        <div className="flex-1 text-left min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">{group.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{group.memberIds.length} members</p>
                        </div>
                        <div className="text-primary-600"><MessageCircle size={20} /></div>
                      </button>
                  ))
              ) : <div className="p-8 text-center text-slate-500 text-sm">No groups found.</div>
          ) : (
              filteredConnections.length > 0 ? (
                  filteredConnections.map(user => (
                      <button key={user.id} onClick={() => handleStartConversation(user.id)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-l-4 border-transparent">
                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 text-left min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">{user.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{user.bio}</p>
                        </div>
                        <div className="text-primary-600"><MessageCircle size={20} /></div>
                      </button>
                  ))
              ) : <div className="p-8 text-center text-slate-500 text-sm">No connections found.</div>
          )}
        </div>
      </div>

      {/* Right Content: Chat Window */}
      <div className={`w-full md:w-2/3 flex-col bg-slate-50/50 ${isMobileChatView ? 'flex' : 'hidden md:flex'}`}>
        {activeConversation && (activeUser || activeGroup) ? (
            <>
            <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileChatView(false)} className="md:hidden p-1 mr-1 text-slate-500 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
                    <div className="relative">
                        {isGroupChat ? (
                            activeGroup?.image ? <img src={activeGroup.image} alt={activeGroup.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600"><Users size={20} /></div>
                        ) : (
                            <>
                                <img src={activeUser!.avatar} alt={activeUser!.name} className="w-10 h-10 rounded-full object-cover" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                            </>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-bold text-slate-900 leading-tight">{isGroupChat ? activeGroup?.name : activeUser?.name}</h3>
                        <p className="text-xs text-slate-500 capitalize">{isGroupChat ? `${activeGroup?.memberIds.length} members` : activeUser?.role}</p>
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col-reverse">
                {activeConversation.messages.length > 0 ? (
                    [...activeConversation.messages].reverse().map(msg => {
                        const isMe = msg.senderId === currentUser.id;
                        const sender = isGroupChat ? users.find(u => u.id === msg.senderId) : activeUser;
                        
                        return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`} onMouseEnter={() => setHoveredMessageId(msg.id)} onMouseLeave={() => setHoveredMessageId(null)}>
                            <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && (
                                    <img src={sender?.avatar || "https://via.placeholder.com/32"} className="w-8 h-8 rounded-full flex-shrink-0 self-end object-cover" alt={sender?.name || 'User'} />
                                )}
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {!isMe && isGroupChat && <span className="text-[10px] text-slate-500 ml-1 mb-0.5">{sender?.name}</span>}
                                    
                                    {/* Actions Popover */}
                                    {hoveredMessageId === msg.id && (
                                        <div className={`absolute -top-8 ${isMe ? 'right-0' : 'left-10'} bg-white shadow-lg border border-slate-100 rounded-full flex p-1 gap-1 animate-in fade-in zoom-in duration-150 z-10`}>
                                            {REACTIONS.map(emoji => (
                                                <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="hover:bg-slate-100 p-1 rounded-full text-lg leading-none transition-transform hover:scale-125">{emoji}</button>
                                            ))}
                                            <div className="w-px bg-slate-200 mx-1"></div>
                                            <button onClick={() => setReplyTo(msg)} className="text-slate-400 hover:text-blue-500 p-1"><Reply size={14} /></button>
                                            {isMe && <button onClick={() => handleDeleteMessage(msg.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>}
                                        </div>
                                    )}

                                    <div className={`relative p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                                        {/* Reply Context */}
                                        {msg.replyTo && (
                                            <div className={`mb-2 pl-2 border-l-4 text-xs ${isMe ? 'border-white/30 text-white/80' : 'border-slate-300 text-slate-500'}`}>
                                                <span className="font-bold block">{msg.replyTo.senderName}</span>
                                                <span className="line-clamp-1">{msg.replyTo.text}</span>
                                            </div>
                                        )}

                                        {/* Attachment */}
                                        {msg.attachment && (
                                            <div className="mb-2">
                                                {msg.attachment.type === 'image' ? (
                                                    <img src={msg.attachment.url} alt="attachment" className="rounded-lg max-h-48 object-cover" />
                                                ) : (
                                                    <div className="flex items-center gap-2 bg-black/10 p-2 rounded">
                                                        <Paperclip size={16} /> <span className="underline">{msg.attachment.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {msg.text}

                                        {/* Reactions Display */}
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
                                    
                                    <div className="flex items-center gap-1 mt-1">
                                        <p className={`text-[10px] text-slate-400`}>{msg.timestamp}</p>
                                        {isMe && (
                                            msg.status === 'read' ? <CheckCheck size={12} className="text-blue-500" /> : 
                                            msg.status === 'delivered' ? <CheckCheck size={12} className="text-slate-400" /> : 
                                            <Check size={12} className="text-slate-400" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })
                ) : <div className="text-center text-slate-400 py-10 mt-auto"><p>Start the conversation!</p></div>}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-3 md:p-4 pb-safe">
                {replyTo && (
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-t-lg border-b border-slate-200 text-xs text-slate-600 mb-1">
                        <div>
                            <span className="font-bold mr-1">Replying to {replyTo.senderId === currentUser.id ? 'Yourself' : 'User'}</span>
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

                <form onSubmit={handleSendMessage} className="bg-white rounded-xl border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-primary-100 transition-all shadow-sm">
                    <textarea 
                        className="w-full bg-transparent border-none outline-none text-sm text-slate-900 resize-none p-2 min-h-[40px] max-h-[100px]"
                        placeholder={isGroupChat ? "Message the group..." : "Write a message..."}
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                        }}
                    />
                    <div className="flex justify-between items-center px-2 pt-2 border-t border-slate-200/50 mt-1">
                        <div className="flex gap-2 text-slate-400">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="hover:text-slate-600 hover:bg-slate-100 rounded p-1.5 transition-colors">
                                <Paperclip size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            <button type="button" className="hover:text-slate-600 hover:bg-slate-100 rounded p-1.5"><Smile size={18} /></button>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                            type="submit" 
                            disabled={!inputText.trim() && !attachment}
                            className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-colors"
                            >
                            <Send size={16} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Send size={40} className="ml-2 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Select a conversation</h3>
                <p className="max-w-xs">Pick a person or group from the list to start chatting.</p>
                <button onClick={() => setIsNewChatModalOpen(true)} className="mt-6 bg-primary-600 text-white px-6 py-2 rounded-full font-medium hover:bg-primary-700 transition-colors">Start New Chat</button>
            </div>
        )}
      </div>

      {/* New Conversation Modal - Unchanged but included for context if needed */}
      {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsNewChatModalOpen(false)} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                      <h2 className="font-bold text-lg text-slate-900">New Message</h2>
                      <button onClick={() => setIsNewChatModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"><X size={20} /></button>
                  </div>
                  <div className="px-4 pt-4 bg-slate-50">
                      <div className="flex gap-2 mb-3">
                          <button onClick={() => setNewChatTab('people')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${newChatTab === 'people' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>People</button>
                          <button onClick={() => setNewChatTab('groups')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${newChatTab === 'groups' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}>My Groups</button>
                      </div>
                  </div>
                  <div className="p-4 border-b border-slate-100 bg-slate-50">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="text" autoFocus placeholder={newChatTab === 'people' ? "Search connections..." : "Search groups..."} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-primary-500 bg-white" value={newChatSearch} onChange={(e) => setNewChatSearch(e.target.value)} />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {newChatTab === 'people' ? (
                          filteredConnections.length > 0 ? (
                              filteredConnections.map(user => (
                                  <div key={user.id} onClick={() => handleStartConversation(user.id)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                                      <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-900 text-sm">{user.name}</h4><p className="text-xs text-slate-500 truncate">{user.bio}</p></div>
                                      <button className="text-primary-600 p-2 hover:bg-primary-50 rounded-full"><MessageCircle size={20} /></button>
                                  </div>
                              ))
                          ) : <div className="p-8 text-center text-slate-500"><p>No connections found.</p></div>
                      ) : (
                          filteredGroups.length > 0 ? (
                              filteredGroups.map(group => (
                                  <div key={group.id} onClick={() => handleStartGroupConversation(group.id)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                      {group.image ? <img src={group.image} alt={group.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100" /> : <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200"><Users size={20} /></div>}
                                      <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-900 text-sm">{group.name}</h4><p className="text-xs text-slate-500 truncate">{group.memberIds.length} members</p></div>
                                      <button className="text-primary-600 p-2 hover:bg-primary-50 rounded-full"><MessageCircle size={20} /></button>
                                  </div>
                              ))
                          ) : <div className="p-8 text-center text-slate-500"><p>No groups found.</p></div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Messaging;
