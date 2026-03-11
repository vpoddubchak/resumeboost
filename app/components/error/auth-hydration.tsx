'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/app/store/auth-store';

export function AuthHydration() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Rehydrate persisted store on mount
    useAuthStore.persist.rehydrate();
    useAuthStore.getState().setHydrated(true);
  }, []);

  useEffect(() => {
    // Sync NextAuth session → Zustand auth store
    if (status === 'authenticated' && session?.user) {
      useAuthStore.getState().setUser({
        userId: session.user.userId as number,
        email: session.user.email ?? '',
        role: (session.user as { role?: string }).role ?? 'job_seeker',
        firstName: session.user.name?.split(' ')[0] ?? null,
        lastName: session.user.name?.split(' ').slice(1).join(' ') ?? null,
        image: session.user.image ?? null,
      });
    } else if (status === 'unauthenticated') {
      useAuthStore.getState().clearUser();
    }
  }, [session, status]);

  return null;
}

export default AuthHydration;
