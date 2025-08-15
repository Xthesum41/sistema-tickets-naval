import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole, fallback }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // O App.jsx vai redirecionar para login
  }

  // Se não há role requerida, qualquer usuário autenticado pode acessar
  if (!requiredRole) {
    return children;
  }

  // Verificar permissão
  const hasPermission = () => {
    if (!user) return false;
    
    // Admin tem acesso a tudo
    if (user.role === 'admin') return true;
    
    // Verificar role específica
    return user.role === requiredRole;
  };

  if (!hasPermission()) {
    // Mostrar componente de fallback ou mensagem padrão
    if (fallback) {
      return fallback;
    }

    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
            Acesso Negado
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="text-sm text-red-500 dark:text-red-400">
            <p>Seu nível de acesso: <strong>{user?.role === 'admin' ? '👑 Administrador' : '⚙️ Operador'}</strong></p>
            <p>Permissão requerida: <strong>{requiredRole === 'admin' ? '👑 Administrador' : '⚙️ Operador'}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
