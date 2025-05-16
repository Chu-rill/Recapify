import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

const GoogleOAuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback, isLoading, user } = useAuthStore(); // Also destructure 'user' for a potential check
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      const processGoogleAuth = async () => {
        try {
          await handleGoogleCallback(token);

          toast.success("Google login successful!");
          navigate("/dashboard"); // Redirect to your desired page after successful login
        } catch (error) {
          console.error("Google authentication process failed:", error); // Log the error for debugging
          toast.error("Google authentication failed. Please try again.");
          navigate("/login"); // Redirect to login page on failure
        }
      };

      processGoogleAuth();
    } else {
      toast.error("Authentication token not found.");
      navigate("/login"); // Redirect to login if no token is present
    }
  }, [handleGoogleCallback, navigate, searchParams]); // user is not a direct dependency for useEffect, but for logic inside

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Processing Google login...</p>
      {isLoading && (
        <div className="ml-2 animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500" />
      )}
    </div>
  );
};

export default GoogleOAuthCallback;
