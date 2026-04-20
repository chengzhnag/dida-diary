import React, { useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from '@/store/useAppStore';
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, pathname, navigate]);

  if (!isAuthenticated && pathname !== '/login') {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}