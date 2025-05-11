import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, googleAuth } from "../services/auth-service";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/Layout";
import { toast } from "../components/ui/sonner";
import { LoginRequest } from "../types/auth";
// import { Button } from "../components/ui/button";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Define a type for the Google window object
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const LoginPage = () => {
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Initialize Google Sign In
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id:
          "29145965775-epc378lfnt17qtks08mslnhebfvdrrpm.apps.googleusercontent.com", // Replace with your Google client ID
        callback: handleGoogleSignIn,
      });
      setGoogleLoaded(true);
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    try {
      setIsSubmitting(true);
      const result = await googleAuth(response.credential);

      // Set authenticated user in store with required isVerified field
      setUser({
        ...result.data,
        isVerified: result.data.isVerified ?? false,
      });
      setAuthenticated(true);

      toast.success("Logged in with Google successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(
        error.response?.data?.message || "Failed to login with Google"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Google button when the API is loaded
  useEffect(() => {
    if (googleLoaded && window.google) {
      const googleButtonDiv = document.getElementById("google-signin-button");
      if (googleButtonDiv) {
        window.google.accounts.id.renderButton(googleButtonDiv, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          width: "100%",
        });
      }
    }
  }, [googleLoaded]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      // Ensure we pass a valid LoginRequest object
      const loginData: LoginRequest = {
        email: data.email,
        password: data.password,
      };
      const response = await login(loginData);

      // Set authenticated user in store with required isVerified field
      setUser({
        ...response.data,
        isVerified: response.data.isVerified ?? false,
      });
      setAuthenticated(true);

      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
            Log In to Recapify
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className={`w-full px-4 py-2 border ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className={`w-full px-4 py-2 border ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div
                id="google-signin-button"
                className="flex justify-center"
              ></div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
