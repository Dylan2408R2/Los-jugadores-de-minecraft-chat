
import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import Avatar from './Avatar';
import { Send, LogOut, Users, Wifi, Trash2, Paperclip, Smile, Image as ImageIcon, Coins } from 'lucide-react';
import { connectToChat, sendMessageToChannel, db, broadcastUserUpdate } from '../services/gemini';

interface ChatScreenProps {
  user: User;
  onLogout: () => void;
}

// Lista simple de GIFs/Stickers
const STICKERS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnVwZ2F4bHR1eG54eHl5eG54eHl5eG54eHl5eG54eHl5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/VzKu9VlK434g8/giphy.gif", // Creeper
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDN6eG54eHl5eG54eHl5eG54eHl5eG54eHl5eG54eHl5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wp7gDqIuQO4t601ZqC/giphy.gif", // Diamond
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnh6eG54eHl5eG54eHl5eG54eHl5eG54eHl5eG54eHl5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/d1E2VyhFsxawRbeo/giphy.gif", // Steve dancing
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjl6eG54eHl5eG54eHl5eG54eHl5eG54eHl5eG54eHl5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/kFgzrTt798d2w/giphy.gif", // Pig
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExenB6eG54eHl5eG54eHl5eG54eHl5eG54eHl5eG54eHl5eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/139eZBmH1HTyPk8/giphy.gif", // TNT
];

