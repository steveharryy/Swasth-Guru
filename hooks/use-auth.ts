'use client';

import { useAuthContext } from '@/contexts/auth-context';

export function useAuth() {
  const { state, login, logout, updateUser } = useAuthContext();

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isDoctor: state.user?.isDoctor || false,
    login,
    logout,
    updateUser,
  };
}