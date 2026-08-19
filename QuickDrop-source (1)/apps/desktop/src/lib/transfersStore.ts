import { createContext, useContext } from "react";
import type { ActiveTransfer } from "@quickdrop/shared";

export interface TransfersContextValue {
  active: ActiveTransfer[];
  upsert: (transfer: ActiveTransfer) => void;
  remove: (id: string) => void;
}

export const TransfersContext = createContext<TransfersContextValue | null>(null);

export function useTransfers(): TransfersContextValue {
  const ctx = useContext(TransfersContext);
  if (!ctx) throw new Error("useTransfers must be used within TransfersContext.Provider");
  return ctx;
}
