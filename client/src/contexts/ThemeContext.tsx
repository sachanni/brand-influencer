import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

export type ThemeType = 'rich-gradient' | 'minimal-light' | 'warm-sunset' | 'light-purple' | 'purple-orange-gradient' | 'purple-blue-gradient';

export interface ThemeConfig {
  name: string;
  displayName: string;
  background: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  border: string;
  buttonPrimary: string;
  buttonSecondary: string;
  glassEffect?: string;
  decorations?: React.ReactNode;
}

const themes: Record<ThemeType, ThemeConfig> = {
  'rich-gradient': {
    name: 'rich-gradient',
    displayName: 'Rich Gradient Dark',
    background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    cardBackground: 'glass bg-white/10 border-white/20 backdrop-blur-lg',
    textPrimary: 'text-white',
    textSecondary: 'text-purple-100',
    accent: 'text-purple-300',
    accentHover: 'hover:text-purple-200',
    border: 'border-purple-400/20',
    buttonPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl border-0',
    buttonSecondary: 'glass border-purple-400/30 text-purple-100 hover:bg-purple-600/20 hover:text-white backdrop-blur-sm',
    glassEffect: 'backdrop-blur-lg bg-white/10 border border-white/20',
    decorations: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-pink-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
      </div>
    )
  },
  'minimal-light': {
    name: 'minimal-light',
    displayName: 'Minimal Light',
    background: 'bg-gray-50',
    cardBackground: 'bg-white border-gray-200 shadow-lg hover:shadow-xl',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-800',
    accent: 'text-blue-600',
    accentHover: 'hover:text-blue-700',
    border: 'border-gray-200',
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
    buttonSecondary: 'border-gray-300 text-gray-900 hover:bg-gray-50 bg-white shadow-sm',
    decorations: null
  },
  'warm-sunset': {
    name: 'warm-sunset',
    displayName: 'Warm Sunset',
    background: 'bg-gradient-to-br from-orange-50 to-pink-50',
    cardBackground: 'bg-white border-orange-200 shadow-lg hover:shadow-xl',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-800',
    accent: 'text-orange-600',
    accentHover: 'hover:text-orange-700',
    border: 'border-orange-200',
    buttonPrimary: 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg',
    buttonSecondary: 'border-orange-300 text-gray-900 hover:bg-orange-50 bg-white shadow-sm',
    glassEffect: 'bg-white border border-orange-200 shadow-lg',
    decorations: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-pink-200 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-red-200 rounded-full opacity-10 blur-3xl"></div>
      </div>
    )
  },
  'light-purple': {
    name: 'light-purple',
    displayName: 'Light Purple',
    background: 'bg-gradient-to-br from-purple-50 to-violet-50',
    cardBackground: 'bg-white border-purple-200 shadow-lg hover:shadow-xl',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-800',
    accent: 'text-purple-600',
    accentHover: 'hover:text-purple-700',
    border: 'border-purple-200',
    buttonPrimary: 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg',
    buttonSecondary: 'border-purple-300 text-gray-900 hover:bg-purple-50 bg-white shadow-sm',
    glassEffect: 'bg-white border border-purple-200 shadow-lg',
    decorations: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-violet-100 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-purple-200 rounded-full opacity-10 blur-3xl"></div>
      </div>
    )
  },
  'purple-orange-gradient': {
    name: 'purple-orange-gradient',
    displayName: 'Purple Orange Gradient',
    background: 'bg-gradient-to-r from-purple-600 to-orange-500',
    cardBackground: 'glass bg-white/95 border-white/40 backdrop-blur-lg shadow-xl',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    accent: 'text-purple-700',
    accentHover: 'hover:text-orange-600',
    border: 'border-purple-300/30',
    buttonPrimary: 'bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white shadow-lg border-0',
    buttonSecondary: 'glass border-purple-400/40 text-gray-800 hover:bg-purple-100/50 bg-white/60 backdrop-blur-sm shadow-md',
    glassEffect: 'backdrop-blur-lg bg-white/85 border border-white/50 shadow-xl',
    decorations: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-400 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-purple-500 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-pink-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/4 right-1/3 w-60 h-60 bg-orange-300 rounded-full opacity-10 blur-2xl"></div>
      </div>
    )
  },
  'purple-blue-gradient': {
    name: 'purple-blue-gradient',
    displayName: 'Purple Blue Gradient',
    background: 'bg-gradient-to-b from-purple-500 to-blue-500',
    cardBackground: 'glass bg-white/95 border-white/40 backdrop-blur-lg shadow-xl',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    accent: 'text-purple-700',
    accentHover: 'hover:text-blue-600',
    border: 'border-purple-300/30',
    buttonPrimary: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg border-0',
    buttonSecondary: 'glass border-purple-400/40 text-gray-800 hover:bg-purple-100/50 bg-white/60 backdrop-blur-sm shadow-md',
    glassEffect: 'backdrop-blur-lg bg-white/85 border border-white/50 shadow-xl',
    decorations: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-400 rounded-full opacity-15 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-violet-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-1/4 right-1/3 w-60 h-60 bg-indigo-300 rounded-full opacity-10 blur-2xl"></div>
      </div>
    )
  }
};

interface ThemeContextType {
  currentTheme: ThemeType;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeType) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('rich-gradient');
  const [isLoading, setIsLoading] = useState(false);

  // Load theme from user preference
  useEffect(() => {
    if (user && (user as any).themePreference && themes[(user as any).themePreference as ThemeType]) {
      setCurrentTheme((user as any).themePreference as ThemeType);
    }
  }, [user]);

  const setTheme = async (theme: ThemeType) => {
    setIsLoading(true);
    try {
      // Update local state immediately for better UX
      setCurrentTheme(theme);
      
      // Save to backend
      if (user) {
        await apiRequest('/api/user/theme', 'PATCH', { themePreference: theme });
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
      // Optionally show error toast here
    } finally {
      setIsLoading(false);
    }
  };

  const themeConfig = themes[currentTheme];

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}