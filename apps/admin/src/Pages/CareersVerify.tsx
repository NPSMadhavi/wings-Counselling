import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Loader2, Phone, CheckCircle, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useCandidateAuth } from "@/context/CandidateAuthContext";
import { apiUrl } from "@/lib/queryClient";
import { Link } from "wouter";

export default function CareersVerify() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { candidate, token, login } = useCandidateAuth();

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Where to go after verification
  const returnTo = sessionStorage.getItem("returnTo") || "/career";

  // Redirect to register if not logged in
  if (!candidate || !token) {
    navigate("/career/register");
    return null;
  }

  // Already verified — go straight to apply
  if (candidate.phoneVerified) {
    sessionStorage.removeItem("returnTo");
    navigate(returnTo);
    return null;
  }

  const sendOtpMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/send-mobile-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to send OTP"); }
      return res.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your mobile number." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const verifyOtpMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/api/candidate/verify-mobile-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Invalid OTP"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mobile verified! You can now apply." });
      // Update candidate in context
      login(token, { ...candidate, phoneVerified: true });
      sessionStorage.setItem("careerApplyStage", "form");
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[#FAFAF5] overflow-x-hidden font-sans">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-[#FAFAF5] pt-28 pb-4 border-b border-gray-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-[150px] flex items-center gap-2 text-sm font-['DM_Sans']">
          <Link href="/career">
            <span className="text-gray-500 hover:text-[#1B4585] transition-colors cursor-pointer font-medium">Careers</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-[#1B4585] font-semibold">Verify Mobile</span>
        </div>
      </div>

      <section className="py-16 min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">

            <div className="bg-white rounded-[20px] p-8 border border-gray-200 shadow-[0_4px_25px_rgba(0,0,0,0.04)]">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#0D4A7A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-[#0D4A7A]" />
                </div>
                <h1 className="text-2xl font-bold text-black font-['Outfit'] mb-2">Verify Your Mobile Number</h1>
                <p className="text-gray-500 font-['DM_Sans'] text-sm">
                  One last step before you can apply. We'll send a code to your registered mobile number.
                </p>
                {candidate?.phone && (
                  <p className="mt-2 font-semibold text-[#0D4A7A] text-sm">{candidate.phone}</p>
                )}
              </div>

              {!otpSent ? (
                <Button
                  onClick={() => sendOtpMut.mutate()}
                  disabled={sendOtpMut.isPending}
                  className="w-full bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold py-5"
                >
                  {sendOtpMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP via SMS"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-green-700 text-sm font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> OTP sent to your mobile number
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-700 font-bold text-sm">Enter OTP</Label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit code"
                      className="mt-1.5 rounded-xl border-gray-300 text-center text-2xl tracking-[0.5em] font-bold"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    onClick={() => verifyOtpMut.mutate()}
                    disabled={verifyOtpMut.isPending || otp.length < 4}
                    className="w-full bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold py-5"
                  >
                    {verifyOtpMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Continue to Apply"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => sendOtpMut.mutate()}
                    disabled={sendOtpMut.isPending}
                    className="w-full text-sm text-[#1B4585] hover:underline font-semibold py-1"
                  >
                    Resend OTP
                  </button>
                </div>
              )}
            </div>

            <p className="text-center text-sm text-gray-400 mt-4 font-['DM_Sans']">
              <Link href="/career"><span className="text-[#1B4585] hover:underline cursor-pointer font-semibold">← Back to job listings</span></Link>
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
