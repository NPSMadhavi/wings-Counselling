import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Calendar, MessageSquare, Lock, ChevronDown } from "lucide-react";

export function AppointmentModal({ isOpen, onClose }) {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content - Reduced height */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-[666px] max-h-[90vh] overflow-hidden rounded-[20px] shadow-2xl flex flex-col"
          >
            {/* Header - Reduced height */}
            <div
              className="w-full bg-[#1B4585] px-5 py-4 flex items-start justify-between shrink-0"
              style={{ borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}
            >
              <div className="flex flex-col">
                <h2 className="text-white font-['Outfit'] font-medium text-[20px] leading-none mb-1">
                  Book Your Appointment
                </h2>
                <p className="text-white/90 font-['DM_Sans'] font-normal text-[12px] leading-none">
                  Take the first step towards healing
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body - Reduced padding and gaps */}
            <div className="overflow-y-auto p-5 md:p-6 custom-scrollbar">
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>

                {/* Section: Identification - Reduced gap */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[22px] h-[22px] flex items-center justify-center text-[#1B4585]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h10" /></svg>
                    </div>
                    <h3 className="font-['DM_Sans'] font-medium text-[16px] text-black">Identification</h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                      NRIC/FIN Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. S123456"
                      className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                      Name (As per NRIC/FIN Number) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full name as shown on NRIC/FIN"
                      className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors"
                    />
                  </div>
                </div>

                {/* Section: Personal Details - Reduced gap */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[22px] h-[22px] flex items-center justify-center text-[#1B4585]">
                      <User size={22} />
                    </div>
                    <h3 className="font-['DM_Sans'] font-medium text-[16px] text-black">Personal Details</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                        Age <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 25"
                        className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors appearance-none bg-white">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                        Nationality <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors appearance-none bg-white">
                          <option value="">Select</option>
                          <option value="singaporean">Singaporean</option>
                          <option value="pr">Permanent Resident</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Contact Information - Reduced gap */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[22px] h-[22px] flex items-center justify-center text-[#1B4585]">
                      <Phone size={22} />
                    </div>
                    <h3 className="font-['DM_Sans'] font-medium text-[16px] text-black">Contact Information</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="John@example.com"
                        className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+643816768"
                        className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors"
                      />
                      <span className="text-[10px] text-gray-500 font-['DM_Sans']">Include country code if calling from overseas</span>
                    </div>
                  </div>
                </div>

                {/* Section: Appointment Booking - Reduced gap */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[22px] h-[22px] flex items-center justify-center text-[#1B4585]">
                      <Calendar size={22} />
                    </div>
                    <h3 className="font-['DM_Sans'] font-medium text-[16px] text-black">Appointment Booking</h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                      Counseling Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select className="w-full h-[38px] px-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors appearance-none bg-white">
                        <option value="">Select Counselling Type</option>
                        <option value="individual">Individual Counselling</option>
                        <option value="couple">Couple Counselling</option>
                        <option value="family">Family Counselling</option>
                        <option value="youth">Youth Counselling</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
                    </div>
                  </div>
                </div>

                {/* Section: Brief Description of Concerns - Reduced gap */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[22px] h-[22px] flex items-center justify-center text-[#1B4585]">
                      <MessageSquare size={22} />
                    </div>
                    <h3 className="font-['DM_Sans'] font-medium text-[16px] text-black">Brief Description of Concerns</h3>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-['DM_Sans'] font-medium text-[13px] text-black">
                      Please share what brings you here today <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Please describe your concern"
                      className="w-full min-h-[100px] p-3 border border-gray-300 rounded-[5px] font-['DM_Sans'] text-[12px] outline-none focus:border-[#1B4585] transition-colors resize-none"
                    />
                    <span className="text-[10px] text-gray-500 font-['DM_Sans']">This information helps our counselors prepare for your session and provide you with the best support.</span>
                  </div>
                </div>

                {/* Privacy Notice - Reduced padding */}
                <div className="bg-[#E8F4FD] p-3 rounded-[10px] flex gap-3 items-start">
                  <Lock size={18} className="text-[#1B4585] shrink-0 mt-0.5" />
                  <p className="font-['DM_Sans'] text-[11px] leading-relaxed text-black">
                    Your privacy and confidentiality are protected. All personal information, including NRIC/FIN, is securely stored and will only be used for appointment scheduling and counseling services. We comply with Singapore's Personal Data Protection Act (PDPA).
                  </p>
                </div>

                {/* Submit Button - Reduced padding */}
                <div className="flex justify-end pt-2 pb-2">
                  <button
                    type="submit"
                    className="bg-[#1B4585] text-white font-['DM_Sans'] font-semibold text-[15px] px-8 py-2.5 rounded-full hover:bg-[#16386b] transition-all active:scale-95 shadow-lg"
                  >
                    Submit request
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}