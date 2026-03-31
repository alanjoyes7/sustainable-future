import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Scan, Map as MapIcon, Leaf, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'motion/react';

export default function Layout() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/scanner", icon: Scan, label: "Scanner" },
    { to: "/map", icon: MapIcon, label: "Map" }
  ];

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-20 xl:w-72 bg-surface/90 backdrop-blur-md glass-effect border-r border-outline-variant/10 z-50 flex flex-col justify-between py-8 transition-all duration-300">
        <div>
          <div className="flex items-center justify-center xl:justify-start gap-4 px-6 mb-12">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-container rounded-2xl shadow-lg shadow-primary/20 flex-shrink-0">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-primary tracking-tight hidden xl:block select-none">
              The Biome
            </h1>
          </div>
          
          <nav className="space-y-4 px-4">
            {navItems.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to} 
                className={({ isActive }) => cn(
                  "flex items-center justify-center xl:justify-start gap-4 p-4 rounded-[1.5rem] transition-all duration-200 group relative overflow-hidden",
                  isActive ? "bg-primary text-white shadow-xl shadow-primary/20 translate-x-1" : "text-green-900 hover:bg-green-100 hover:text-green-950 hover:translate-x-1"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={cn("w-7 h-7 flex-shrink-0 z-10", isActive ? "text-white" : "text-green-800")} />
                    <span className="font-extrabold text-lg hidden xl:block z-10">{item.label}</span>
                    {isActive && (
                       <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Environmental Fact Box on Desktop Bottom */}
        <div className="hidden xl:block px-6">
          <div className="bg-gradient-to-br from-surface-container-low to-surface-container border border-outline-variant/10 rounded-3xl p-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
            <h4 className="text-primary font-bold text-sm tracking-wide uppercase mb-2">Did you know?</h4>
            <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
              Recycling one aluminum can saves enough energy to run a TV for 3 hours.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper (Pushed right by sidebar) */}
      <div className="flex-1 ml-20 xl:ml-72 flex flex-col min-h-screen max-w-[1600px] w-full">
        {/* Header (Top Right) */}
        <header className="h-24 flex flex-row-reverse items-center px-6 md:px-12 z-40 bg-transparent sticky top-0">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-4 p-1.5 pl-4 bg-white rounded-full hover:bg-surface-container-lowest transition-all duration-200 border border-outline-variant/10 shadow-md hover:shadow-lg active:scale-95"
            >
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-extrabold text-on-surface">{currentUser?.displayName || 'Eco Explorer'}</span>
                <span className="text-xs font-bold text-primary tracking-wide">Level 4 Recycler</span>
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden border-[3px] border-primary/20 bg-surface-container">
                <img 
                  src={currentUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.email}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown className={`w-5 h-5 text-on-surface-variant mr-3 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-2xl border border-outline-variant/10 py-3 origin-top-right overflow-hidden z-50"
                >
                  <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-lowest">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">Signed in account</p>
                    <p className="text-sm font-bold text-on-surface truncate" title={currentUser?.email || ''}>
                      {currentUser?.email}
                    </p>
                  </div>
                  
                  <div className="py-2">
                    <button 
                      onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-on-surface hover:bg-surface-container-lowest hover:text-primary transition-colors group">
                      <div className="p-2 rounded-xl bg-surface-container-high group-hover:bg-primary/10 transition-colors">
                        <User className="w-5 h-5 group-hover:text-primary" />
                      </div>
                      View Public Profile
                    </button>
                    <button 
                      onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-on-surface hover:bg-surface-container-lowest hover:text-primary transition-colors group">
                      <div className="p-2 rounded-xl bg-surface-container-high group-hover:bg-primary/10 transition-colors">
                        <Settings className="w-5 h-5 group-hover:text-primary" />
                      </div>
                      App Settings
                    </button>
                  </div>
                  
                  <div className="p-4 pt-2 border-t border-outline-variant/10 bg-white">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-error/10 text-error hover:bg-error hover:text-white rounded-[1.5rem] text-sm font-extrabold transition-all duration-200 active:scale-95"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-6 md:px-12 pb-12 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
