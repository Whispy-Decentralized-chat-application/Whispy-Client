
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Puedes ajustar el tipo de clave privada según tu implementación
type SessionContextType = {
  privateKey: JsonWebKey | null;
  isUnlocked: boolean;
  unlockSession: (privateKey: JsonWebKey) => void;
  lockSession: () => void;
};

const SessionContext = createContext<SessionContextType>({
  privateKey: null,
  isUnlocked: false,
  unlockSession: () => {},
  lockSession: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
    const [privateKey, setPrivateKey] = useState<JsonWebKey | null>(null);

  function unlockSession(privKey: JsonWebKey) {
    setPrivateKey(privKey);
  }

  function lockSession() {
    setPrivateKey(null);
  }

  const isUnlocked = privateKey !== null;

  return (
    <SessionContext.Provider value={{ privateKey, isUnlocked, unlockSession, lockSession }}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook de ayuda para consumir el contexto
export function useSession() {
  return useContext(SessionContext);
}
