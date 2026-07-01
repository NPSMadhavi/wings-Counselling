import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";


const partners = [
    {
        id: 1,
        name: "Holy Tree Sri Balasubramaniar Temple",
        logo: "/assets/partnerlogo.png",
    },
];

export function Partners() {
    const sectionRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

    return (
        <section
            ref={sectionRef}
            className="
                relative
                w-full
                flex
                flex-col
                items-center
                overflow-hidden
                bg-[#F9F9F9]
                pt-[60px]
                pb-[80px]
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
                    {/* Partners Flex Container */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
    {[...partners,].map((partner, index) => (
        <motion.div
            key={`${partner.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="
                flex
                flex-col
                items-center
                justify-start
                gap-2
                px-5
                pt-8
                pb-5
                md:pt-6
                md:pb-6
                w-full
                min-h-[230px]
                md:min-h-0
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
                src="/assets/partnerlogo.png"
                alt={partner.name}
                className="w-[170px] h-[140px] md:w-[200px] md:h-[170px] lg:w-[220px] lg:h-[185px] object-contain"
            />

            <p
                className="text-center font-['DM_Sans'] font-medium text-[14px] md:text-[18px] lg:text-[18px] text-[#111827] leading-[1.4]"
            >
                {partner.name}
            </p>
        </motion.div>
    ))}
</div>
                </div>
            </div>
        </section>
    );
}