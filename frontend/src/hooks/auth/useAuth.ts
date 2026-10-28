import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store/store';
import { login as loginAction, logout as logoutAction, clearError } from '../../store/slices/auth.slice';
import { LoginRequest } from '../../types/auth.types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        await dispatch(loginAction(credentials)).unwrap();
        navigate('/hubs');
      } catch (error) {
        // Error is handled in the slice
        throw error;
      }
    },
    [dispatch, navigate]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutAction());
    navigate('/login');
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles?.includes(role) || false;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => user?.roles?.includes(role)) || false;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user?.permissions) return false;

      return user.permissions.some((p) => {
        // Exact match
        if (p === permission) return true;

        // Wildcard match
        if (p.endsWith(':*')) {
          const base = p.slice(0, -2);
          return permission.startsWith(base);
        }

        // Super wildcard
        if (p === '*') return true;

        return false;
      });
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      return permissions.every((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearAuthError,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
