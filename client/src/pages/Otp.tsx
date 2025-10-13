import { useState, useEffect } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/store";

const Otp = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const user = useAuthStore((state) => state.user);
  const { validateOTP, resendOTP } = useAuthStore();
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (!user?.email) {
      toast.error("Email session expired. Please sign up again.");
      navigate("/signup");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await validateOTP(user.email, otp);

      toast.success("OTP verified successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("An error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!user?.email) {
      toast.error("Email session expired. Please sign up again.");
      navigate("/signup");
      return;
    }

    if (countdown > 0) {
      return;
    }

    setResending(true);
    try {
      await resendOTP(user.email);
      toast.success("OTP has been resent to your email!");
      setCountdown(30); // Start 30 second countdown
      setOtp(""); // Clear the OTP input
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen dark:bg-black">
      <Card className="w-full max-w-sm p-6 shadow-lg">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Enter OTP</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A 6-digit code was sent to your email.
            </p>
          </div>

          <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white cursor-pointer"
            onClick={handleVerify}
            disabled={otp.length < 6 || loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="link"
              className="text-blue-600 hover:text-violet-600 font-semibold p-0 h-auto"
              onClick={handleResendOTP}
              disabled={countdown > 0 || resending}
            >
              {resending
                ? "Sending..."
                : countdown > 0
                ? `Resend OTP in ${countdown}s`
                : "Resend OTP"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Otp;
