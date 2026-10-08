import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function useRoleApi(role) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const latest = useRef({ logout, navigate });
  latest.current = { logout, navigate };

  return useCallback(
    async (path, options = {}) => {
      try {
        return await api(path, { ...options, role });
      } catch (error) {
        if (error.status === 401) {
          latest.current.logout(role);
          latest.current.navigate('/login');
        }
        throw error;
      }
    },
    [role],
  );
}
