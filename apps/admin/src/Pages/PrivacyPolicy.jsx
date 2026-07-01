import React from "react";
import { motion } from "framer-motion";
import { Footer } from "@/components/Layout/Footer";

const cardClass =
  "bg-white rounded-[20px] p-7 md:p-10 border border-gray-200 flex flex-col gap-4 md:gap-6";

const sectionTitleClass =
  "text-[24px] sm:text-[26px] md:text-[25px] font-semibold text-[#0D4A7A] font-['Outfit']";

const subTitleClass =
  "text-[#2C2C2A] font-['Outfit'] text-[18px] md:text-[20px] font-semibold";

const bodyClass =
  "text-gray-700 font-['DM_Sans'] leading-[1.85] text-[16px] md:text-[17px]";

export default function PrivacyPolicy() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F9F9F9] font-sans overflow-x-hidden">
      <div className="w-full h-[400px] bg-[#0D4A7A] pt-[120px] sm:pt-[140px] md:pt-[160px] pb-12 sm:pb-16 md:pb-20 text-center relative shrink-0">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-white font-['Outfit'] pt-[70px] font-semibold text-[34px] sm:text-[36px] md:text-[46px] tracking-tight"
            >
              Privacy policy
            </motion.h1>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full bg-[#F9F9F9] pt-5 pb-8 md:pt-8 md:pb-10">
        <div className="navbar-align-outer">
          <div className="navbar-align-inner">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6 md:gap-8"
            >
              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>Who we are</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>
                    Our website address is:{" "}
                    <a
                      href="https://wingscounselling.org.sg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:underline transition"
                    >
                      https://wingscounselling.org.sg
                    </a>
                    .
                  </p>
                  <p>
                    WINGS Counselling Centre respects your personal data and aims to comply with the requirements of the Singapore Data Protection Act (&apos;the Act&apos;) (Cap.26).
                  </p>
                  <p>
                    We collect individual&apos;s personal data during the process of counselling services, providing you with information, other services through our communication and outreach activities as well as enabling you to interact with our donors/and or volunteers/partners.
                  </p>
                  <p>
                    We may disclose your personal data to public agencies (e.g. MSF) because some of the individuals we are serving may be receiving assistance from them.
                  </p>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>
                  What personal data we collect and why we collect it
                </h2>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>Comments</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>
                      When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor&apos;s IP address and browser user agent string to help spam detection.
                    </p>
                    <p>
                      An anonymised string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. The Gravatar service privacy policy is available here:{" "}
                      <a
                        href="https://automattic.com/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-700 hover:underline transition break-all"
                      >
                        https://automattic.com/privacy/
                      </a>
                      . After approval of your comment, your profile picture is visible to the public in the context of your comment.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>Media</h3>
                  <div className={bodyClass}>
                    <p>
                      If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>Contact forms</h2>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>Cookies</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>
                      If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience so that you do not have to fill in your details again when you leave another comment. These cookies will last for one year.
                    </p>
                    <p>
                      If you visit our login page, we will set a temporary cookie to determine if your browser accepts cookies. This cookie contains no personal data and is discarded when you close your browser.
                    </p>
                    <p>
                      When you log in, we will also set up several cookies to save your login information and your screen display choices. Login cookies last for two days, and screen options cookies last for a year. If you select &quot;Remember Me&quot;, your login will persist for two weeks. If you log out of your account, the login cookies will be removed.
                    </p>
                    <p>
                      If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>Embedded content from other websites</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>
                      Articles on this site may include embedded content (e.g. videos, images, articles, etc.). Embedded content from other websites behaves in the exact same way as if the visitor has visited the other website.
                    </p>
                    <p>
                      These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content, including tracking your interaction with the embedded content if you have an account and are logged in to that website.
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>Analytics</h2>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>Who we share your data with</h3>
                  <div className={bodyClass}>
                    <p>
                      If you request a password reset, your IP address will be included in the reset email.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>How long we retain your data</h3>
                  <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                    <p>
                      If you leave a comment, the comment and its metadata are retained indefinitely. This is so we can recognise and approve any follow-up comments automatically instead of holding them in a moderation queue.
                    </p>
                    <p>
                      For users that register on our website (if any), we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username). Website administrators can also see and edit that information.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>What rights you have over your data</h3>
                  <div className={bodyClass}>
                    <p>
                      If you have an account on this site, or have left comments, you can request to receive an exported file of the personal data we hold about you, including any data you have provided to us. You can also request that we erase any personal data we hold about you. This does not include any data we are obliged to keep for administrative, legal, or security purposes.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className={subTitleClass}>Where we send your data</h3>
                  <div className={bodyClass}>
                    <p>
                      Visitor comments may be checked through an automated spam detection service.
                    </p>
                  </div>
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className={cardClass}>
                <h2 className={sectionTitleClass}>Contact Information</h2>
                <div className={`flex flex-col gap-4 md:gap-5 ${bodyClass}`}>
                  <p>
                    We have Data Protection Policies which provide more information about how we collect, use, and disclose your personal data. Should you have any questions or queries relating to your personal data, please contact:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-x-4 gap-y-3 pt-5">
                    <span>Name:</span>
                    <span>Ms Mala</span>

                    <span>Email Address:</span>
                    <span>
                      <a
                        href="mailto:admin@wingscounselling.org.sg"
                        className="text-gray-700 hover:underline font-medium transition"
                      >
                        admin@wingscounselling.org.sg
                      </a>
                    </span>

                    <span>Postal Address:</span>
                    <span>179, Bartley Road, Singapore 539784</span>

                    <span>Telephone No:</span>
                    <span>
                      <a
                        href="tel:63835745"
                        className="text-gray-700 hover:underline font-medium transition"
                      >
                        6383 5745
                      </a>
                    </span>
                  </div>
                </div>
              </motion.section>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
