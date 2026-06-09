import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useCandidateAuth, candidateLogin, candidateRegister } from "@/context/CandidateAuthContext";
import { Link } from "wouter";

export default function CareersRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login, candidate } = useCandidateAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [activeTab, setActiveTab] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Form state for sign in
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signInErrors, setSignInErrors] = useState({ email: "", password: "" });

  // Form state for create account
  const [createData, setCreateData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: ""
  });
  const [createErrors, setCreateErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    terms: ""
  });

  // CSS classes
  const inputNormal = "w-full h-[48px] rounded-[10px] bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-white/50 transition-all";
  const inputError = "w-full h-[48px] rounded-[10px] bg-white/10 border border-red-400 text-white placeholder:text-white/40 px-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-red-400/50 transition-all";

  const ErrorMsg = ({ msg }: { msg: string }) => msg ? <p className="text-red-300 text-[12px] mt-1">{msg}</p> : null;

  // Where to go after auth — stored by apply page
  const returnTo = sessionStorage.getItem("returnTo") || "/career";

  const loginMut = useMutation({
    mutationFn: () => candidateLogin(loginEmail, loginPassword),
    onSuccess: (data) => {
      login(data.token, { ...data.candidate, phoneVerified: data.candidate?.phoneVerified ?? false });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/me"] });
      toast({ title: "Welcome back!" });
      sessionStorage.setItem("careerApplyStage", "form");
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
    onError: (e: Error) => toast({ title: "Login failed", description: e.message, variant: "destructive" }),
  });

  const registerMut = useMutation({
    mutationFn: () =>
      candidateRegister({ email: regEmail, password: regPassword, firstName: regFirstName, lastName: regLastName, phone: regPhone }),
    onSuccess: (data) => {
      login(data.token, { ...data.candidate, phoneVerified: false });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/me"] });
      toast({ title: "Account created successfully!" });
      sessionStorage.setItem("careerApplyStage", "form");
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
    onError: (e: Error) => toast({ title: "Registration failed", description: e.message, variant: "destructive" }),
  });

  // Handle Sign In form changes
  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignInData(prev => ({ ...prev, [name]: value }));
    setSignInErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Handle Create Account form changes
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateData(prev => ({ ...prev, [name]: value }));
    setCreateErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Validate Sign In
  const validateSignIn = () => {
    let isValid = true;
    const errors = { email: "", password: "" };

    if (!signInData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      errors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!signInData.password) {
      errors.password = "Password is required";
      isValid = false;
    }

    setSignInErrors(errors);
    return isValid;
  };

  // Validate Create Account
  const validateCreate = () => {
    let isValid = true;
    const errors = {
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      terms: ""
    };

    if (!createData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    }

    if (!createData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    }

    if (!createData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(createData.email)) {
      errors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!createData.mobile.trim()) {
      errors.mobile = "Mobile number is required";
      isValid = false;
    } else if (!/^[0-9+\-\s()]{8,15}$/.test(createData.mobile)) {
      errors.mobile = "Please enter a valid mobile number";
      isValid = false;
    }

    if (!createData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (createData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (createData.password !== createData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    if (!agreeTerms) {
      errors.terms = "You must agree to the Terms and Conditions";
      isValid = false;
    }

    setCreateErrors(errors);
    return isValid;
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSignIn()) {
      setLoginEmail(signInData.email);
      setLoginPassword(signInData.password);
      loginMut.mutate();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCreate()) {
      setRegFirstName(createData.firstName);
      setRegLastName(createData.lastName);
      setRegEmail(createData.email);
      setRegPhone(createData.mobile);
      setRegPassword(createData.password);
      setRegConfirm(createData.confirmPassword);
      registerMut.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF5] overflow-x-hidden font-sans">
      <Navbar />
      <div className="min-h-screen bg-[#F7F6F3] font-['DM_Sans']">
        {/* ═══════════════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════════════ */}
        <section className="flex flex-col items-center justify-center px-5 pt-32 pb-20 md:pt-36 md:pb-28">
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[28px] sm:text-[34px] md:text-[40px] font-semibold text-[#0D4A7A] font-['Outfit'] text-center leading-tight"
          >
            Welcome to Wings Counselling Center
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-3 text-[15px] md:text-[16px] text-[#0D4A7A] text-center"
          >
            Sign in or create an account to apply for jobs
          </motion.p>

          {/* ─── FORM CARD ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 w-full max-w-[540px] bg-[#0D4A7A] rounded-[20px] p-8 md:p-10"
          >
            {/* Tabs */}
            <div className="flex rounded-[10px] bg-white/5 p-1">
              <button
                onClick={() => setActiveTab("signin")}
                className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
                  activeTab === "signin"
                    ? "bg-white text-[#0D4A7A] shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all duration-300 cursor-pointer ${
                  activeTab === "create"
                    ? "bg-white text-[#0D4A7A] shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                Create account
              </button>
            </div>

            {/* ─── SIGN IN FORM ─── */}
            <AnimatePresence mode="wait">
              {activeTab === "signin" && (
                <motion.form
                  key="signin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignInSubmit}
                  className="mt-8 space-y-6"
                >
                  {/* Email */}
                  <div>
                    <label className="block text-white text-[14px] font-medium mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={signInData.email}
                      onChange={handleSignInChange}
                      placeholder="Enter your email address"
                      className={signInErrors.email ? inputError : inputNormal}
                    />
                    <ErrorMsg msg={signInErrors.email} />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-white text-[14px] font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={signInData.password}
                        onChange={handleSignInChange}
                        placeholder="Enter your password"
                        className={`${signInErrors.password ? inputError : inputNormal} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                    <ErrorMsg msg={signInErrors.password} />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loginMut.isPending}
                    className="w-full h-[48px] rounded-[10px] bg-white text-[#0D4A7A] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-all duration-300 cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loginMut.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Sign in
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-white/60 text-[14px] hover:text-white/90 transition-colors cursor-pointer">
                    Forgot password ?
                  </p>
                </motion.form>
              )}

              {/* ─── CREATE ACCOUNT FORM ─── */}
              {activeTab === "create" && (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleCreateSubmit}
                  className="mt-8 space-y-5"
                >
                  {/* First & Last Name - side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-[14px] font-medium mb-2">
                        First name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={createData.firstName}
                        onChange={handleCreateChange}
                        placeholder="Enter first name"
                        className={createErrors.firstName ? inputError : inputNormal}
                      />
                      <ErrorMsg msg={createErrors.firstName} />
                    </div>
                    <div>
                      <label className="block text-white text-[14px] font-medium mb-2">
                        Last name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={createData.lastName}
                        onChange={handleCreateChange}
                        placeholder="Enter last name"
                        className={createErrors.lastName ? inputError : inputNormal}
                      />
                      <ErrorMsg msg={createErrors.lastName} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-white text-[14px] font-medium mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={createData.email}
                      onChange={handleCreateChange}
                      placeholder="Enter your email address"
                      className={createErrors.email ? inputError : inputNormal}
                    />
                    <ErrorMsg msg={createErrors.email} />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="block text-white text-[14px] font-medium mb-2">
                      Mobile number
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={createData.mobile}
                      onChange={handleCreateChange}
                      placeholder="Enter your mobile number"
                      className={createErrors.mobile ? inputError : inputNormal}
                    />
                    <ErrorMsg msg={createErrors.mobile} />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-white text-[14px] font-medium mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={createData.password}
                        onChange={handleCreateChange}
                        placeholder="Enter your password"
                        className={`${createErrors.password ? inputError : inputNormal} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                    <ErrorMsg msg={createErrors.password} />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-white text-[14px] font-medium mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={createData.confirmPassword}
                        onChange={handleCreateChange}
                        placeholder="Re-enter your password"
                        className={`${createErrors.confirmPassword ? inputError : inputNormal} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-[18px] h-[18px]" />
                        ) : (
                          <Eye className="w-[18px] h-[18px]" />
                        )}
                      </button>
                    </div>
                    <ErrorMsg msg={createErrors.confirmPassword} />
                  </div>

                  {/* Terms Checkbox */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (createErrors.terms) {
                            setCreateErrors({ ...createErrors, terms: "" });
                          }
                        }}
                        className="w-4 h-4 rounded border-white/30 accent-white cursor-pointer"
                      />
                      <span className="text-white/80 text-[13px]">
                        I agree to the{" "}
                        <span className="underline text-white hover:text-white/90 cursor-pointer">
                          Terms and Conditions
                        </span>
                      </span>
                    </label>
                    <ErrorMsg msg={createErrors.terms} />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={registerMut.isPending}
                    className="w-full h-[48px] rounded-[10px] bg-white text-[#0D4A7A] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-all duration-300 cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {registerMut.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Create account
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════ */}
        <Footer />
      </div>

      <Footer />
    </div>
  );
}
