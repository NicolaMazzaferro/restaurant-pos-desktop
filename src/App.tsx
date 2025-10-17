import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import HomeView from "./views/HomeView";
import LoginView from "./views/LoginView";
import AdminPanel from "./views/admin/AdminPanel";
import MainLayout from "./layouts/MainLayout";
import { useAutoUpdate } from "./hooks/useAutoUpdate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProtectedRoute({ children, adminOnly = false }: any) {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" />;
  if (adminOnly && role !== "admin") return <Navigate to="/" />;
  return children;
}

function AutoUpdateTrigger() {
  useAutoUpdate();
  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login senza layout */}
        <Route path="/login" element={<LoginView />} />

        {/* Rotte protette con layout comune */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
              <AutoUpdateTrigger />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeView />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
