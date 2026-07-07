import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const FALLBACK_PARTNERS = [
    {
        id: 1,
    
        logo: "/assets/partnerlogo1.png",
    },
    {
        id: 2,
        logo: "/assets/partnerlogo2.png",
    },
];

export function Partners() {
    const sectionRef = useRef(null);
    const [partners, setPartners] = useState(FALLBACK_PARTNERS);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    useEffect(() => {
        let cancelled = false;

        const loadPartners = async () => {
            try {
                const response = await fetch("/api/partners");
                if (!response.ok) throw new Error("Failed to fetch partners");

                const data = await response.json();
                if (!cancelled && Array.isArray(data) && data.length) {
                    setPartners(
                        data.map((partner) => ({
                            id: partner.id,
                            name: partner.name,
                            logo: partner.logo || "/assets/partnerlogo1.png",
                        }))
                    );
                }
            } catch (error) {
                console.error("Error fetching partners:", error);
            }
        };

        loadPartners();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <section
            id="partners"
            ref={sectionRef}
            className="
                relative
                w-full
                flex
                flex-col
                items-center
                overflow-hidden
                bg-[#E8EEF5]
                pt-[60px]
                pb-[60px]
            "
        >
            {/* Background Motion */}
            <motion.div
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{ y: bgY }}
            />

            {/* Main Container */}
            <div className="w-full navbar-align-outer">
                <div className="navbar-align-inner flex flex-col items-center">

                    {/* Heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="
                            text-[clamp(26px,4.8vw,28px)]
                            md:text-[35px]
                            text-center
                            font-['Outfit']
                            font-medium
                            leading-[1.2]
                            mb-4
                            text-[#0D4A7A]
                        "
                    >
                        Our trusted partners
                    </motion.h2>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="
                            text-black
                            text-center
                            font-['DM_Sans']
                            text-[16px]
                            md:text-[20px]
                            font-normal
                            leading-[1.5]
                            line-clamp-2
                            md:line-clamp-none
                            max-w-[700px]
                            mb-12
                        "
                    >
                        Working together to bring you the best mental health support
                    </motion.p>

                    {/* Partners Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                        {partners.map((partner, index) => (
                            <motion.div
                                key={`${partner.id}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                               className="
    flex
    flex-col
    items-center
    justify-center
    px-2
    py-3
    w-[240px]
md:w-[260px]
    min-h-[180px]
    md:min-h-[190px]
    rounded-[16px]
    border
    border-[#E5E7EB]
    bg-white
    overflow-hidden
    transition-all
    duration-300
    hover:shadow-[0_14px_28px_-12px_rgba(0,0,0,0.07),0_2px_8px_-2px_rgba(0,0,0,0.04)]
    hover:-translate-y-1
"
                                style={{
                                    boxShadow:
                                        "0px 15px 8px -2px #0000000A, 0px 14px 28px -12px #00000012",
                                }}
                            >
                               <img
    src={partner.logo}
    alt={partner.name || "Partner logo"}
    className="w-[120px] h-[90px] md:w-[140px] md:h-[100px] object-contain"
    onError={(e) => {
        e.currentTarget.src = "/assets/partnerlogo1.png";
    }}
/>

                               
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
