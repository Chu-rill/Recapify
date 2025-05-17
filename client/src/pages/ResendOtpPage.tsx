import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
// import { toast } from "sonner";
// import { authService } from "../services/auth";
import { Link } from "react-router-dom";

const ResendOtpPage = () => {
  const [email, setEmail] = useState("");
  const [loading] = useState(false);
  const [disabled] = useState(false);
  // const navigate = useNavigate();

  // const handleResend = async () => {
  //   if (!email || !email.includes("@")) {
  //     toast.error("Please enter a valid email.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const response = await authService.resendOTP({ email });
  //     if (response.statusCode === 201) {
  //       toast.success(response.message || "OTP resent successfully!");

  //       // Store email in session storage for OTP verification page
  //       sessionStorage.setItem("otpEmail", email);

  //       setDisabled(true);
  //       setTimeout(() => setDisabled(false), 60000); // disable for 1 minute

  //       // Optional: navigate to OTP verification page
  //       navigate("/otp");
  //     } else {
  //       toast.error(response.message || "Failed to resend OTP.");
  //     }
  //   } catch (error) {
  //     toast.error(
  //       error?.response?.data?.message || "Failed to resend OTP."
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="flex items-center justify-center min-h-screen dark:bg-black bg-background">
      <Card className="w-full max-w-sm p-6 shadow-lg">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Resend OTP</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email to receive a new OTP code.
            </p>
          </div>

          <Input
            type="email"
            placeholder="example@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white cursor-pointer"
            // onClick={handleResend}
            disabled={loading || disabled}
          >
            {loading
              ? "Sending..."
              : disabled
              ? "Wait before retrying (60s)"
              : "Resend OTP"}
          </Button>
        </CardContent>
        <div className="px-6 pb-6 pt-2">
          <Link
            to="/otp"
            className="text-hotel-navy font-medium hover:underline"
          >
            Back to Verify OTP
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ResendOtpPage;
