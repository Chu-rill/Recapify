import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth-service";

const ProtectedRoute = () => {
  const { isAuthenticated, setUser, setAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const validateAuth = async () => {
      if (token) {
        try {
          const user = await getCurrentUser();
          setUser(user);
          setAuthenticated(true);
        } catch (error) {
          localStorage.removeItem("token");
          setAuthenticated(false);
        }
      }
      setLoading(false);
    };

    validateAuth();
  }, [token, setAuthenticated, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
