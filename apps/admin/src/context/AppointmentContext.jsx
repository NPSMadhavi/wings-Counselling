import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "wouter";

const AppointmentContext = createContext();
const APPOINTMENT_MODAL_HISTORY_KEY = "wingsAppointmentModal";

export function AppointmentProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);
  const [location] = useLocation();

  const isModalOpenRef = useRef(false);
  const historyPushedRef = useRef(false);
  const previousLocationRef = useRef(location);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  const closeModal = useCallback(() => {
    if (!isModalOpenRef.current) return;

    setIsModalOpen(false);
    setPreSelectedService(null);

    if (historyPushedRef.current) {
      historyPushedRef.current = false;
      window.history.back();
    }
  }, []);

  const openModal = useCallback((serviceName = null) => {
    setPreSelectedService(serviceName || null);

    if (!isModalOpenRef.current) {
      setIsModalOpen(true);
      window.history.pushState({ [APPOINTMENT_MODAL_HISTORY_KEY]: true }, "");
      historyPushedRef.current = true;
      return;
    }

    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!historyPushedRef.current && !isModalOpenRef.current) return;

      historyPushedRef.current = false;
      setIsModalOpen(false);
      setPreSelectedService(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (previousLocationRef.current === location) return;

    previousLocationRef.current = location;

    if (!isModalOpenRef.current) return;

    historyPushedRef.current = false;
    setIsModalOpen(false);
    setPreSelectedService(null);
  }, [location]);

  return (
    <AppointmentContext.Provider
      value={{ isModalOpen, openModal, closeModal, preSelectedService }}
    >
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointment() {
  const context = useContext(AppointmentContext);
  if (context === undefined) {
    throw new Error("useAppointment must be used within an AppointmentProvider");
  }
  return context;
}
