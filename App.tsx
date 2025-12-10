
import React, { useState, useEffect } from 'react';
import { User, AppView } from './types';
import AuthScreen from './components/AuthScreen';
import ChatScreen from './components/ChatScreen';
import CustomCursor from './components/CustomCursor';

function App() {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('nexus_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setView(AppView.CHAT);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    setView(AppView.CHAT);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    setCurrentUser(null);
    setView(AppView.AUTH);
  };

  return (
    <div className="min-h-screen text-white font-sans antialiased selection:bg-pink-500/30 selection:text-pink-200">
      {/* The Advanced Custom Cursor */}
      <CustomCursor />

      {/* Main View Router */}
      {view === AppView.AUTH ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        currentUser && <ChatScreen user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
