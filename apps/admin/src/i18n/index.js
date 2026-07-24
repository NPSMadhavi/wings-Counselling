import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enHome from "./locales/en/Home.json";
import enAboutus from "./locales/en/Aboutus.json";
import enServices from "./locales/en/Services.json";
import enSubServices from "./locales/en/SubServices.json";
import enTeam from "./locales/en/Team.json";
import enEvents from "./locales/en/Events.json";
import enArticles from "./locales/en/Articles.json";
import enArticleDetail from "./locales/en/ArticleDetail.json";
import enVolunteer from "./locales/en/Volunteer.json";
import enVolunteerRegistration from "./locales/en/VolunteerRegistration.json";
import enPartners from "./locales/en/Partners.json";
import enCareers from "./locales/en/Careers.json";
import enSupportTopic from "./locales/en/SupportTopic.json";
import enSupportTopicsContent from "./locales/en/SupportTopicsContent.json";
import enAppointmentModal from "./locales/en/AppointmentModal.json";
import enCandidateAuthModal from "./locales/en/CandidateAuthModal.json";
import enPrivacyPolicy from "./locales/en/PrivacyPolicy.json";
import enTermsConditions from "./locales/en/TermsConditions.json";

import msHome from "./locales/ms/Home.json";
import msAboutus from "./locales/ms/Aboutus.json";
import msServices from "./locales/ms/Services.json";
import msSubServices from "./locales/ms/SubServices.json";
import msTeam from "./locales/ms/Team.json";
import msEvents from "./locales/ms/Events.json";
import msArticles from "./locales/ms/Articles.json";
import msArticleDetail from "./locales/ms/ArticleDetail.json";
import msVolunteer from "./locales/ms/Volunteer.json";
import msVolunteerRegistration from "./locales/ms/VolunteerRegistration.json";
import msPartners from "./locales/ms/Partners.json";
import msCareers from "./locales/ms/Careers.json";
import msSupportTopic from "./locales/ms/SupportTopic.json";
import msSupportTopicsContent from "./locales/ms/SupportTopicsContent.json";
import msAppointmentModal from "./locales/ms/AppointmentModal.json";
import msCandidateAuthModal from "./locales/ms/CandidateAuthModal.json";
import msPrivacyPolicy from "./locales/ms/PrivacyPolicy.json";
import msTermsConditions from "./locales/ms/TermsConditions.json";

import zhHome from "./locales/zh/Home.json";
import zhAboutus from "./locales/zh/Aboutus.json";
import zhServices from "./locales/zh/Services.json";
import zhSubServices from "./locales/zh/SubServices.json";
import zhTeam from "./locales/zh/Team.json";
import zhEvents from "./locales/zh/Events.json";
import zhArticles from "./locales/zh/Articles.json";
import zhArticleDetail from "./locales/zh/ArticleDetail.json";
import zhVolunteer from "./locales/zh/Volunteer.json";
import zhVolunteerRegistration from "./locales/zh/VolunteerRegistration.json";
import zhPartners from "./locales/zh/Partners.json";
import zhCareers from "./locales/zh/Careers.json";
import zhSupportTopic from "./locales/zh/SupportTopic.json";
import zhSupportTopicsContent from "./locales/zh/SupportTopicsContent.json";
import zhAppointmentModal from "./locales/zh/AppointmentModal.json";
import zhCandidateAuthModal from "./locales/zh/CandidateAuthModal.json";
import zhPrivacyPolicy from "./locales/zh/PrivacyPolicy.json";
import zhTermsConditions from "./locales/zh/TermsConditions.json";

import hiHome from "./locales/hi/Home.json";
import hiAboutus from "./locales/hi/Aboutus.json";
import hiServices from "./locales/hi/Services.json";
import hiSubServices from "./locales/hi/SubServices.json";
import hiTeam from "./locales/hi/Team.json";
import hiEvents from "./locales/hi/Events.json";
import hiArticles from "./locales/hi/Articles.json";
import hiArticleDetail from "./locales/hi/ArticleDetail.json";
import hiVolunteer from "./locales/hi/Volunteer.json";
import hiVolunteerRegistration from "./locales/hi/VolunteerRegistration.json";
import hiPartners from "./locales/hi/Partners.json";
import hiCareers from "./locales/hi/Careers.json";
import hiSupportTopic from "./locales/hi/SupportTopic.json";
import hiSupportTopicsContent from "./locales/hi/SupportTopicsContent.json";
import hiAppointmentModal from "./locales/hi/AppointmentModal.json";
import hiCandidateAuthModal from "./locales/hi/CandidateAuthModal.json";
import hiPrivacyPolicy from "./locales/hi/PrivacyPolicy.json";
import hiTermsConditions from "./locales/hi/TermsConditions.json";

