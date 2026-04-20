import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const fetchDiaries = useAppStore(s => s.fetchDiaries);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDiaries();
    }
  }, [isAuthenticated, fetchDiaries]);

  return <>{children}</>;
};