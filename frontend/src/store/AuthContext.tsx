import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  token: string | null;
  userEmail: string | null;
  hasProfile: boolean;
  isLocked: boolean;
  login: (token: string, email: string, hasProfile: boolean) => void;
  logout: () => void;
  setHasProfile: (status: boolean) => void;
  unlockApp: () => void;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));
  const [hasProfile, setHasProfileState] = useState<boolean>(localStorage.getItem('hasProfile') === 'true');
  const [isLocked, setIsLocked] = useState<boolean>(() => Boolean(
    localStorage.getItem('token') && localStorage.getItem('appLockEnabled') === 'true'
  ));

  const login = (newToken: string, email: string, profileStatus: boolean) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('hasProfile', String(profileStatus));
    localStorage.setItem('language', 'en');
    setToken(newToken);
    setUserEmail(email);
    setHasProfileState(profileStatus);
    setIsLocked(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('hasProfile');
    localStorage.removeItem('language');
    setToken(null);
    setUserEmail(null);
    setHasProfileState(false);
    setIsLocked(false);
  };

  const setHasProfile = (status: boolean) => {
    localStorage.setItem('hasProfile', String(status));
    setHasProfileState(status);
  };

  const lockApp = () => {
    if (localStorage.getItem('appLockEnabled') === 'true') setIsLocked(true);
  };

  const unlockApp = () => setIsLocked(false);

  return (
    <AuthContext.Provider value={{
      token,
      userEmail,
      hasProfile,
      isLocked,
      login,
      logout,
      setHasProfile,
      lockApp,
      unlockApp,
    }}>
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