import taHome from "./locales/ta/Home.json";
import taAboutus from "./locales/ta/Aboutus.json";
import taServices from "./locales/ta/Services.json";
import taSubServices from "./locales/ta/SubServices.json";
import taTeam from "./locales/ta/Team.json";
import taEvents from "./locales/ta/Events.json";
import taArticles from "./locales/ta/Articles.json";
import taArticleDetail from "./locales/ta/ArticleDetail.json";
import taVolunteer from "./locales/ta/Volunteer.json";
import taVolunteerRegistration from "./locales/ta/VolunteerRegistration.json";
import taPartners from "./locales/ta/Partners.json";
import taCareers from "./locales/ta/Careers.json";
import taSupportTopic from "./locales/ta/SupportTopic.json";
import taSupportTopicsContent from "./locales/ta/SupportTopicsContent.json";
import taAppointmentModal from "./locales/ta/AppointmentModal.json";
import taCandidateAuthModal from "./locales/ta/CandidateAuthModal.json";
import taPrivacyPolicy from "./locales/ta/PrivacyPolicy.json";
import taTermsConditions from "./locales/ta/TermsConditions.json";

function deepMerge(...sources) {
    const isObject = (value) =>
        value && typeof value === "object" && !Array.isArray(value);

    return sources.reduce((acc, source) => {
        if (!source) return acc;

        Object.keys(source).forEach((key) => {
            const current = acc[key];
            const next = source[key];

            if (isObject(current) && isObject(next)) {
                acc[key] = deepMerge(current, next);
            } else {
                acc[key] = next;
            }
        });

        return acc;
    }, {});
}

const en = deepMerge(
    enHome,
    enAboutus,
    enServices,
    enSubServices,
    enTeam,
    enEvents,
    enArticles,
    enArticleDetail,
    enVolunteer,
    enVolunteerRegistration,
    enPartners,
    enCareers,
    enSupportTopic,
    enSupportTopicsContent,
    enAppointmentModal,
    enCandidateAuthModal,
    enPrivacyPolicy,
    enTermsConditions,
);

const ms = deepMerge(
    msHome,
    msAboutus,
    msServices,
    msSubServices,
    msTeam,
    msEvents,
    msArticles,
    msArticleDetail,
    msVolunteer,
    msVolunteerRegistration,
    msPartners,
    msCareers,
    msSupportTopic,
    msSupportTopicsContent,
    msAppointmentModal,
    msCandidateAuthModal,
    msPrivacyPolicy,
    msTermsConditions,
);

const zh = deepMerge(
    zhHome,
    zhAboutus,
    zhServices,
    zhSubServices,
    zhTeam,
    zhEvents,
    zhArticles,
    zhArticleDetail,
    zhVolunteer,
    zhVolunteerRegistration,
    zhPartners,
    zhCareers,
    zhSupportTopic,
    zhSupportTopicsContent,
    zhAppointmentModal,
    zhCandidateAuthModal,
    zhPrivacyPolicy,
    zhTermsConditions,
);

const hi = deepMerge(
    hiHome,
    hiAboutus,
    hiServices,
    hiSubServices,
    hiTeam,
    hiEvents,
    hiArticles,
    hiArticleDetail,
    hiVolunteer,
    hiVolunteerRegistration,
    hiPartners,
    hiCareers,
    hiSupportTopic,
    hiSupportTopicsContent,
    hiAppointmentModal,
    hiCandidateAuthModal,
    hiPrivacyPolicy,
    hiTermsConditions,
);

const ta = deepMerge(
    taHome,
    taAboutus,
    taServices,
    taSubServices,
    taTeam,
    taEvents,
    taArticles,
    taArticleDetail,
    taVolunteer,
    taVolunteerRegistration,
    taPartners,
    taCareers,
    taSupportTopic,
    taSupportTopicsContent,
    taAppointmentModal,
    taCandidateAuthModal,
    taPrivacyPolicy,
    taTermsConditions,
);

i18n
.use(LanguageDetector)
.use(initReactI18next)
.init({
    resources:{
        en:{
            translation: en,
        },
        ms:{
            translation: ms,
        },
        zh:{
            translation: zh,
        },
        hi:{
            translation: hi,
        },
        ta:{
            translation: ta,
        }
    },

    fallbackLng:"en",

    interpolation:{
        escapeValue:false,
    }
});

export default i18n;
