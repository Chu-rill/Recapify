import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signup, googleAuth } from "../services/auth-service";
import { useAuthStore } from "../store/authStore";
import Layout from "../components/Layout";
import { toast } from "../components/ui/sonner";
import { SignupRequest } from "../types/auth";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

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

const SignupPage = () => {
  const { setUser, setAuthenticated } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
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

      toast.success("Account created with Google successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google signup error:", error);
      toast.error(
        error.response?.data?.message || "Failed to create account with Google"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Google button when the API is loaded
  useEffect(() => {
    if (googleLoaded && window.google) {
      const googleButtonDiv = document.getElementById("google-signup-button");
      if (googleButtonDiv) {
        window.google.accounts.id.renderButton(googleButtonDiv, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          width: "100%",
        });
      }
    }
  }, [googleLoaded]);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsSubmitting(true);
      // Ensure we pass a valid SignupRequest object
      const signupData: SignupRequest = {
        username: data.username,
        email: data.email,
        password: data.password,
        phone: data.phone,
      };
      const response = await signup(signupData);

      // Set authenticated user in store with required isVerified field
      setUser({
        ...response.data,
        isVerified: response.data.isVerified ?? false,
      });
      setAuthenticated(true);

      toast.success("Account created successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.response?.data?.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Create an Account
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register("username")}
                className={`w-full px-4 py-2 border ${
                  errors.username ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-primary focus:border-primary`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className={`w-full px-4 py-2 border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-primary focus:border-primary`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className={`w-full px-4 py-2 border ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:ring-primary focus:border-primary`}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone (Optional)
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                placeholder="Enter your phone number"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isSubmitting ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div
                id="google-signup-button"
                className="flex justify-center"
              ></div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default SignupPage;
