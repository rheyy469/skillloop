import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import { api, ApiClientError, NotificationDto, OwnProfileDto } from '../lib/api';
import { localFallbackApi } from '../lib/localStore';

interface AuthContextValue {
  user: OwnProfileDto | null;
  loading: boolean;
  notifications: NotificationDto[];
  unreadCount: number;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<OwnProfileDto | null>>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OwnProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await api.notifications.list();
      setNotifications(res.data);
      setUnreadCount(res.meta.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.auth.me();
      setUser(res.data);
      await refreshNotifications();
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        (err.status === 401 || err.status === 403)
      ) {
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
      } else {
        const localUser = localFallbackApi.getCurrentUserOrNull();
        setUser(localUser);
        if (localUser) {
          const fallback = localFallbackApi.listNotifications();
          setNotifications(fallback.data);
          setUnreadCount(fallback.meta.unreadCount);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      localFallbackApi.logout();
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        notifications,
        unreadCount,
        refreshUser,
        refreshNotifications,
        setUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
