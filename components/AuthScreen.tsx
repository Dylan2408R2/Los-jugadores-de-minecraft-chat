
import React, { useState, useRef } from 'react';
import { User } from '../types';
import Avatar from './Avatar';
import { Camera, Palette, Lock, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import { db } from '../services/gemini';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (isRegistering) {
      // REGISTRO
      const existingUser = db.findUser(name);
      if (existingUser) {
        setError('¡Este nombre de usuario ya está ocupado!');
        return;
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: name.trim(),
        password: password.trim(),
        color: selectedColor,
        avatarUrl,
        isOnline: true,
        coins: 0, // Inician con 0 monedas
      };

      db.saveUser(newUser);
      onLogin(newUser);

    } else {
      // LOGIN
      const user = db.findUser(name);
      if (!user) {
        setError('Usuario no encontrado. ¿Quieres registrarte?');
        return;
      }

      if (user.password !== password) {
        setError('Contraseña incorrecta');
        return;
      }

      // Login exitoso - asegurar que tenga campo coins si es cuenta vieja
      const userWithCoins = { ...user, coins: user.coins || 0, isOnline: true };
      onLogin(userWithCoins);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="absolute inset-0 overflow-hidden -z-10">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] animate-pulse-slow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md bg-glass backdrop-blur-xl border border-glass-border rounded-2xl p-8 shadow-2xl transform transition-all">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2">
            Jugadores de Minecraft
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegistering ? 'Crea tu perfil de jugador' : 'Bienvenido al servidor'}
          </p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex bg-black/20 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isRegistering ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isRegistering ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section (Only for Register) */}
          {isRegistering && (
            <div className="flex flex-col items-center gap-4 animate-[float_0.5s_ease-out]">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar 
                  name={name || "?"} 
                  color={selectedColor} 
                  url={avatarUrl} 
                  size="xl" 
                  className="transition-transform group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
              <span className="text-xs text-gray-500">Toca para subir skin/foto</span>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Gamertag"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                required
              />
            </div>

            {/* Color Picker (Only Register) */}
            {isRegistering && (
              <div className="space-y-2 animate-[float_0.5s_ease-out]">
                <label className="text-xs font-medium text-gray-400 ml-1 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Color de Aura
                </label>
                <div className="flex justify-between gap-2 bg-black/20 p-2 rounded-xl border border-white/10">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {isRegistering ? 'Crear Cuenta' : 'Entrar al Servidor'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
