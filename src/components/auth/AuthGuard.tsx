import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from '@/store/useAppStore';
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const token = useAppStore(s => s.token);
  const tokenValidated = useAppStore(s => s.tokenValidated);
  const validateToken = useAppStore(s => s.validateToken);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      if (!isAuthenticated || !token) {
        if (pathname !== '/login') {
          navigate('/login', { replace: true });
        }
        if (active) setIsCheckingAuth(false);
        return;
      }

      if (!tokenValidated) {
        const valid = await validateToken();
        if (!valid && pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }

      if (active) setIsCheckingAuth(false);
    };

    checkAuth();
    return () => {
      active = false;
    };
  }, [isAuthenticated, token, tokenValidated, validateToken, pathname, navigate]);

  if (isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated && pathname !== '/login') {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}