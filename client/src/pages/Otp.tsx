import React, { useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../components/ui/input-otp";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/auth";

const Otp = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // const handleVerify = async () => {
  //   if (!email) {
  //     toast.error("Please enter your email.");
  //     return;
  //   }
  //   if (otp.length !== 6) {
  //     toast.error("Please enter a valid 6-digit OTP");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await authService.validateOTP({ email, OTP: otp });
  //     if (response.statusCode === 200) {
  //       toast.success("OTP verified successfully!");
  //       localStorage.setItem("token", response.token || ""); // Store token
  //       navigate("/"); // Redirect to home
  //     } else {
  //       toast.error(response.message || "Invalid OTP");
  //     }
  //   } catch (error) {
  //     toast.error(
  //       error?.response?.data?.message ||
  //         "An error occurred during verification"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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
            // onClick={handleVerify}
            disabled={otp.length < 6 || loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </CardContent>
        <div className="px-6 pb-6 pt-2 ">
          <Link
            to="/resend-otp"
            className="text-hotel-navy font-medium hover:underline"
          >
            Resend OTP
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Otp;
