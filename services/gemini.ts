import { Message, User, ChatEventPayload } from "../types";

// CLAVES DE ALMACENAMIENTO LOCAL
const STORAGE_KEYS = {
  USERS: 'nexus_db_users',
  MESSAGES: 'nexus_db_messages',
  CURRENT_SESSION: 'nexus_session'
};

const CHANNEL_NAME = 'nexus_global_chat_v2';
let channel: BroadcastChannel | null = null;

// --- GESTIÓN DE BASE DE DATOS LOCAL (Simulada) ---

export const db = {
  getUsers: (): Record<string, User> => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : {};
    } catch (e) { return {}; }
  },

  saveUser: (user: User) => {
    try {
        const users = db.getUsers();
        users[user.name.toLowerCase()] = user;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
        console.error("Error guardando usuario", error);
        alert("Espacio lleno. No se pudo guardar el usuario.");
    }
  },

  findUser: (name: string): User | undefined => {
    const users = db.getUsers();
    return users[name.toLowerCase()];
  },

  // Función especial para actualizar usuarios (usada por comandos admin)
  updateUserCoins: (targetName: string, coins: number): User | null => {
    try {
        const users = db.getUsers();
        const key = targetName.toLowerCase();
        if (users[key]) {
          users[key].coins = coins;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          return users[key];
        }
    } catch (error) {
        console.error("Error actualizando monedas", error);
    }
    return null;
  },

  getMessages: (): Message[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },

  saveMessage: (msg: Message) => {
    try {
      const msgs = db.getMessages();
      // Guardamos los últimos 50 mensajes para no saturar el localStorage con imágenes base64
      const newHistory = [...msgs, msg].slice(-50);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Storage full or error", error);
      // Opcional: intentar guardar sin la imagen si falla
      if (msg.attachment) {
          const simpleMsg = { ...msg, content: "⚠️ (Imagen no guardada por falta de espacio)", attachment: undefined };
           try {
               const msgs = db.getMessages();
               const newHistory = [...msgs, simpleMsg].slice(-50);
               localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newHistory));
           } catch (e) {}
      }
    }
  }
};

// --- GESTIÓN DE TIEMPO REAL ---

export const connectToChat = (
  currentUser: User,
  onMessageReceived: (msg: Message) => void,
  onUserUpdate: (user: User, status: 'join' | 'leave' | 'update') => void
) => {
  if (channel) channel.close();
  
  channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<ChatEventPayload>) => {
    const data = event.data;

    switch (data.type) {
      case 'MESSAGE':
        if (data.message) {
          onMessageReceived(data.message);
        }
        break;
      case 'JOIN':
        if (data.user) {
          onUserUpdate(data.user, 'join');
          // Respondemos con nuestra presencia
          const safeUser = { ...currentUser };
          delete safeUser.password;
          broadcastPresence(safeUser);
        }
        break;
      case 'PRESENCE':
      case 'USER_UPDATE':
        if (data.user) {
          onUserUpdate(data.user, 'update');
        }
        break;
      case 'LEAVE':
        if (data.user) {
          onUserUpdate(data.user, 'leave');
        }
        break;
    }
  };

  // Anunciar entrada
  const safeUser = { ...currentUser };
  delete safeUser.password;

  const joinEvent: ChatEventPayload = {
    type: 'JOIN',
    user: safeUser
  };
  channel.postMessage(joinEvent);

  const handleUnload = () => {
    const leaveEvent: ChatEventPayload = {
      type: 'LEAVE',
      user: safeUser
    };
    channel?.postMessage(leaveEvent);
  };

  window.addEventListener('beforeunload', handleUnload);

  return () => {
    handleUnload();
    window.removeEventListener('beforeunload', handleUnload);
    channel?.close();
    channel = null;
  };
};

const broadcastPresence = (user: User) => {
  if (!channel) return;
  channel.postMessage({
    type: 'PRESENCE',
    user: user
  } as ChatEventPayload);
};

export const broadcastUserUpdate = (user: User) => {
  if (!channel) return;
  // Limpiamos pass antes de enviar
  const safeUser = { ...user };
  delete safeUser.password;
  
  channel.postMessage({
    type: 'USER_UPDATE',
    user: safeUser
  } as ChatEventPayload);
};

export const sendMessageToChannel = (message: Message) => {
  if (!channel) return;
  // 1. Guardar en DB local
  db.saveMessage(message);
  // 2. Emitir
  channel.postMessage({
    type: 'MESSAGE',
    message: message
  } as ChatEventPayload);
};