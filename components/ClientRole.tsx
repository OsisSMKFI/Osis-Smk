"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import LiveChatWidget from './chat/LiveChatWidget';

export default function ClientRole() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'guest') as 'super_admin' | 'member' | 'guest';

  return (
    <LiveChatWidget role={role} showFloating={false} />
  );
}
