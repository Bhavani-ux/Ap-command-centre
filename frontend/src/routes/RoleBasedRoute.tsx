import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';

interface RoleBasedRouteProps {
  roles: string[];
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ roles }) => {
  const { isAuthenticated, hasAnyRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyRole(roles)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
