import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { isFirebaseConfigured } from '../../../database/firebase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmail, signupWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
      navigate(from, { replace: true });
    } catch (error) {
       // toast already handled in context
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
       // toast handled
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-surface-container-lowest">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant/10 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join The Biome'}
          </h1>
          <p className="text-on-surface-variant text-sm mt-2 text-center flex-wrap">
            {isLogin ? 'Sign in to track your earthly impact and keep saving the planet.' : 'Create an account to start tracking your earthly impact.'}
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary font-medium">
            Firebase keys are not configured locally, so the app will use <span className="font-bold">Demo Mode</span> and local storage.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/60 outline-none transition-all" 
                placeholder="eco@hero.com" 
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-on-surface-variant/60 outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 mt-6 active:scale-95 transition-transform shadow-lg shadow-primary/20"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/20"></div>
          </div>
          <span className="relative bg-white px-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Or
          </span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full mt-6 bg-surface-container-low text-on-surface py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-surface-container transition-colors active:scale-95 border border-outline-variant/10 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-8 text-sm text-on-surface-variant font-medium">
          {isLogin ? "Don't have an account?" : "Already part of the Biome?"}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            className="ml-2 text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
