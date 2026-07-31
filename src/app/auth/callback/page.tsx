'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('accessToken', token);
      api.auth.getMe()
        .then((res) => {
          if (res.success && res.user) {
            login(token, res.user);
            router.push('/');
          } else {
            setError('Failed to load user profile');
          }
        })
        .catch(() => setError('Authentication callback failed'));
    } else {
      setError('No OAuth token provided');
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-300">Completing Google Authentication...</p>
        </div>
      )}
    </div>
  );
}
