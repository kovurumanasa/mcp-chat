"use client";

import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { MCPProvider } from "@/lib/context/mcp-context";
import { useAuth } from "@/lib/msal-provider";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>(
    STORAGE_KEYS.SIDEBAR_STATE,
    true
  );
  const { AzureMsalProvider, useAuth } = require("@/lib/msal-provider");

  function AuthGate({ children }: { children: ReactNode }) {
    const { isAuthenticated, login } = useAuth();
    if (!isAuthenticated) {
      return (
        <div
          style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
          }}
        >
          <h2
            style={{
              marginBottom: '1.5rem',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1e293b',
              letterSpacing: '0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            Please sign in to access the app
          </h2>
          <button
            onClick={login}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
              border: 'none',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 16px rgba(59,130,246,0.10)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = 'linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)')}
            onMouseOut={e => (e.currentTarget.style.background = 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)')}
          >
            Sign In
          </button>
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <AzureMsalProvider>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
            themes={["light", "dark", "sunset", "black"]}
          >
            <MCPProvider>
              <SidebarProvider defaultOpen={sidebarOpen} open={sidebarOpen} onOpenChange={setSidebarOpen}>
                {children}
                <Toaster position="top-center" richColors />
              </SidebarProvider>
            </MCPProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </AuthGate>
    </AzureMsalProvider>
  );
}