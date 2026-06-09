import React, { createContext, useContext, useState } from "react";

const AppointmentContext = createContext();

export function AppointmentProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedService, setPreSelectedService] = useState(null);

  const openModal = (serviceName = null) => {
    setPreSelectedService(serviceName || null);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setPreSelectedService(null);
  };

  return (
    <AppointmentContext.Provider value={{ isModalOpen, openModal, closeModal, preSelectedService }}>
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
