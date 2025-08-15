import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Configurar token no axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verificar se o token é válido
      const response = await api.get('/auth/verify');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      const { token, user: userData } = response.data;

      // Salvar token
      localStorage.setItem('authToken', token);
      
      // Configurar token no axios
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Atualizar estado
      setUser(userData);
      setIsAuthenticated(true);

      toast.success(`Bem-vindo, ${userData.name}! 👋`);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    // Remover token
    localStorage.removeItem('authToken');
    
    // Limpar header do axios
    delete api.defaults.headers.common['Authorization'];
    
    // Limpar estado
    setUser(null);
    setIsAuthenticated(false);
    
    toast.info('Logout realizado com sucesso');
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    // Admin tem acesso a tudo
    if (user.role === 'admin') return true;
    
    // Verificar role específica
    return user.role === requiredRole;
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isOperador = () => {
    return user && user.role === 'operador';
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    isAdmin,
    isOperador,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
