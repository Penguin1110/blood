import { RouterProvider } from "react-router";
import { AuthProvider } from "@/context/AuthContext";
import { AdminProvider } from "@/context/AdminContext";
import { router } from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <RouterProvider router={router} />
      </AdminProvider>
    </AuthProvider>
  );
}
