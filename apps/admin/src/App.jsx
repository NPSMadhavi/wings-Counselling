import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useLayoutEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";

import Home from "@/Pages/Home";
import TeamPage from "@/Pages/TeamPage";
import Careers from "@/Pages/Careers";
import JobDetail from "@/Pages/job-detail";
import Apply from "@/Pages/apply";
import Auth from "@/Pages/auth";
import Profile from "@/Pages/profile";
import AboutUs from "@/Pages/AboutUs";
import ServicePage from "@/Pages/ServicePage";
import EventsPage from "@/Pages/EventsPage";
import ArticlePage from "@/Pages/ArticlePage";
import CandidatePortalPage from "@/Pages/CandidatePortal";
import AdminApp from "@/admin/AdminApp";
import NotFound from "@/Pages/not-found";
import CareersRegister from "@/Pages/CareersRegister";
import CareersVerify from "@/Pages/CareersVerify";

import { CandidateAuthProvider } from "@/context/CandidateAuthContext";
import { AppointmentProvider, useAppointment } from "@/context/AppointmentContext";
import { Navbar } from "@/components/layout/Navbar";
import { AppointmentModal } from "@/components/modals/AppointmentModal";
import  WhatWeDoPage  from "@/Pages/WhatWeDoPage";
import SubServicePage from "./Pages/SubServicePage";
import AnxietyArticlePage from "./Pages/GroundingTechniques";
import Volunteer from "./Pages/Volunteer";
import { VolunteerRegistrationModal } from "./components/modals/VolunteerRegistrationModal";


/* ---------------- Scroll To Top ---------------- */
function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    if (location !== "/") {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return null;
}

/* ---------------- Shared Navbar ---------------- */
function SharedNavbar() {
  const [location] = useLocation();

  const isInterviewBooking = location.startsWith("/candidate/interview-booking/");
  const hidden =
    location.startsWith("/admin") ||
    ((location === "/candidate" || location.startsWith("/candidate/")) && !isInterviewBooking);

  if (hidden) return null;

  return <Navbar />;
}

function VolunteerFormPage() {
  const [, navigate] = useLocation();

  return (
    <VolunteerRegistrationModal
      isOpen
      onClose={() => navigate("/volunteer")}
    />
  );
}

/* ---------------- React Query Client ---------------- */
/* ---------------- Router ---------------- */
function Router() {
  return (
    <Switch>
      <Route path={/^\/admin(?:\/.*)?$/} component={AdminApp} />

      <Route path="/about-us" component={AboutUs} />
      <Route path="/services" component={ServicePage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/articles" component={ArticlePage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/career/apply/:id" component={Apply} />
      <Route path="/career/register" component={CareersRegister} />
      <Route path="/career/verify" component={CareersVerify} />
      <Route path="/career" component={Careers} />
      <Route path="/career/:id" component={JobDetail} />
      {/* Legacy redirects — keep old /careers/* URLs working */}
      <Route path="/careers/apply/:id" component={Apply} />
      <Route path="/careers/register" component={CareersRegister} />
      <Route path="/careers/verify" component={CareersVerify} />
      <Route path="/careers" component={Careers} />
      <Route path="/careers/:id" component={JobDetail} />
      <Route path="/apply/:id" component={Apply} />
      <Route path="/auth" component={Auth} />
      <Route path="/profile" component={Profile} />
      <Route path="/candidate/interview-booking/:applicationId" component={CandidatePortalPage} />
      <Route path="/candidate" component={CandidatePortalPage} />
      <Route path="/candidate-portal">
        <Redirect to="/candidate" />
      </Route>
      <Route path="/StressAnxiety" component={WhatWeDoPage} />
      <Route path="/SubService" component={SubServicePage} />
      <Route path="/GroundingTechniques" component={AnxietyArticlePage} />
      <Route path="/volunteer" component={Volunteer} />
      <Route path="/volunteerform" component={VolunteerFormPage} />

      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ModalContainer() {
  const { isModalOpen, closeModal, preSelectedService } = useAppointment();
  return (
    <AppointmentModal
      isOpen={isModalOpen}
      onClose={closeModal}
      preSelectedService={preSelectedService}
    />
  );
}

/* ---------------- App Root ---------------- */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CandidateAuthProvider>
          <AppointmentProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>

              <div className="page-wrapper">
              <ScrollToTop />
              <SharedNavbar />
              <Router />
              </div>

              <ModalContainer />

            </WouterRouter>

            <Toaster />
          </AppointmentProvider>
        </CandidateAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
