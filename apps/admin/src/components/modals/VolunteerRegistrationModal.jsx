import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronDown,
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  PenTool,
  Info,
  Send,
  Users,
  Megaphone,
  FileText,
  Trees,
  Check,
} from "lucide-react";
import { DateOfBirthPicker, calculateAgeFromDob } from "../ui/DateOfBirthFields";

// List of countries for nationality/citizenship reference if needed
const countries = [
  "Singapore", "Malaysian", "Indonesian", "Indian", "Chinese", "Australian", 
  "American", "British", "Canadian", "Filipino", "Vietnamese", "Thai", 
  "Japanese", "South Korean", "Other"
];

// Area of Interest Cards Configuration
const INTEREST_AREAS = [
  {
    id: "outreach",
    titleKey: "volunteerRegistration.step2.interestAreas.outreach.title",
    descriptionKey: "volunteerRegistration.step2.interestAreas.outreach.description",
    icon: Megaphone,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "talks_workshops",
    titleKey: "volunteerRegistration.step2.interestAreas.talksWorkshops.title",
    descriptionKey: "volunteerRegistration.step2.interestAreas.talksWorkshops.description",
    icon: Users,
    color: "text-teal-600 bg-teal-50",
  },
  {
    id: "administrative",
    titleKey: "volunteerRegistration.step2.interestAreas.administrative.title",
    descriptionKey: "volunteerRegistration.step2.interestAreas.administrative.description",
    icon: FileText,
    color: "text-sky-600 bg-sky-50",
  },
  {
    id: "outings",
    titleKey: "volunteerRegistration.step2.interestAreas.outings.title",
    descriptionKey: "volunteerRegistration.step2.interestAreas.outings.description",
    icon: Trees,
    color: "text-green-600 bg-green-50",
  },
];

const DAY_OPTIONS = [
  { value: "Mon", labelKey: "volunteerRegistration.step2.days.mon" },
  { value: "Tue", labelKey: "volunteerRegistration.step2.days.tue" },
  { value: "Wed", labelKey: "volunteerRegistration.step2.days.wed" },
  { value: "Thu", labelKey: "volunteerRegistration.step2.days.thu" },
  { value: "Fri", labelKey: "volunteerRegistration.step2.days.fri" },
  { value: "Sat", labelKey: "volunteerRegistration.step2.days.sat" },
  { value: "Sun", labelKey: "volunteerRegistration.step2.days.sun" },
];

const SINGAPORE_PHONE_REGEX = /^[0-9]{8}$/;

const getSingaporePhoneError = (value, { required = false, t } = {}) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return required ? (t ? t("volunteerRegistration.validation.step1.phoneRequired") : "Mobile number is required") : "";
  if (digits.startsWith("0")) {
    return t ? t("volunteerRegistration.validation.step1.phoneNoZero") || "Phone number cannot start with 0" : "Phone number cannot start with 0";
  }
  if (!SINGAPORE_PHONE_REGEX.test(digits)) {
    return t ? t("volunteerRegistration.validation.step1.phoneInvalid") : "Enter a valid 8-digit Singapore number";
  }
  return "";
};

