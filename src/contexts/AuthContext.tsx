import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { AdminUser } from '@/types';
import { loginAdmin, logoutAdmin, onAuthChange, getAdminData } from '@/services/authService';
import { auditLogService } from '@/services/auditLogService';
import toast from 'react-hot-toast';

interface AuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const adminData = await getAdminData(user.uid);
          if (adminData && adminData.isActive) {
            setAdmin(adminData);
          } else {
            setAdmin(null);
          }
        } catch {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const adminData = await loginAdmin(email, password);
      setAdmin(adminData);
      await auditLogService.log({
        userId: adminData.id,
        action: 'login',
        entityType: 'admin',
        entityId: adminData.id,
        description: `Admin girişi: ${adminData.email}`,
      });
      toast.success(`Hoş geldiniz, ${adminData.displayName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Giriş başarısız';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (admin) {
        await auditLogService.log({
          userId: admin.id,
          action: 'logout',
          entityType: 'admin',
          entityId: admin.id,
          description: `Admin çıkışı: ${admin.email}`,
        });
      }
      await logoutAdmin();
      setAdmin(null);
      toast.success('Çıkış yapıldı');
    } catch {
      toast.error('Çıkış yapılırken hata oluştu');
    }
  }, [admin]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
