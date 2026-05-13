import { motion } from "framer-motion";
import { Phone, Mail, Clock, MapPin } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h4 className="text-primary font-bold tracking-wider uppercase text-sm mb-3">Get in Touch</h4>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">Contact & Location</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-10"
          >
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Operating Hours</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex justify-between border-b border-border/50 pb-2">
                      <span className="font-medium">Mon - Fri (exc. Thu)</span>
                      <span>8:30am – 5:30pm</span>
                    </li>
                    <li className="flex justify-between border-b border-border/50 pb-2">
                      <span className="font-medium">Thursdays</span>
                      <span>8:30am – 7:30pm</span>
                    </li>
                    <li className="flex justify-between border-b border-border/50 pb-2">
                      <span className="font-medium">Saturdays (2nd & 4th)</span>
                      <span>9:00am – 12:30pm</span>
                    </li>
                    <li className="flex justify-between text-destructive">
                      <span className="font-medium">Sun & Public Holidays</span>
                      <span>Closed</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Phone</h3>
                  <a href="tel:+6563835745" className="text-lg text-muted-foreground hover:text-primary font-medium transition-colors">
                    6383 5745
                  </a>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Email</h3>
                  <a href="mailto:admin@wingscounselling.org.sg" className="text-lg text-muted-foreground hover:text-primary font-medium transition-colors">
                    admin@wingscounselling.org.sg
                  </a>
                </div>
              </div>

              <div className="flex gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">Address</h3>
                  <a
                    href="https://maps.google.com/?q=179+Bartley+Road+Singapore+539784"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-muted-foreground hover:text-primary font-medium transition-colors"
                  >
                    179 Bartley Road<br />
                    Singapore 539784
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300">
                Request an Appointment
              </button>
            </div>
          </motion.div>

          {/* Map Side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="h-[450px] lg:h-auto min-h-[450px] rounded-3xl overflow-hidden shadow-lg border border-border relative"
          >
            <iframe
              src="https://maps.google.com/maps?q=Ramakrishna+Mission+WINGS+Counselling+Centre+179+Bartley+Road+Singapore&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '450px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="WINGS Counselling Centre — 179 Bartley Road, Singapore 539784"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
}
