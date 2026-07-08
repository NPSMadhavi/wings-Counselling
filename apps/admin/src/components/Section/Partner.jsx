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
                            mb-7
                            text-[#0D4A7A]
                        "
                    >
                        Our trusted partners
                    </motion.h2>

                    
                   {/* Partners Grid */}
<div className="flex flex-wrap justify-center gap-3 w-full">
    {partners.map((partner, index) => (
        <motion.div
            key={`${partner.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="
                flex
                items-center
                justify-center
            "
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
