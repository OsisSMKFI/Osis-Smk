"use client";

import React, { createContext, useContext, useRef, useState } from 'react';

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type LocationContextValue = {
  location: LocationData | null;
  permission: "prompt" | "granted" | "denied" | "unknown";
  refresh: () => void;
};

const LocationContext = createContext<LocationContextValue>({
  location: null,
  permission: "unknown",
  refresh: () => {},
});

export function useLiveLocation() {
  return useContext(LocationContext);
}

export default function LocationServiceProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permission, setPermission] = useState<LocationContextValue["permission"]>("unknown");
  const pendingRef = useRef(false);

  const logLocation = async (loc: LocationData) => {
    try {
      await fetch("/api/security/log-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp,
          page: typeof window !== "undefined" ? window.location.pathname : "server",
        }),
      });
    } catch (e) {
      console.warn("[LocationService] Log failed", (e as any)?.message);
    }
  };

  const refresh = () => {
    if (pendingRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("denied");
      return;
    }
    pendingRef.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pendingRef.current = false;
        setPermission("granted");
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };
        setLocation(loc);
        logLocation(loc);
      },
      (err) => {
        pendingRef.current = false;
        console.warn("[LocationService]", err.code, err.message);
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
        else setPermission("prompt");
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  return (
    <LocationContext.Provider value={{ location, permission, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}
