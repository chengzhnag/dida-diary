import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const isListUnlocked = useAppStore(s => s.isListUnlocked);
  const fetchDiaries = useAppStore(s => s.fetchDiaries);

  useEffect(() => {
    if (isAuthenticated && isListUnlocked) {
      fetchDiaries();
    }
  }, [isAuthenticated, isListUnlocked, fetchDiaries]);

  return <>{children}</>;
};