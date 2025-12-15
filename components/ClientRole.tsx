"use client";
import React from 'react';
import LiveChatWidget from './chat/LiveChatWidget';
import GlobalFloatingControls from './GlobalFloatingControls';

export default function ClientRole({ role }: { role?: 'super_admin' | 'member' | 'guest' }) {
  return (
    <>
      {/* Global Floating Controls: Scroll to Top, Sound Toggle, AI Chat Button */}
      <GlobalFloatingControls showChat={true} />
      {/* Live Chat AI Widget (the actual chat panel) */}
      <LiveChatWidget role={role} showFloating={false} />
    </>
  );
}
