import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Globe, Shield, Trash2, ChevronRight, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SETTINGS_STORAGE_KEY = 'biome.settings';

type SettingsState = {
  notifications: boolean;
  darkMode: boolean;
  saveHistory: boolean;
};

const defaultSettings: SettingsState = {
  notifications: true,
  darkMode: false,
  saveHistory: true,
};

function loadStoredSettings(): SettingsState {
  if (typeof window === 'undefined') return defaultSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function applyTheme(isDark: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
}

export default function Settings() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    const stored = loadStoredSettings();
    setSettings(stored);
    applyTheme(stored.darkMode);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    applyTheme(settings.darkMode);
  }, [settings]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const updateSetting = (key: keyof SettingsState, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    if (key === 'darkMode') {
      toast.success(value ? 'Dark mode enabled' : 'Light mode enabled');
    }

    if (key === 'saveHistory') {
      toast.success(value ? 'Scan history will be saved' : 'Scan history saving paused');
    }
  };

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onChange(!value);
      }}
      className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${value ? 'bg-primary' : 'bg-surface-container-high'}`}
      aria-pressed={value}
    >
      <motion.div
        animate={{ x: value ? 28 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
      />
    </button>
  );

  const sections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          description: 'Receive eco tips and scan reminders',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          control: <ToggleSwitch value={settings.notifications} onChange={(value) => updateSetting('notifications', value)} />,
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Use a softer night-friendly theme',
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          control: <ToggleSwitch value={settings.darkMode} onChange={(value) => updateSetting('darkMode', value)} />,
        },
        {
          icon: Shield,
          label: 'Save Scan History',
          description: 'Keep your classified items synced to your account',
          color: 'text-green-600',
          bg: 'bg-green-50',
          control: <ToggleSwitch value={settings.saveHistory} onChange={(value) => updateSetting('saveHistory', value)} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: Globe,
          label: 'Privacy Policy',
          description: 'View our data & privacy terms',
          color: 'text-cyan-600',
          bg: 'bg-cyan-50',
          control: <ChevronRight className="w-5 h-5 text-on-surface-variant" />,
          onClick: () => window.open('https://policies.google.com/privacy', '_blank'),
        },
        {
          icon: Trash2,
          label: 'Delete Account',
          description: 'Permanently remove your data',
          color: 'text-red-600',
          bg: 'bg-red-50',
          control: <ChevronRight className="w-5 h-5 text-on-surface-variant" />,
          onClick: () => toast.error('Please contact support to delete your account.'),
        },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-10"
    >
      <section>
        <h1 className="text-4xl font-extrabold text-on-surface mb-2">Settings</h1>
        <p className="text-on-surface-variant font-medium">Manage your preferences and account</p>
      </section>

      <div className="bg-gradient-to-r from-primary/10 to-surface-container-low rounded-[2rem] p-6 flex items-center gap-5 border border-primary/10">
        <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden border-2 border-white shadow-md">
          <img
            src={currentUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.email}`}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-extrabold text-lg text-on-surface">{currentUser?.displayName || 'Eco Explorer'}</p>
          <p className="text-sm text-on-surface-variant font-medium">{currentUser?.email}</p>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-4 px-1">{section.title}</h2>
          <div className="bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm overflow-hidden divide-y divide-outline-variant/10">
            {section.items.map((item) => (
              <div
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-4 px-6 py-5 transition-colors text-left ${item.onClick ? 'hover:bg-surface-container-lowest cursor-pointer' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface text-sm">{item.label}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.description}</p>
                </div>
                {item.control}
              </div>
            ))}
          </div>
        </section>
      ))}

      <section>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-red-50 text-red-600 border border-red-200 font-extrabold text-base hover:bg-red-600 hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </section>

      <p className="text-center text-xs text-on-surface-variant/50 font-medium pb-4">
        The Biome · v1.1.0 · Refined for Hackathon 2026
      </p>
    </motion.div>
  );
}
