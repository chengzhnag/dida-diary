import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { MobileLayout } from '@/components/layout/MobileLayout';
import '@/index.css';
import { DiariesPage } from '@/pages/DiariesPage';
import EditorPage from '@/pages/EditorPage';
import LoginPage from '@/pages/LoginPage';
import VerifyPage from '@/pages/VerifyPage';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppInitializer } from '@/components/AppInitializer';
const queryClient = new QueryClient();
// Defined routes for the core diary experience
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/verify",
    element: (
      <AuthGuard>
        <AppInitializer>
          <VerifyPage />
        </AppInitializer>
      </AuthGuard>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/",
    element: (
      <AuthGuard>
        <AppInitializer>
          <MobileLayout>
            <EditorPage isFirst />
          </MobileLayout>
        </AppInitializer>
      </AuthGuard>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/diaries",
    element: (
      <AuthGuard>
        <AppInitializer>
          <MobileLayout>
            <DiariesPage />
          </MobileLayout>
        </AppInitializer>
      </AuthGuard>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/editor/:id",
    element: (
      <AuthGuard>
        <AppInitializer>
          <MobileLayout>
            <EditorPage />
          </MobileLayout>
        </AppInitializer>
      </AuthGuard>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>,
);