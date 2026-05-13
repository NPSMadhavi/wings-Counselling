import { motion } from "framer-motion";
import { Info, PhoneCall } from "lucide-react";

export function CovidNotice() {
  return (
    <section className="py-12 bg-primary relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute w-[200%] h-[200%] top-[-50%] left-[-50%] animate-[spin_60s_linear_infinite]">
          <path fill="currentColor" d="M38,15C53,10,68,23,73,38C79,53,65,70,50,75C35,79,18,65,13,50C8,35,23,20,38,15Z"></path>
        </svg>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center text-white"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Info className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-white">Services Notice</h3>
          <p className="text-primary-foreground/80 mb-6 leading-relaxed">
            In light of current health guidelines, we continue to offer both in-person and remote counselling services. Your safety and mental well-being remain our top priority.
          </p>
          <a 
            href="tel:+6563835745" 
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-accent transition-colors shadow-lg"
          >
            <PhoneCall className="w-4 h-4" />
            Contact us for details
          </a>
        </motion.div>
      </div>
    </section>
  );
}
