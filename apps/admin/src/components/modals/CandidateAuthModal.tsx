import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Loader2, Eye, EyeOff, ChevronRight, X } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useCandidateAuth, candidateLogin, candidateRegister } from "@/context/CandidateAuthContext";

export function CandidateAuthModal() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login, isAuthModalOpen, closeAuthModal, authModalReturnTo } = useCandidateAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

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

  // Reset state and lock body scroll when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      setActiveTab("signin");
      setSignInData({ email: "", password: "" });
      setSignInErrors({ email: "", password: "" });
      setCreateData({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: ""
      });
      setCreateErrors({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        terms: ""
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
      setAgreeTerms(false);
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isAuthModalOpen]);

  // CSS classes
  const inputNormal = "w-full h-[48px] rounded-[8px] bg-transparent border border-gray-300 text-gray-800 placeholder:text-gray-400 px-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-[#0D4A7A] transition-all";
  const inputError = "w-full h-[48px] rounded-[8px] bg-transparent border border-red-400 text-gray-800 placeholder:text-gray-400 px-4 text-[14px] focus:outline-none focus:ring-1 focus:ring-red-400 transition-all";

  const ErrorMsg = ({ msg }: { msg: string }) => msg ? <p className="text-red-500 text-[12px] mt-1">{msg}</p> : null;

  const loginMut = useMutation({
    mutationFn: () => candidateLogin(loginEmail, loginPassword),
   onSuccess: () => {
  toast({ title: t("candidateAuth.toast.accountCreatedSignIn.title") });

  // Clear create account form
  setCreateData({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  setAgreeTerms(false);

  // Switch to Sign In tab
  setActiveTab("signin");
},
    onError: (e: Error) => toast({ title: t("candidateAuth.toast.loginFailed.title"), description: e.message, variant: "destructive" }),
  });

  const registerMut = useMutation({
    mutationFn: () =>
      candidateRegister({ email: regEmail, password: regPassword, firstName: regFirstName, lastName: regLastName, phone: regPhone }),
    onSuccess: (data) => {
      login(data.token, { ...data.candidate, phoneVerified: false });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/me"] });
      toast({ title: t("candidateAuth.toast.accountCreated.title") });
      sessionStorage.setItem("careerApplyStage", "form");
      closeAuthModal();
      if (authModalReturnTo) {
        navigate(authModalReturnTo);
      }
    },
    onError: (e: Error) => toast({ title: t("candidateAuth.toast.registrationFailed.title"), description: e.message, variant: "destructive" }),
  });

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignInData(prev => ({ ...prev, [name]: value }));
    setSignInErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateData(prev => ({ ...prev, [name]: value }));
    setCreateErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateSignIn = () => {
    let isValid = true;
    const errors = { email: "", password: "" };

    if (!signInData.email.trim()) {
      errors.email = t("candidateAuth.validation.signIn.emailRequired");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      errors.email = t("candidateAuth.validation.signIn.emailInvalid");
      isValid = false;
    }

    if (!signInData.password) {
      errors.password = t("candidateAuth.validation.signIn.passwordRequired");
      isValid = false;
    }

    setSignInErrors(errors);
    return isValid;
  };

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
      errors.firstName = t("candidateAuth.validation.createAccount.firstNameRequired");
      isValid = false;
    }

    if (!createData.lastName.trim()) {
      errors.lastName = t("candidateAuth.validation.createAccount.lastNameRequired");
      isValid = false;
    }

    if (!createData.email.trim()) {
      errors.email = t("candidateAuth.validation.createAccount.emailRequired");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(createData.email)) {
      errors.email = t("candidateAuth.validation.createAccount.emailInvalid");
      isValid = false;
    }

    if (!createData.mobile.trim()) {
      errors.mobile = t("candidateAuth.validation.createAccount.mobileRequired");
      isValid = false;
    } else if (!/^[0-9+\-\s()]{8,15}$/.test(createData.mobile)) {
      errors.mobile = t("candidateAuth.validation.createAccount.mobileInvalid");
      isValid = false;
    }

    if (!createData.password) {
      errors.password = t("candidateAuth.validation.createAccount.passwordRequired");
      isValid = false;
    } else if (createData.password.length < 6) {
      errors.password = t("candidateAuth.validation.createAccount.passwordMin");
      isValid = false;
    }

    if (createData.password !== createData.confirmPassword) {
      errors.confirmPassword = t("candidateAuth.validation.createAccount.confirmPasswordMismatch");
      isValid = false;
    }

    if (!agreeTerms) {
      errors.terms = t("candidateAuth.validation.createAccount.termsRequired");
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

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100050] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm font-['DM_Sans']">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[680px] bg-[#F5F5F5] rounded-[24px] p-6 sm:p-10 md:p-10 lg:p-[51px] max-h-[96vh] overflow-y-auto shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <button
          onClick={closeAuthModal}
          aria-label={t("candidateAuth.common.close")}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>


        <p className="text-[15px] sm:text-[20px]  md:text-[20px] lg:text-[22px] font-normal text-[#0D4A7A] text-center mb-8 md:mb-8 mt-5 md:mt-[2px]">
          {t("candidateAuth.common.title")}
        </p>

        {/* Tabs */}
        <div className="flex bg-[#0D4A7A] rounded-full p-1 mb-8 md:mb-[45px] max-w-[490px] mx-auto shadow-sm">
          <button
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2.5 text-[15px] sm:text-[17px] md:text-[18px] lg:md:text-[19px] font-medium transition-all duration-300 rounded-full ${
              activeTab === "signin"
                ? "bg-white text-[#0D4A7A] shadow-sm"
                : "text-white hover:text-white/90"
            }`}
          >
            {t("candidateAuth.tabs.signIn")}
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-2.5 text-[15px] sm:text-[17px] md:text-[18px] lg:md:text-[19px] font-medium transition-all duration-300 rounded-full ${
              activeTab === "create"
                ? "bg-white text-[#0D4A7A] shadow-sm"
                : "text-white hover:text-white/90"
            }`}
          >
            {t("candidateAuth.tabs.createAccount")}
          </button>
        </div>

        <div className="w-full max-w-[480px] mx-auto">
          {/* ─── SIGN IN FORM ─── */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignInSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">
                  {t("candidateAuth.signin.fields.email")}
                </label>
               <input
  type="email"
  name="email"
  value={signInData.email}
  onChange={handleSignInChange}
  placeholder={t("candidateAuth.signin.fields.emailPlaceholder")}
  className={`${signInErrors.email ? inputError : inputNormal} text-[13px] sm:text-[15px] md:text-[16px] `}
/>
                <ErrorMsg msg={signInErrors.email} />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">
                  {t("candidateAuth.signin.fields.password")}
                </label>
                <div className="relative mb-8 md:mb-[50px]">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={signInData.password}
                    onChange={handleSignInChange}
                    placeholder={t("candidateAuth.signin.fields.passwordPlaceholder")}
                    className={`${signInErrors.password ? inputError : inputNormal} pr-12 text-[13px] sm:text-[15px] md:text-[16px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
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
                className="w-full h-[48px] rounded-full bg-[#0D4A7A] text-white font-semibold text-[14px] sm:text-[16px] md:text-[17px] flex items-center justify-center gap-2 hover:bg-[#0a3a60] transition-all duration-300 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {loginMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t("candidateAuth.signin.buttons.submit")}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Forgot Password */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-[#333333] text-[13px] sm:text-[15px] md:text-[16px] font-normal hover:text-gray-900 transition-colors"
                >
                  {t("candidateAuth.signin.buttons.forgotPassword")}
                </button>
              </div>
            </form>
          )}

          {/* ─── CREATE ACCOUNT FORM ─── */}
          {activeTab === "create" && (
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">{t("candidateAuth.createAccount.fields.firstName")}</label>
                  <input
                    type="text"
                    name="firstName"
                    value={createData.firstName}
                    onChange={handleCreateChange}
                    placeholder={t("candidateAuth.createAccount.fields.firstNamePlaceholder")}
                   
                     className={`${createErrors.firstName ? inputError : inputNormal} text-[13px] sm:text-[15px] md:text-[16px] `}
                  />
                  <ErrorMsg msg={createErrors.firstName} />
                </div>
                <div>
                  <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">{t("candidateAuth.createAccount.fields.lastName")}</label>
                  <input
                    type="text"
                    name="lastName"
                    value={createData.lastName}
                    onChange={handleCreateChange}
                    placeholder={t("candidateAuth.createAccount.fields.lastNamePlaceholder")}
                    className={`${createErrors.lastName ? inputError : inputNormal} text-[13px] sm:text-[15px] md:text-[16px] `}
                  />
                  <ErrorMsg msg={createErrors.lastName} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">{t("candidateAuth.createAccount.fields.email")}</label>
                <input
                  type="email"
                  name="email"
                  value={createData.email}
                  onChange={handleCreateChange}
                  placeholder={t("candidateAuth.createAccount.fields.emailPlaceholder")}
                  className={`${createErrors.email ? inputError : inputNormal} text-[13px] sm:text-[15px] md:text-[16px] `} 
                  
                />
                <ErrorMsg msg={createErrors.email} />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">{t("candidateAuth.createAccount.fields.mobile")}</label>
                <input
                  type="tel"
                  name="mobile"
                  value={createData.mobile}
                  onChange={handleCreateChange}
                  placeholder={t("candidateAuth.createAccount.fields.mobilePlaceholder")}
                  className={`${createErrors.mobile ? inputError : inputNormal} text-[13px] sm:text-[15px] md:text-[16px] `} 

                />
                <ErrorMsg msg={createErrors.mobile} />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">{t("candidateAuth.createAccount.fields.password")}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={createData.password}
                    onChange={handleCreateChange}
                    placeholder={t("candidateAuth.createAccount.fields.passwordPlaceholder")}
                    className={`${createErrors.password ? inputError : inputNormal} pr-12 text-[13px] sm:text-[15px] md:text-[16px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                <ErrorMsg msg={createErrors.password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[#333333] text-[14px] sm:text-[16px] md:text-[17px] font-medium mb-2">{t("candidateAuth.createAccount.fields.confirmPassword")}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={createData.confirmPassword}
                    onChange={handleCreateChange}
                    placeholder={t("candidateAuth.createAccount.fields.confirmPasswordPlaceholder")}
                    className={`${createErrors.confirmPassword ? inputError : inputNormal} pr-12 text-[13px] sm:text-[15px] md:text-[16px]`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                <ErrorMsg msg={createErrors.confirmPassword} />
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2 pb-5 md:pb-[25px]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (createErrors.terms) setCreateErrors({ ...createErrors, terms: "" });
                    }}
                    className="w-[18px] h-[18px] rounded-[4px] border border-gray-400 bg-transparent appearance-none checked:bg-[#0D4A7A] checked:border-[#0D4A7A] checked:after:content-['✓'] checked:after:text-white checked:after:flex checked:after:items-center checked:after:justify-center checked:after:h-full checked:after:text-[12px] checked:after:font-bold cursor-pointer transition-colors"
                  />
                  <span className="text-[#333333] text-[14px] sm:text-[16px] md:text-[17px]">
                    {t("candidateAuth.createAccount.terms.agree", {
                      terms: t("candidateAuth.createAccount.terms.termsAndConditions"),
                    })
                      .split(t("candidateAuth.createAccount.terms.termsAndConditions"))
                      .reduce((nodes, part, index, arr) => {
                        nodes.push(part);
                        if (index < arr.length - 1) {
                          nodes.push(
                            <a
                              key="terms-link"
                              href="/terms-of-service"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-gray-800 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("candidateAuth.createAccount.terms.termsAndConditions")}
                            </a>
                          );
                        }
                        return nodes;
                      }, [])}
                  </span>
                </label>
                <ErrorMsg msg={createErrors.terms} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={registerMut.isPending}
                className="w-full h-[48px] rounded-full bg-[#0D4A7A] text-white font-semibold text-[14px] sm:text-[16px] md:text-[17px] flex items-center justify-center gap-2 hover:bg-[#0a3a60] transition-all duration-300 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-6"
              >
                {registerMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t("candidateAuth.createAccount.buttons.submit")}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
