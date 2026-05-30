import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { Admin } from "@/api";

interface AdminContextType {
  admin: Admin | null;
  setAdmin: (admin: Admin) => void;
  logoutAdmin: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

const STORAGE_KEY = "blood_admin";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdminState] = useState<Admin | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Admin) : null;
    } catch {
      return null;
    }
  });

  const setAdmin = useCallback((a: Admin) => {
    setAdminState(a);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  }, []);

  const logoutAdmin = useCallback(() => {
    setAdminState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, setAdmin, logoutAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}