const ChatScreen: React.FC<ChatScreenProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Record<string, User>>({});
  const [showStickers, setShowStickers] = useState(false);
  
  // Usamos referencia para guardar el usuario actual actualizado (especialmente monedas)
  const currentUserRef = useRef<User>(user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      currentUserRef.current = user;
  }, [user]);

  // Inicializar Chat
  useEffect(() => {
    const history = db.getMessages();
    setMessages(history);

    const userNoPass = { ...user };
    delete userNoPass.password;
    setOnlineUsers(prev => ({ ...prev, [user.id]: userNoPass }));

    const cleanup = connectToChat(
      user,
      (incomingMsg) => {
        setMessages(prev => {
            if (prev.some(m => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
        });
      },
      (remoteUser, status) => {
        setOnlineUsers(prev => {
          const newState = { ...prev };
          if (status === 'leave') {
            delete newState[remoteUser.id];
          } else {
            // Si es una actualización (ej: monedas cambiadas), actualizamos
            newState[remoteUser.id] = { ...remoteUser, isOnline: true };
            
            // Si la actualización somos nosotros (ej: admin cambió mis monedas), actualizamos estado local
            if (remoteUser.id === currentUserRef.current.id) {
                 // Forzamos actualización visual del componente padre via local storage check en App o reload
                 // Aquí solo actualizamos la referencia visual en lista de usuarios
            }
          }
          return newState;
        });
      }
    );

    return cleanup;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showStickers]);

  // --- LÓGICA DE COMANDOS ---
  const processCommand = (text: string): boolean => {
    if (!text.startsWith('/')) return false;

    const parts = text.split(' ');
    const command = parts[0].toLowerCase();

    // COMANDO: /coins set [jugador] [cantidad]
    // SOLO PARA: Dylan2408R2
    if (command === '/coins' && parts[1] === 'set') {
        if (currentUserRef.current.name !== 'Dylan2408R2') {
             alert('⛔ No tienes permisos de administrador para usar este comando.');
             return true; 
        }

        const targetName = parts[2];
        const amount = parseInt(parts[3]);

        if (targetName && !isNaN(amount)) {
            const updatedUser = db.updateUserCoins(targetName, amount);
            if (updatedUser) {
                // Notificar a todos del cambio
                broadcastUserUpdate(updatedUser);
                
                // Mensaje del sistema local
                const sysMsg: Message = {
                    id: Date.now().toString(),
                    senderId: 'system',
                    content: `💰 Administrador ha establecido las monedas de ${targetName} a ${amount}.`,
                    timestamp: Date.now(),
                    isSystem: true
                };
                setMessages(prev => [...prev, sysMsg]);
                sendMessageToChannel(sysMsg);
            } else {
                alert('Usuario no encontrado');
            }
        } else {
            alert('Uso: /coins set [nombre] [cantidad]');
        }
        return true;
    }

    return false; // No era un comando conocido o falló
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Procesar comando si empieza con /
    if (processCommand(inputValue.trim())) {
        setInputValue('');
        return;
    }

    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      senderId: user.id,
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    sendMessageToChannel(newMessage);
    setInputValue('');
  };

  const handleSendSticker = (url: string) => {
    const newMessage: Message = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        senderId: user.id,
        content: "Envió un sticker",
        timestamp: Date.now(),
        stickerUrl: url
      };
  
      setMessages(prev => [...prev, newMessage]);
      sendMessageToChannel(newMessage);
      setShowStickers(false);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite de tamaño 2MB para evitar crash de localStorage
    if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es demasiado grande (Máx 2MB)');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const base64 = reader.result as string;
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        
        const newMessage: Message = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5),
            senderId: user.id,
            content: `📎 Adjuntó ${type === 'video' ? 'un video' : 'una imagen'}`,
            timestamp: Date.now(),
            attachment: {
                type,
                url: base64,
                name: file.name
            }
        };

        setMessages(prev => [...prev, newMessage]);
        sendMessageToChannel(newMessage);
    };
    reader.readAsDataURL(file);
    
    // Limpiar input
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearHistory = () => {
      if(window.confirm('¿Borrar historial solo para ti?')) {
          localStorage.removeItem('nexus_db_messages');
          setMessages([]);
      }
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Buscar el usuario actual en la lista online para tener los datos más recientes (monedas)
  const myLiveUser = onlineUsers[user.id] || user;

  return (
    <div className="flex flex-col h-screen relative z-10 overflow-hidden">
        {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-glass backdrop-blur-md flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg shadow-lg">
                <Wifi className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
                <h2 className="font-bold text-lg tracking-wide hidden sm:block">Jugadores de Minecraft</h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                        <span className="text-xs text-gray-400">{Object.keys(onlineUsers).length} online</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
             {/* Coin Display */}
             <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-full">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-200 font-bold text-sm">{myLiveUser.coins || 0}</span>
            </div>

            <button 
                onClick={handleClearHistory}
                className="hidden sm:flex p-2 hover:bg-white/10 rounded-full transition-colors text-red-400/70 hover:text-red-400"
                title="Borrar Historial Local"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                <Avatar name={user.name} color={user.color} url={user.avatarUrl} size="sm" />
                <span className="text-sm font-medium text-gray-200 hidden sm:inline">{user.name}</span>
            </div>
            
            <button 
                onClick={onLogout}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                title="Cerrar Sesión"
            >
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden relative flex">
        
        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.length === 0 && (
                 <div className="flex justify-center mt-20 opacity-50">
                    <p className="text-sm text-gray-400">No hay mensajes. ¡Sé el primero en escribir!</p>
                 </div>
            )}
            
            {messages.map((msg, index) => {
                if (msg.isSystem) {
                    return (
                        <div key={msg.id} className="flex justify-center my-4">
                            <span className="text-xs bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-200 px-4 py-1.5 rounded-full font-medium">
                                {msg.content}
                            </span>
                        </div>
                    );
                }

                const isMe = msg.senderId === user.id;
                let sender = onlineUsers[msg.senderId];
                if (!sender) {
                    const allUsers = db.getUsers();
                    sender = Object.values(allUsers).find(u => u.id === msg.senderId) || { id: 'unknown', name: 'Desconocido', color: '#666', isOnline: false, avatarUrl: undefined, coins: 0 } as User;
                }
                
                const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;

                return (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} group animate-[float_0.3s_ease-out_forwards]`}
                    >
                        <div className={`shrink-0 flex flex-col justify-end ${!showHeader ? 'opacity-0 w-10' : ''}`}>
                             <Avatar 
                                name={sender.name} 
                                color={sender.color} 
                                url={sender.avatarUrl}
                                size="md"
                            />
                        </div>

                        <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                            {showHeader && !isMe && (
                                <div className="flex items-center gap-2 mb-1 ml-1">
                                    <span className="text-xs text-gray-300 font-bold">{sender.name}</span>
                                    {sender.coins > 0 && (
                                        <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 rounded flex items-center gap-1">
                                            <Coins className="w-3 h-3" /> {sender.coins}
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            <div 
                                className={`
                                    relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md break-words
                                    ${isMe 
                                        ? 'bg-blue-600 text-white rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-700' 
                                        : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/5'
                                    }
                                `}
                            >
                                {/* TEXT CONTENT */}
                                {msg.content && !msg.stickerUrl && !msg.attachment && msg.content}
                                
                                {/* STICKERS */}
                                {msg.stickerUrl && (
                                    <img src={msg.stickerUrl} alt="Sticker" className="w-32 h-32 object-contain hover:scale-110 transition-transform" />
                                )}

                                {/* MEDIA ATTACHMENTS */}
                                {msg.attachment && (
                                    <div className="mt-1">
                                        {msg.attachment.type === 'image' ? (
                                            <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-full max-h-64 rounded-lg border border-white/10" />
                                        ) : (
                                            <video src={msg.attachment.url} controls className="max-w-full max-h-64 rounded-lg border border-white/10" />
                                        )}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {formatTime(msg.timestamp)}
                            </span>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>

        {/* Sidebar (Desktop only) */}
        <div className="hidden lg:block w-64 bg-glass border-l border-white/5 p-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-3 h-3" /> Usuarios Online
            </h3>
            <div className="space-y-3">
                {Object.values(onlineUsers).map((u: User) => (
                    <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-default">
                        <div className="relative">
                            <Avatar name={u.name} color={u.color} url={u.avatarUrl} size="sm" />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a20] rounded-full shadow-[0_0_8px_#22c55e]"></span>
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium truncate text-gray-200">
                                {u.id === user.id ? `${u.name} (Tú)` : u.name}
                            </p>
                            <p className="text-xs text-yellow-500/80 truncate font-mono flex items-center gap-1">
                                <Coins className="w-3 h-3" /> {u.coins || 0}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-glass backdrop-blur-xl border-t border-white/10 relative">
        
        {/* Sticker Popover */}
        {showStickers && (
            <div className="absolute bottom-20 left-4 p-3 bg-gray-900 border border-white/10 rounded-xl shadow-2xl flex gap-2 overflow-x-auto max-w-[90vw] z-50 animate-[float_0.3s_ease-out]">
                {STICKERS.map((s, i) => (
                    <button key={i} onClick={() => handleSendSticker(s)} className="hover:scale-110 transition-transform p-1">
                        <img src={s} className="w-16 h-16 object-contain" alt="sticker" />
                    </button>
                ))}
            </div>
        )}

        <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-center gap-2"
        >
            {/* Attachment Buttons */}
            <div className="flex items-center gap-1 mr-1">
                <button 
                    type="button" 
                    onClick={() => setShowStickers(!showStickers)}
                    className={`p-2 rounded-full transition-colors ${showStickers ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                >
                    <Smile className="w-5 h-5" />
                </button>
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                    accept="image/*,video/*"
                />
            </div>

            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Mensaje... (o /coins set)"
                className="w-full bg-black/30 border border-white/10 rounded-full px-4 py-3.5 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all shadow-inner"
                autoFocus
            />
            <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-2 p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-full text-white shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
                <Send className="w-5 h-5 ml-0.5" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
