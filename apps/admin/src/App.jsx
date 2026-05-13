import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useLayoutEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/Pages/Home";
import TeamPage from "@/Pages/TeamPage";
import Careers from "@/Pages/Careers";
import AboutUs from "@/Pages/AboutUs";
import ServicePage from "@/Pages/ServicePage";
import EventsPage from "@/Pages/EventsPage";
import ArticlePage from "@/Pages/ArticlePage";
import CandidatePortalPage from "@/Pages/CandidatePortal";
import AdminApp from "@/admin/AdminApp";
import NotFound from "@/Pages/not-found";

import { CandidateAuthProvider } from "@/context/CandidateAuthContext";
import { AppointmentProvider, useAppointment } from "@/context/AppointmentContext";
import { Navbar } from "@/components/layout/Navbar";
import { AppointmentModal } from "@/components/modals/AppointmentModal";

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

  const hidden =
    location === "/candidate" ||
    location.startsWith("/admin");

  if (hidden) return null;

  return <Navbar />;
}

/* ---------------- React Query Client ---------------- */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

/* ---------------- Router ---------------- */
function Router() {
  return (
    <Switch>
      <Route path="/admin" component={AdminApp} />
      <Route path="/admin/:rest*" component={AdminApp} />

      <Route path="/" component={Home} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/services" component={ServicePage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/articles" component={ArticlePage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/careers" component={Careers} />
      <Route path="/candidate" component={CandidatePortalPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function ModalContainer() {
  const { isModalOpen, closeModal } = useAppointment();
  return <AppointmentModal isOpen={isModalOpen} onClose={closeModal} />;
}

/* ---------------- App Root ---------------- */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CandidateAuthProvider>
          <AppointmentProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>

              <ScrollToTop />
              <SharedNavbar />
              <Router />

              <ModalContainer />

            </WouterRouter>

            <Toaster />
          </AppointmentProvider>
        </CandidateAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}