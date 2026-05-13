import { motion } from "framer-motion";
import { useAppointment } from "@/context/AppointmentContext";

/* ─── SVG Icons ────────────────────────────────────────────── */
function RedPinIcon() {
    return (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.14 2 5 5.14 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.14 15.86 2 12 2Z" fill="#FF0000" />
            <circle cx="12" cy="9" r="3" fill="#FFF" />
        </svg>
    )
}

function OutlinePinIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    )
}

function OutlinePhoneIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
    )
}

function OutlineClockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    )
}

function ArrowIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 12L20 12M20 12L14 18M20 12L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function GetInTouch() {
    const { openModal } = useAppointment();
    return (
        <section
            id="contact"
            className="w-full flex flex-col items-center py-12 lg:py-24 px-6 md:px-12 xl:px-[150px] box-border"
            style={{ background: "#F7F6F3" }}
        >
            <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-[35px] font-semibold text-center mb-4"
                style={{
                    color: "#000",
                    fontFamily: "Outfit, sans-serif",
                    margin: "0 0 16px 0"
                }}
            >
                Get in Touch
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-base sm:text-lg md:text-[18px] text-center mb-10 sm:mb-14"
                style={{
                    color: "#333",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: "500",
                }}
            >
                We are here to help you. Reach us during working hours
            </motion.p>

            <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 w-full max-w-[1440px] mx-auto items-stretch">
                {/* Left Side: Cards & Button */}
                <div className="flex flex-col lg:flex-[1.2] xl:flex-[1.3]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                        {/* Address Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="w-full h-auto md:h-[180px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <OutlinePinIcon />
                            </div>
                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-1">Address</h3>
                            <p className="font-['DM_Sans'] font-normal text-[15px] text-[#333] m-0 leading-relaxed max-w-[240px]">
                                179 Bartley Road, Singapore 539784
                            </p>
                        </motion.div>

                        {/* Phone Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="w-full h-auto md:h-[180px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <OutlinePhoneIcon />
                            </div>
                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-1">Phone</h3>
                            <p className="font-['DM_Sans'] font-normal text-[15px] text-[#333] m-0 leading-relaxed">
                                (+65) 6383 5745
                            </p>
                        </motion.div>

                        {/* Operating Hours Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="w-full h-auto md:h-[300px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <OutlineClockIcon />
                            </div>
                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-4">Operating Hours</h3>

                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <span className="font-['DM_Sans'] font-medium text-[15px] text-[#000] w-[140px] leading-tight">Mon - Fri (exc. Thu)</span>
                                    <span className="font-['DM_Sans'] font-medium text-[14px] text-[#1B4585] text-right">8:30am – 5:30pm</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="font-['DM_Sans'] font-medium text-[15px] text-[#000] w-[140px] leading-tight">Thursdays</span>
                                    <span className="font-['DM_Sans'] font-medium text-[14px] text-[#1B4585] text-right">8:30am – 7:30pm</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="font-['DM_Sans'] font-medium text-[15px] text-[#000] w-[140px] leading-tight">Saturdays (2nd & 4th)</span>
                                    <span className="font-['DM_Sans'] font-medium text-[14px] text-[#1B4585] text-right">9:00am – 12:30pm</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="font-['DM_Sans'] font-medium text-[15px] text-[#000] w-[140px] leading-tight">Sun & Public Holidays</span>
                                    <span className="font-['DM_Sans'] font-medium text-[14px] text-[#1B4585] text-right">Closed</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Email Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="w-full h-auto md:h-[300px] rounded-[20px] bg-white border border-[#EAEAEA] p-[24px] flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                        >
                            <div className="w-[45px] h-[45px] rounded-[10px] bg-[#E8F4FD] flex items-center justify-center mb-3">
                                <OutlineClockIcon />
                            </div>
                            <h3 className="font-['DM_Sans'] font-semibold text-[20px] m-0 mb-2">Email</h3>
                            <a href="mailto:admin@wingscounselling.org.sg" className="font-['DM_Sans'] font-normal text-[15px] text-[#000] underline m-0 break-all leading-relaxed">
                                admin@wingscounselling.org.sg
                            </a>
                        </motion.div>
                    </div>

                    {/* Appointment Button */}
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openModal()}
                        className="mt-8 bg-[#1B4585] text-white px-8 py-3.5 rounded-[12px] font-['DM_Sans'] font-semibold text-[17px] w-fit flex items-center gap-3 shadow-lg hover:bg-[#16386b] transition-all"
                    >
                        Request an appointment
                        <ArrowIcon />
                    </motion.button>
                </div>

                {/* Right Side: Map */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="w-full lg:flex-[1] min-h-[300px] md:min-h-[450px] lg:min-h-0 rounded-[20px] relative shadow-[0_8px_30px_rgba(0,0,0,0.05)] bg-center bg-cover overflow-hidden"
                    style={{
                        backgroundImage: "url('/assets/MapImage.png')"
                    }}
                >
                    {/* Map Marker Info Box Overlay */}
                    <div className="absolute top-[25px] left-[15px] w-[190px] h-[100px] bg-white rounded-[10px] p-[15px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex flex-col justify-center z-10">
                        <h4 className="font-['DM_Sans'] font-medium text-[13px] text-[#000] m-0 mb-1 leading-tight">
                            Ramakrishna Mission WINGS Counselling Centre
                        </h4>
                        <p className="font-['DM_Sans'] font-normal text-[11px] text-[#666] m-0 leading-tight">
                            179 Bartley Rd, Singapore 539784
                        </p>
                    </div>

                    {/* Red Map Pin Icon */}
                    <div className="absolute top-[40%] left-[75%] -translate-x-1/2 -translate-y-full z-10 drop-shadow-md scale-125">
                        <RedPinIcon />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
