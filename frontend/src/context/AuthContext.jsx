import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { activeRoles, clearToken, setToken } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [roles, setRoles] = useState(activeRoles());

  const login = useCallback((role, token) => {
    setToken(role, token);
    setRoles(activeRoles());
  }, []);

  const logout = useCallback((role) => {
    clearToken(role);
    setRoles(activeRoles());
  }, []);

  const value = useMemo(() => ({ roles, login, logout }), [roles, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