export function VolunteerRegistrationModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    name: "",
    nric_passport_last4: "",
    citizenship: "",
    dob: "",
    age: "",
    gender: "",
    marital_status: "",
    ethnicity: "",
    religion: "",
    occupation: "",
    address: "",
    phone_hp: "",
    phone_res: "",
    email: "",
    other_contribution: "",
    skills_hobbies: "",
    time_from: "09:00",
    time_to: "17:00",
    commitment_duration: "6",
    commitment_unit: "Months",
    signature: "",
    declaration_checked: false,
  });

  // Multiselect interests and days
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      resetForm();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const resetForm = () => {
    setSubmitted(false);
    setStep(1);
    setErrors({});
    setCompletedSteps([]);
    setSelectedInterests([]);
    setSelectedDays([]);
    setFormData({
      title: "",
      name: "",
      nric_passport_last4: "",
      citizenship: "",
      dob: "",
      age: "",
      gender: "",
      marital_status: "",
      ethnicity: "",
      religion: "",
      occupation: "",
      address: "",
      phone_hp: "",
      phone_res: "",
      email: "",
      other_contribution: "",
      skills_hobbies: "",
      time_from: "09:00",
      time_to: "17:00",
      commitment_duration: "6",
      commitment_unit: "Months",
      signature: "",
      declaration_checked: false,
    });
  };

  if (!isOpen) return null;

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = t("volunteerRegistration.validation.step1.titleRequired");
    
    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = t("volunteerRegistration.validation.step1.nameRequired");
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t("volunteerRegistration.validation.step1.nameMin");
    } else if (!/^[A-Za-z\s'-]+$/.test(formData.name.trim())) {
      newErrors.name = t("volunteerRegistration.validation.step1.nameInvalid");
    }

    // NRIC/Passport (Last 4)
    if (!formData.nric_passport_last4) {
      newErrors.nric_passport_last4 = t("volunteerRegistration.validation.step1.nricRequired");
    } else if (!/^[A-Za-z0-9]{4}$/.test(formData.nric_passport_last4)) {
      newErrors.nric_passport_last4 = t("volunteerRegistration.validation.step1.nricInvalid");
    }

    if (!formData.citizenship) newErrors.citizenship = t("volunteerRegistration.validation.step1.citizenshipRequired");
    if (!formData.dob) newErrors.dob = t("volunteerRegistration.validation.step1.dobRequired");
    
    // Age validation
    if (!formData.age) {
      newErrors.age = t("volunteerRegistration.validation.step1.ageRequired");
    } else {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        newErrors.age = t("volunteerRegistration.validation.step1.ageInvalid");
      }
    }

    if (!formData.gender) newErrors.gender = t("volunteerRegistration.validation.step1.genderRequired");
    if (!formData.marital_status) newErrors.marital_status = t("volunteerRegistration.validation.step1.maritalStatusRequired");
    if (!formData.address) newErrors.address = t("volunteerRegistration.validation.step1.addressRequired");
    
    // Telephone H/P (Singapore +65 — 8 digits only)
    const phoneHpError = getSingaporePhoneError(formData.phone_hp, { required: true, t });
    if (phoneHpError) newErrors.phone_hp = phoneHpError;

    const phoneResError = getSingaporePhoneError(formData.phone_res, { t });
    if (phoneResError) newErrors.phone_res = phoneResError;

    // Email Address
    if (!formData.email) {
      newErrors.email = t("volunteerRegistration.validation.step1.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("volunteerRegistration.validation.step1.emailInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (selectedInterests.length === 0 && !formData.other_contribution.trim()) {
      newErrors.interests = t("volunteerRegistration.validation.step2.interestRequired");
    }
    if (selectedDays.length === 0) {
      newErrors.days = t("volunteerRegistration.validation.step2.daysRequired");
    }
    if (!formData.commitment_duration || parseInt(formData.commitment_duration, 10) <= 0) {
      newErrors.commitment_duration = t("volunteerRegistration.validation.step2.commitmentRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.declaration_checked) {
      newErrors.declaration_checked = t("volunteerRegistration.validation.step3.declarationRequired");
    }
    
    // Digital Signature Match check
    if (!formData.signature || formData.signature.trim().length === 0) {
      newErrors.signature = t("volunteerRegistration.validation.step3.signatureRequired");
    } else if (formData.signature.trim().toLowerCase() !== formData.name.trim().toLowerCase()) {
      newErrors.signature = t("volunteerRegistration.validation.step3.signatureMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setCompletedSteps(prev => prev.includes(1) ? prev : [...prev, 1]);
        setStep(2);
        setErrors({});
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setCompletedSteps(prev => prev.includes(2) ? prev : [...prev, 2]);
        setStep(3);
        setErrors({});
      }
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === "checkbox" ? checked : value;

    // Formatting rules
    if (name === "name") {
      // Auto-capitalize words
      processedValue = value.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    } else if (name === "nric_passport_last4") {
      processedValue = value.toUpperCase().slice(0, 4);
    } else if (name === "age") {
      processedValue = value.replace(/\D/g, "").slice(0, 3);
    } else if (name === "phone_hp" || name === "phone_res") {
      processedValue = value.replace(/\D/g, "").slice(0, 8);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    if (name === "phone_hp" || name === "phone_res") {
      const phoneError =
        processedValue.length > 0 && processedValue.length < 8
          ? t("volunteerRegistration.validation.step1.phoneInvalid")
          : "";
      setErrors(prev => ({ ...prev, [name]: phoneError }));
    } else if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleDobChange = (isoDate) => {
    const computedAge = isoDate ? calculateAgeFromDob(isoDate) : "";
    setFormData(prev => ({
      ...prev,
      dob: isoDate,
      age: computedAge,
    }));
    setErrors(prev => {
      const next = { ...prev };
      if (isoDate) delete next.dob;
      if (computedAge) delete next.age;
      return next;
    });
  };

  const handleInterestToggle = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
    if (errors.interests) {
      setErrors(prev => ({ ...prev, interests: "" }));
    }
  };

  const handleDayToggle = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
    if (errors.days) {
      setErrors(prev => ({ ...prev, days: "" }));
    }
  };

  const showSystemNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo.png",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    try {
      setLoading(true);

      const payload = {
        title: formData.title,
        name: formData.name.trim(),
        nric_passport_last4: formData.nric_passport_last4,
        citizenship: formData.citizenship,
        dob: formData.dob,
        age: formData.age,
        gender: formData.gender,
        marital_status: formData.marital_status,
        ethnicity: formData.ethnicity,
        religion: formData.religion,
        occupation: formData.occupation,
        address: formData.address,
        phone_hp: formData.phone_hp,
        phone_res: formData.phone_res,
        email: formData.email,
        interest_areas: selectedInterests.join(","),
        other_contribution: formData.other_contribution,
        skills_hobbies: formData.skills_hobbies,
        preferred_days: selectedDays.join(","),
        time_from: formData.time_from,
        time_to: formData.time_to,
        commitment_duration: formData.commitment_duration,
        commitment_unit: formData.commitment_unit,
        signature: formData.signature,
        declaration_checked: formData.declaration_checked,
      };

      const response = await fetch("/api/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("volunteerRegistration.errors.submissionFailed"));
      }

      setSubmitted(true);
      setCompletedSteps((prev) => (prev.includes(3) ? prev : [...prev, 3]));

      showSystemNotification(
        t("volunteerRegistration.success.notification.title"),
        t("volunteerRegistration.success.notification.message", { name: formData.name })
      );

      window.setTimeout(() => {
        onClose?.();
      }, 2500);
    } catch (error) {
      console.error(error);
      alert(error.message || t("volunteerRegistration.errors.submitError"));
    } finally {
      setLoading(false);
    }
  };

  // Get current date string for submission display
  const getSubmissionDateString = () => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStepTitle = () => {
    if (step === 1) return t("volunteerRegistration.step1.title");
    if (step === 2) return t("volunteerRegistration.step2.title");
    return t("volunteerRegistration.step3.title");
  };

  const getStepSubtitle = () => {
    if (step === 1) {
      return t("volunteerRegistration.step1.subtitle");
    }
    if (step === 2) {
      return t("volunteerRegistration.step2.subtitle");
    }
    return t("volunteerRegistration.step3.subtitle");
  };

  const ErrorMessage = ({ message }) => (
    <div className="h-5 mt-1">
      {message && <p className="text-red-500 text-xs">{message}</p>}
    </div>
  );

  const inputClass = (hasError) =>
    `w-full px-5 py-4 border rounded-[10px] text-[16px] bg-[#FAF8F4] outline-none transition-all ${
      hasError ? "border-red-500" : "border-[#E3E1E1]"
    } focus:border-[#0D4A7A]`;

  const selectClass = (hasError) =>
    `w-full px-5 py-4 border rounded-[10px] text-[16px] text-[#666] bg-[#FAF8F4] outline-none transition-all appearance-none ${
      hasError ? "border-red-500" : "border-[#E3E1E1]"
    } focus:border-[#0D4A7A]`;

  const labelClass = "text-[#0D4A7A] text-[16px] md:text-[18px] font-medium block mb-2";

  const PdpaBanner = () => (
    <div className="bg-[#E8F3DC] rounded-[10px] p-5 flex gap-3 items-center">
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="21" viewBox="0 0 19 21" fill="none" className="block">
          <path
            d="M9.375 4.21588e-09C10.9921 -5.93512e-05 12.5462 0.626631 13.7109 1.7484C14.8756 2.87017 15.5602 4.3997 15.6208 6.01563L15.625 6.25H16.6667C17.1923 6.24983 17.6985 6.44834 18.0839 6.80573C18.4693 7.16311 18.7054 7.65296 18.7448 8.17708L18.75 8.33333V18.75C18.7502 19.2756 18.5517 19.7818 18.1943 20.1672C17.8369 20.5526 17.347 20.7887 16.8229 20.8281L16.6667 20.8333H2.08333C1.55773 20.8335 1.05149 20.635 0.666096 20.2776C0.280699 19.9202 0.0446286 19.4304 0.00520856 18.9063L1.04446e-07 18.75V8.33333C-0.000166228 7.80773 0.19834 7.30149 0.555726 6.9161C0.913112 6.5307 1.40296 6.29463 1.92708 6.25521L2.08333 6.25H3.125C3.125 4.5924 3.78348 3.00269 4.95558 1.83058C6.12769 0.65848 7.7174 4.21588e-09 9.375 4.21588e-09ZM16.6667 8.33333H2.08333V18.75H16.6667V8.33333ZM9.375 10.4167C9.81936 10.4168 10.252 10.559 10.6098 10.8226C10.9676 11.0861 11.2318 11.4571 11.3637 11.8814C11.4957 12.3057 11.4885 12.7611 11.3432 13.1811C11.1979 13.601 10.9222 13.9635 10.5562 14.2156L10.4167 14.3042V15.625C10.4164 15.8905 10.3147 16.1459 10.1324 16.3389C9.95019 16.532 9.70109 16.6482 9.43605 16.6637C9.171 16.6793 8.91002 16.5931 8.70642 16.4226C8.50283 16.2522 8.37198 16.0105 8.34062 15.7469L8.33333 15.625V14.3042C7.93619 14.0749 7.62581 13.7209 7.45032 13.2972C7.27484 12.8735 7.24405 12.4038 7.36275 11.9608C7.48144 11.5178 7.74298 11.1264 8.1068 10.8472C8.47063 10.568 8.9164 10.4167 9.375 10.4167ZM9.375 2.08333C8.26993 2.08333 7.21012 2.52232 6.42872 3.30372C5.64732 4.08512 5.20833 5.14493 5.20833 6.25H13.5417C13.5417 5.14493 13.1027 4.08512 12.3213 3.30372C11.5399 2.52232 10.4801 2.08333 9.375 2.08333Z"
            fill="#1F5500"
          />
        </svg>
      </div>
      <p className="text-[#1F5500] text-[13px] font-medium leading-[19px]">
        {t("volunteerRegistration.pdpa.notice")}
      </p>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100050] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 bg-white w-[90%] max-w-[1100px] rounded-[20px] shadow-2xl flex flex-col max-h-[min(90dvh,calc(100dvh-2rem))] overflow-hidden"
          >
            {/* Progress bars & close */}
            <div className="flex items-start justify-between p-6 md:p-8 pb-0 shrink-0">
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`w-[70px] sm:w-[90px] h-[6px] rounded-[5px] transition-all ${
                    completedSteps.includes(1) ? "bg-[#B8E4A8]" : step >= 1 ? "bg-[#0D4A7A]" : "bg-[#D9D9D9]"
                  }`}
                />
                <div
                  className={`w-[70px] sm:w-[90px] h-[6px] rounded-[5px] transition-all ${
                    completedSteps.includes(2) ? "bg-[#B8E4A8]" : step >= 2 ? "bg-[#0D4A7A]" : "bg-[#D9D9D9]"
                  }`}
                />
                <div
                  className={`w-[70px] sm:w-[90px] h-[6px] rounded-[5px] transition-all ${
                    completedSteps.includes(3) ? "bg-[#B8E4A8]" : step >= 3 ? "bg-[#0D4A7A]" : "bg-[#D9D9D9]"
                  }`}
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[#0D4A7A] text-[14px] font-medium hidden sm:block">
                  {t("volunteerRegistration.common.step", { current: step, total: 3 })}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-black" />
                </button>
              </div>
            </div>

            {submitted ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-4 md:pt-6">
                <div className="min-h-[480px] flex flex-col items-center justify-center text-center px-4 md:px-8">
                  <div className="w-20 h-20 rounded-full bg-[#E8F3DC] flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#1F5500" />
                    </svg>
                  </div>
                  <h2 className="text-[#0D4A7A] text-[24px] md:text-[28px] font-medium mb-3 font-['Outfit']">
                    {t("volunteerRegistration.success.title")}
                  </h2>
                  <p className="text-[#3A3A3A] text-[16px] leading-relaxed max-w-[620px] mb-2">
                    {t("volunteerRegistration.success.message", { name: formData.name })}
                  </p>
                  <p className="text-[#5f6368] text-[14px] max-w-[500px] mb-8">
                    {t("volunteerRegistration.success.description", { email: formData.email })}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3 rounded-full bg-[#1B4585] text-white font-medium hover:bg-[#0D4A7A] transition-all"
                  >
                    {t("volunteerRegistration.success.closeButton")}
                  </button>
                </div>
            </div>
            ) : (
                <form
                  onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 pt-4 md:pt-6 min-h-0">
                  {/* Header with icon + title */}
                  <div className="flex items-start gap-4 md:gap-[26px] mb-6 md:mb-8">
                    <div className="w-[56px] h-[56px] md:w-[70px] md:h-[70px] rounded-[18px] bg-[#0D4A7A29] flex items-center justify-center flex-shrink-0">
                      {step === 1 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#0D4A7A" />
                        </svg>
                      ) : step === 2 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                          <path d="M21.25 2.5H18.75V1.25C18.75 0.918479 18.6183 0.600537 18.3839 0.366116C18.1495 0.131696 17.8315 0 17.5 0C17.1685 0 16.8505 0.131696 16.6161 0.366116C16.3817 0.600537 16.25 0.918479 16.25 1.25V2.5H8.75V1.25C8.75 0.918479 8.6183 0.600537 8.38388 0.366116C8.14946 0.131696 7.83152 0 7.5 0C7.16848 0 6.85054 0.131696 6.61612 0.366116C6.3817 0.600537 6.25 0.918479 6.25 1.25V2.5H3.75C2.75544 2.5 1.80161 2.89509 1.09835 3.59835C0.395088 4.30161 0 5.25544 0 6.25V21.25C0 22.2446 0.395088 23.1984 1.09835 23.9017C1.80161 24.6049 2.75544 25 3.75 25H21.25C22.2446 25 23.1984 24.6049 23.9017 23.9017C24.6049 23.1984 25 22.2446 25 21.25V6.25C25 5.25544 24.6049 4.30161 23.9017 3.59835C23.1984 2.89509 22.2446 2.5 21.25 2.5ZM22.5 21.25C22.5 21.5815 22.3683 21.8995 22.1339 22.1339C21.8995 22.3683 21.5815 22.5 21.25 22.5H3.75C3.41848 22.5 3.10054 22.3683 2.86612 22.1339C2.6317 21.8995 2.5 21.5815 2.5 21.25V12.5H22.5V21.25ZM22.5 10H2.5V6.25C2.5 5.91848 2.6317 5.60054 2.86612 5.36612C3.10054 5.1317 3.41848 5 3.75 5H6.25V6.25C6.25 6.58152 6.3817 6.89946 6.61612 7.13388C6.85054 7.3683 7.16848 7.5 7.5 7.5C7.83152 7.5 8.14946 7.3683 8.38388 7.13388C8.6183 6.89946 8.75 6.58152 8.75 6.25V5H16.25V6.25C16.25 6.58152 16.3817 6.89946 16.6161 7.13388C16.8505 7.3683 17.1685 7.5 17.5 7.5C17.8315 7.5 18.1495 7.3683 18.3839 7.13388C18.6183 6.89946 18.75 6.58152 18.75 6.25V5H21.25C21.5815 5 21.8995 5.1317 22.1339 5.36612C22.3683 5.60054 22.5 5.91848 22.5 6.25V10Z" fill="#0D4A7A" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 28 28" fill="none">
                          <path d="M15.0266 8.18644L20.5963 9.66928M13.8343 12.6151L16.618 13.3571M13.9731 20.9603L15.0861 21.2578C18.2361 22.0978 19.8111 22.5166 21.0525 21.8038C22.2926 21.0921 22.715 19.5253 23.5585 16.3939L24.752 11.9641C25.5966 8.83161 26.0178 7.26594 25.3015 6.03161C24.5851 4.79728 23.0113 4.37844 19.8601 3.53961L18.7471 3.24211C15.5971 2.40211 14.0221 1.98328 12.782 2.69611C11.5406 3.40778 11.1183 4.97461 10.2736 8.10594L9.0813 12.5358C8.23663 15.6683 7.8143 17.2339 8.5318 18.4683C9.24813 19.7014 10.8231 20.1214 13.9731 20.9603Z" stroke="#0D4A7A" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M14 24.4369L12.8893 24.7402C9.74628 25.5954 8.17595 26.0236 6.93695 25.2967C5.70028 24.5711 5.27795 22.9739 4.43678 19.7807L3.24562 15.2634C2.40328 12.0702 1.98212 10.4731 2.69728 9.2154C3.31562 8.1269 4.66662 8.16656 6.41662 8.16656" stroke="#0D4A7A" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <div className="pt-[2px] min-w-0">
                      <h1 className="text-[#0D4A7A] text-[20px] md:text-[25px] font-medium leading-normal font-['Outfit'] mb-[6px]">
                        {getStepTitle()}
                      </h1>
                      <p className="text-[#0D4A7A] text-[14px] md:text-[15px] font-normal leading-normal font-['DM_Sans'] max-w-[800px]">
                        {getStepSubtitle()}
                      </p>
                      <p className="text-[#0D4A7A] text-[14px] font-medium mt-2 sm:hidden">
                        {t("volunteerRegistration.common.step", { current: step, total: 3 })}
                      </p>
                    </div>
                  </div>

                  <div className="min-h-0">
                  {/* Step 1: Personal & Contact Information */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-[#0D4A7A] text-[18px] font-medium">{t("volunteerRegistration.step1.sections.personalDetails")}</h2>

                      {/* Title, Full Name, NRIC/Passport Last 4 */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="relative">
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.title")} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="title"
                              value={formData.title}
                              onChange={handleChange}
                              className={selectClass(errors.title)}
                            >
                              <option value="">{t("volunteerRegistration.step1.fields.titlePlaceholder")}</option>
                              <option value="Mr.">{t("volunteerRegistration.step1.titleOptions.mr")}</option>
                              <option value="Ms.">{t("volunteerRegistration.step1.titleOptions.ms")}</option>
                              <option value="Mrs.">{t("volunteerRegistration.step1.titleOptions.mrs")}</option>
                              <option value="Dr.">{t("volunteerRegistration.step1.titleOptions.dr")}</option>
                              <option value="Mdm.">{t("volunteerRegistration.step1.titleOptions.mdm")}</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                          </div>
                          <ErrorMessage message={errors.title} />
                        </div>

                        <div className="md:col-span-2">
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.fullName")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.fullNamePlaceholder")}
                            className={inputClass(errors.name)}
                          />
                          <ErrorMessage message={errors.name} />
                        </div>

                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.nricPassport")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="nric_passport_last4"
                            value={formData.nric_passport_last4}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.nricPassportPlaceholder")}
                            maxLength={4}
                            className={inputClass(errors.nric_passport_last4)}
                          />
                          <ErrorMessage message={errors.nric_passport_last4} />
                        </div>
                      </div>

                      {/* Citizenship, Date of Birth, Age */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.citizenship")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="citizenship"
                            value={formData.citizenship}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.citizenshipPlaceholder")}
                            className={inputClass(errors.citizenship)}
                          />
                          <ErrorMessage message={errors.citizenship} />
                        </div>

                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.dateOfBirth")} <span className="text-red-500">*</span>
                          </label>
                          <DateOfBirthPicker
                            value={formData.dob}
                            onChange={handleDobChange}
                            error={Boolean(errors.dob)}
                            placeholder="DD/MM/YYYY"
                          />
                          <ErrorMessage message={errors.dob} />
                        </div>

                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.age")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={formData.age}
                            readOnly
                            disabled
                            tabIndex={-1}
                            placeholder={t("volunteerRegistration.step1.fields.agePlaceholder")}
                            min={1}
                            max={120}
                            className={`${inputClass(errors.age)} bg-slate-100/90 text-slate-700 font-medium cursor-not-allowed select-none`}
                          />
                          <ErrorMessage message={errors.age} />
                        </div>
                      </div>

                      {/* Gender, Marital Status, Ethnicity */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.gender")} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="gender"
                              value={formData.gender}
                              onChange={handleChange}
                              className={selectClass(errors.gender)}
                            >
                              <option value="">{t("volunteerRegistration.step1.fields.genderPlaceholder")}</option>
                              <option value="Male">{t("volunteerRegistration.step1.genderOptions.male")}</option>
                              <option value="Female">{t("volunteerRegistration.step1.genderOptions.female")}</option>
                              <option value="Other">{t("volunteerRegistration.step1.genderOptions.other")}</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                          </div>
                          <ErrorMessage message={errors.gender} />
                        </div>

                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.maritalStatus")} <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <select
                              name="marital_status"
                              value={formData.marital_status}
                              onChange={handleChange}
                              className={selectClass(errors.marital_status)}
                            >
                              <option value="">{t("volunteerRegistration.step1.fields.maritalStatusPlaceholder")}</option>
                              <option value="Single">{t("volunteerRegistration.step1.maritalStatusOptions.single")}</option>
                              <option value="Married">{t("volunteerRegistration.step1.maritalStatusOptions.married")}</option>
                              <option value="Divorced">{t("volunteerRegistration.step1.maritalStatusOptions.divorced")}</option>
                              <option value="Widowed">{t("volunteerRegistration.step1.maritalStatusOptions.widowed")}</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                          </div>
                          <ErrorMessage message={errors.marital_status} />
                        </div>

                        <div>
                          <label className={labelClass}>{t("volunteerRegistration.step1.fields.ethnicity")}</label>
                          <input
                            type="text"
                            name="ethnicity"
                            value={formData.ethnicity}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.ethnicityPlaceholder")}
                            className={inputClass(false)}
                          />
                        </div>
                      </div>

                      {/* Religion, Occupation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                          <label className={labelClass}>{t("volunteerRegistration.step1.fields.religion")}</label>
                          <input
                            type="text"
                            name="religion"
                            value={formData.religion}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.religionPlaceholder")}
                            className={inputClass(false)}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>{t("volunteerRegistration.step1.fields.occupation")}</label>
                          <input
                            type="text"
                            name="occupation"
                            value={formData.occupation}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.occupationPlaceholder")}
                            className={inputClass(false)}
                          />
                        </div>
                      </div>

                      {/* Contact Details */}
                      <h2 className="text-[#0D4A7A] text-[18px] font-medium pt-2">{t("volunteerRegistration.step1.sections.contactDetails")}</h2>

                      <div>
                        <label className={labelClass}>
                          {t("volunteerRegistration.step1.fields.address")} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder={t("volunteerRegistration.step1.fields.addressPlaceholder")}
                          rows={2}
                          className={`${inputClass(errors.address)} resize-none`}
                        />
                        <ErrorMessage message={errors.address} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.phoneMobile")} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex">
                            <div className="flex items-center px-4 py-4 bg-[#EDEAE4] border border-[#E3E1E1] border-r-0 rounded-l-[10px] text-[16px] text-[#0D4A7A] font-medium shrink-0">
                              +65
                            </div>
                            <input
                              type="tel"
                              name="phone_hp"
                              value={formData.phone_hp}
                              onChange={handleChange}
                              placeholder={t("volunteerRegistration.step1.fields.phonePlaceholder")}
                              inputMode="numeric"
                              maxLength={8}
                              className={`${inputClass(errors.phone_hp)} rounded-l-none`}
                            />
                          </div>
                          <ErrorMessage message={errors.phone_hp} />
                        </div>

                        <div>
                          <label className={labelClass}>{t("volunteerRegistration.step1.fields.phoneResidence")}</label>
                          <div className="flex">
                            <div className="flex items-center px-4 py-4 bg-[#EDEAE4] border border-[#E3E1E1] border-r-0 rounded-l-[10px] text-[16px] text-[#0D4A7A] font-medium shrink-0">
                              +65
                            </div>
                            <input
                              type="tel"
                              name="phone_res"
                              value={formData.phone_res}
                              onChange={handleChange}
                              placeholder={t("volunteerRegistration.step1.fields.phonePlaceholder")}
                              inputMode="numeric"
                              maxLength={8}
                              className={`${inputClass(errors.phone_res)} rounded-l-none`}
                            />
                          </div>
                          <ErrorMessage message={errors.phone_res} />
                        </div>

                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step1.fields.email")} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step1.fields.emailPlaceholder")}
                            className={inputClass(errors.email)}
                          />
                          <ErrorMessage message={errors.email} />
                        </div>
                      </div>

                      <PdpaBanner />
                    </div>
                  )}

                  {/* Step 2: Interests & Availability */}
                  {step === 2 && (
                    <div>
                      <div>
                        <h2 className="text-[#0D4A7A] text-[18px] font-medium">{t("volunteerRegistration.step2.sections.interestAreas")}</h2>
                        <p className="text-[#0D4A7A]/70 text-[14px] mt-1 mb-4">
                          {t("volunteerRegistration.step2.interestDescription")}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {INTEREST_AREAS.map(area => {
                            const isSelected = selectedInterests.includes(area.id);
                            const IconComponent = area.icon;
                            return (
                              <div
                                key={area.id}
                                onClick={() => handleInterestToggle(area.id)}
                                className={`p-4 rounded-[10px] border-2 cursor-pointer transition-all duration-300 flex items-start gap-4 select-none ${
                                  isSelected
                                    ? "border-[#0D4A7A] bg-[#E3F1FC] shadow-sm"
                                    : "border-[#E3E1E1] bg-[#FAF8F4] hover:border-[#0D4A7A]/50 hover:shadow-sm"
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${area.color}`}>
                                  <IconComponent size={20} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-neutral-800 text-[15px] font-bold">
                                    {t(area.titleKey)}
                                  </span>
                                  <span className="text-neutral-500 text-[12px] leading-relaxed mt-0.5">
                                    {t(area.descriptionKey)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {errors.interests && <p className="text-red-500 text-[12px] mt-1">{errors.interests}</p>}
                      </div>

                      <div className="mt-8">
                        <label className={labelClass}>
                          {t("volunteerRegistration.step2.fields.otherContribution")}
                        </label>
                        <input
                          type="text"
                          name="other_contribution"
                          value={formData.other_contribution}
                          onChange={handleChange}
                          placeholder={t("volunteerRegistration.step2.fields.otherContributionPlaceholder")}
                          className={inputClass(false)}
                        />
                      </div>

                      <div className="mt-8">
                        <label className={labelClass}>{t("volunteerRegistration.step2.fields.skillsHobbies")}</label>
                        <textarea
                          name="skills_hobbies"
                          value={formData.skills_hobbies}
                          onChange={handleChange}
                          placeholder={t("volunteerRegistration.step2.fields.skillsHobbiesPlaceholder")}
                          rows={3}
                          className={`${inputClass(false)} resize-none`}
                        />
                      </div>

                      <div className="mt-8">
                        <div className="flex items-center gap-2 text-[#0D4A7A] font-medium text-[18px] mb-2">
                          <Calendar size={18} />
                          <span>{t("volunteerRegistration.step2.sections.availability")}</span>
                        </div>

                        <div>
                          <label className={labelClass}>
                            {t("volunteerRegistration.step2.fields.preferredDays")} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {DAY_OPTIONS.map(({ value: day, labelKey }) => {
                              const isSelected = selectedDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => handleDayToggle(day)}
                                  className={`px-5 py-2.5 rounded-full text-[13px] font-medium border transition-all duration-200 select-none ${
                                    isSelected
                                      ? "bg-[#1B4585] text-white border-[#1B4585] shadow-sm"
                                      : "bg-[#FAF8F4] text-[#3A3A3A] border-[#E3E1E1] hover:border-[#0D4A7A]"
                                  }`}
                                >
                                  {t(labelKey)}
                                </button>
                              );
                            })}
                          </div>
                          {errors.days && <p className="text-red-500 text-[11px] mt-1.5">{errors.days}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
                          <div>
                            <label className={`${labelClass} flex items-center gap-1.5`}>
                              <Clock size={14} className="text-neutral-400" />
                              {t("volunteerRegistration.step2.fields.timeFrom")}
                            </label>
                            <input
                              type="time"
                              name="time_from"
                              value={formData.time_from}
                              onChange={handleChange}
                              className={`${inputClass(false)} text-neutral-700`}
                            />
                          </div>
                          <div>
                            <label className={`${labelClass} flex items-center gap-1.5`}>
                              <Clock size={14} className="text-neutral-400" />
                              {t("volunteerRegistration.step2.fields.timeTo")}
                            </label>
                            <input
                              type="time"
                              name="time_to"
                              value={formData.time_to}
                              onChange={handleChange}
                              className={`${inputClass(false)} text-neutral-700`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flex items-center gap-2 text-[#0D4A7A] font-medium text-[18px] mb-2">
                          <ShieldCheck size={18} />
                          <span>{t("volunteerRegistration.step2.sections.commitment")}</span>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4 md:gap-6 shrink-0">
                            <div className="w-full sm:w-[180px]">
                              <label className={labelClass}>
                                {t("volunteerRegistration.step2.fields.expectedDuration")} <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                name="commitment_duration"
                                value={formData.commitment_duration}
                                onChange={handleChange}
                                placeholder={t("volunteerRegistration.step2.fields.durationPlaceholder")}
                                min={1}
                                className={inputClass(errors.commitment_duration)}
                              />
                              <ErrorMessage message={errors.commitment_duration} />
                            </div>

                            <div className="w-full sm:w-[180px]">
                              <label className={labelClass}>
                                {t("volunteerRegistration.step2.fields.unit")} <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  name="commitment_unit"
                                  value={formData.commitment_unit}
                                  onChange={handleChange}
                                  className={selectClass(false)}
                                >
                                  <option value="Weeks">{t("volunteerRegistration.step2.units.weeks")}</option>
                                  <option value="Months">{t("volunteerRegistration.step2.units.months")}</option>
                                  <option value="Years">{t("volunteerRegistration.step2.units.years")}</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          <p className="text-[13px] text-[#0D4A7A]/70 font-medium italic leading-snug lg:flex-1 lg:max-w-[340px] lg:mt-8 lg:min-h-[52px] lg:flex lg:items-center">
                            {t("volunteerRegistration.step2.notes.minimumCommitment")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Declaration & Digital Signature */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <h2 className="text-[#0D4A7A] text-[18px] font-medium">{t("volunteerRegistration.step3.sections.declaration")}</h2>

                      <div className="bg-[#E8F3DC] border-l-4 border-[#0D4A7A] rounded-[10px] p-5 flex items-start gap-4">
                        <div className="mt-1 flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            name="declaration_checked"
                            id="declaration_checked"
                            checked={formData.declaration_checked}
                            onChange={handleChange}
                            className="w-5 h-5 rounded text-[#0D4A7A] focus:ring-[#0D4A7A] border-neutral-300 cursor-pointer"
                          />
                        </div>
                        <label
                          htmlFor="declaration_checked"
                          className="text-[#1F5500] text-[14px] leading-relaxed cursor-pointer font-medium select-none"
                        >
                          {t("volunteerRegistration.step3.declaration.text")}
                        </label>
                      </div>
                      {errors.declaration_checked && (
                        <p className="text-red-500 text-[12px] -mt-2 px-2">{errors.declaration_checked}</p>
                      )}

                      <div className="space-y-2">
                        <label className={labelClass}>
                          {t("volunteerRegistration.step3.sections.signature")} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="signature"
                            value={formData.signature}
                            onChange={handleChange}
                            placeholder={t("volunteerRegistration.step3.fields.signaturePlaceholder")}
                            className={`${inputClass(errors.signature)} pl-12`}
                          />
                          <PenTool size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                        <p className="text-[#0D4A7A]/70 text-[12px] font-medium italic">
                          {t("volunteerRegistration.step3.signature.helperText")}
                        </p>
                        <ErrorMessage message={errors.signature} />
                      </div>

                      <div className="space-y-2">
                        <label className={labelClass}>{t("volunteerRegistration.step3.sections.submissionDate")}</label>
                        <div className="relative">
                          <div className="w-full pl-12 pr-5 py-4 border border-[#E3E1E1] rounded-[10px] text-[16px] bg-[#FAF8F4] text-neutral-700 font-medium select-none flex items-center">
                            {getSubmissionDateString()}
                          </div>
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                      </div>

                      <PdpaBanner />
                    </div>
                  )}

                  </div>
                  </div>

                  {/* Bottom Navigation Buttons — fixed footer, does not scroll */}
                  <div className="flex-shrink-0 flex justify-end items-center gap-4 px-6 md:px-8 py-4 border-t border-gray-100 bg-white rounded-b-[20px]">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-8 py-3 rounded-full border border-[#0D4A7A] text-[#0D4A7A] font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24" fill="none" className="rotate-180">
                          <path fillRule="evenodd" clipRule="evenodd" d="M10.157 12.711L4.5 18.368L3.086 16.954L8.036 12.004L3.086 7.05401L4.5 5.64001L10.157 11.297C10.3445 11.4845 10.4498 11.7389 10.4498 12.004C10.4498 12.2692 10.3445 12.5235 10.157 12.711Z" fill="#0D4A7A" />
                        </svg>
                        {t("volunteerRegistration.common.back")}
                      </button>
                    )}

                    {step < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-8 py-3 rounded-full bg-[#1B4585] text-white font-medium flex items-center gap-2 hover:bg-[#0D4A7A] transition-all"
                      >
                        {t("volunteerRegistration.common.continue")}
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24" fill="none">
                          <path fillRule="evenodd" clipRule="evenodd" d="M10.157 12.711L4.5 18.368L3.086 16.954L8.036 12.004L3.086 7.05401L4.5 5.64001L10.157 11.297C10.3445 11.4845 10.4498 11.7389 10.4498 12.004C10.4498 12.2692 10.3445 12.5235 10.157 12.711Z" fill="white" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 rounded-full bg-[#1B4585] text-white font-medium hover:bg-[#0D4A7A] transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t("volunteerRegistration.common.submitting")}
                          </div>
                        ) : (
                          <>
                            {t("volunteerRegistration.common.submitApplication")}
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="24" viewBox="0 0 12 24" fill="none">
                              <path fillRule="evenodd" clipRule="evenodd" d="M10.157 12.711L4.5 18.368L3.086 16.954L8.036 12.004L3.086 7.05401L4.5 5.64001L10.157 11.297C10.3445 11.4845 10.4498 11.7389 10.4498 12.004C10.4498 12.2692 10.3445 12.5235 10.157 12.711Z" fill="white" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
