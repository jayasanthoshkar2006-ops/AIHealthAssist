import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../api/client';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  hasProfile: boolean;
  language: string;
  isLocked: boolean;
  login: (token: string, email: string, hasProfile: boolean) => void;
  logout: () => void;
  setLanguagePreference: (lang: string) => void;
  setHasProfile: (status: boolean) => void;
  unlockApp: () => void;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));
  const [hasProfile, setHasProfileState] = useState<boolean>(localStorage.getItem('hasProfile') === 'true');
  const [language, setLanguageState] = useState<string>(localStorage.getItem('language') || 'en');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language, i18n]);

  const login = (newToken: string, email: string, profileStatus: boolean) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('hasProfile', String(profileStatus));
    setToken(newToken);
    setUserEmail(email);
    setHasProfileState(profileStatus);
    setIsLocked(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('hasProfile');
    setToken(null);
    setUserEmail(null);
    setHasProfileState(false);
    setIsLocked(false);
  };

  const setLanguagePreference = (lang: string) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    i18n.changeLanguage(lang);
  };

  const setHasProfile = (status: boolean) => {
    localStorage.setItem('hasProfile', String(status));
    setHasProfileState(status);
  };

  const lockApp = () => setIsLocked(true);
  const unlockApp = () => setIsLocked(false);

  return (
    <AuthContext.Provider
      value={{
        token,
        userEmail,
        hasProfile,
        language,
        isLocked,
        login,
        logout,
        setLanguagePreference,
        setHasProfile,
        lockApp,
        unlockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
