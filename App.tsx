import React, { useState, useEffect } from 'react';
import { User, AppView } from './types';
import AuthScreen from './components/AuthScreen';
import ChatScreen from './components/ChatScreen';
import CustomCursor from './components/CustomCursor';

function App() {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for session safely
    try {
      const storedUser = localStorage.getItem('nexus_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Validación básica para asegurar que el objeto usuario es válido
        if (parsed && parsed.id && parsed.name) {
            setCurrentUser(parsed);
            setView(AppView.CHAT);
        } else {
            // Datos corruptos o antiguos
            localStorage.removeItem('nexus_user');
        }
      }
    } catch (error) {
      console.error("Error cargando sesión:", error);
      // Si hay error, limpiamos para evitar loop de crash
      localStorage.removeItem('nexus_user');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
        localStorage.setItem('nexus_user', JSON.stringify(user));
    } catch (e) {
        console.error("Error guardando sesión local", e);
    }
    setView(AppView.CHAT);
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_user');
    setCurrentUser(null);
    setView(AppView.AUTH);
  };

  if (error) {
      return (
          <div className="flex items-center justify-center h-screen text-red-400 p-4 text-center">
              <div>
                  <h1 className="text-2xl font-bold">Algo salió mal :(</h1>
                  <p>{error}</p>
                  <button 
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    className="mt-4 bg-red-500/20 px-4 py-2 rounded hover:bg-red-500/40"
                  >
                      Reiniciar App (Borrar datos)
                  </button>
              </div>
          </div>
      );
  }

  try {
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
  } catch (e) {
      setError("Error crítico de renderizado. Intenta recargar.");
      return null;
  }
}

export default App;