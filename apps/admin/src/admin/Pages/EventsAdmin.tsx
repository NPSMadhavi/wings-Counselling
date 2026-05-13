import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { api } from "../lib/api";
import type { Event } from "../lib/types";

// ✅ reusable easing tuple (fixes TS error cleanly)
const easeInOut: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeInOut,
    },
  },
};

/* -------------------- MODAL COMPONENT -------------------- */

function AddEventModal({ isOpen, onClose, onAddEvent, editingEvent, onUpdateEvent }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    price: "",
    registrationUrl: "",
    showDonationButton: false,
    isPublished: true,
    photoUrl: "",
    photoFile: null,
  });

  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* =========================
     EDIT EVENT DATA
  ========================= */

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title || "",
        description: editingEvent.description || "",
        eventDate: editingEvent.eventDate || "",
        location: editingEvent.location || "",
        price: editingEvent.price || "",
        registrationUrl:
          editingEvent.registrationUrl || "",

        showDonationButton:
          editingEvent.showDonationButton || false,

        isPublished:
          editingEvent.isPublished !== undefined
            ? editingEvent.isPublished
            : true,

        photoUrl:
          editingEvent.photoUrls?.[0] || "",

        photoFile: null,
      });

      if (editingEvent.photoUrls?.[0]) {
        setPreviewUrl(
          editingEvent.photoUrls[0]
        );
      }
    } else {
      setFormData({
        title: "",
        description: "",
        eventDate: "",
        location: "",
        price: "",
        registrationUrl: "",
        showDonationButton: false,
        isPublished: true,
        photoUrl: "",
        photoFile: null,
      });

      setPreviewUrl("");
    }
  }, [editingEvent]);

  /* =========================
     HANDLE CHANGE
  ========================= */

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* =========================
     FILE CHANGE
  ========================= */

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(
          "File size should be less than 5MB"
        );
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      const objectUrl =
        URL.createObjectURL(file);

      setPreviewUrl(objectUrl);

      setFormData((prev) => ({
        ...prev,
        photoFile: file,
        photoUrl: objectUrl,
      }));
    }
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      let photoUrl = formData.photoUrl;

      if (formData.photoFile) {
        const reader = new FileReader();

        const fileData =
          await new Promise((resolve) => {
            reader.onloadend = () =>
              resolve(reader.result);

            reader.readAsDataURL(
              formData.photoFile
            );
          });

        photoUrl = fileData;
      }

      const eventData = {
        id: editingEvent
          ? editingEvent.id
          : Date.now(),

        title: formData.title,

        description: formData.description,

        eventDate: formData.eventDate,

        location: formData.location,

        price: formData.price,

        registrationUrl:
          formData.registrationUrl,

        showDonationButton:
          formData.showDonationButton,

        isPublished:
          formData.isPublished,

        photoUrls:
          photoUrl ? [photoUrl] : [],

        createdAt: editingEvent
          ? editingEvent.createdAt
          : new Date().toISOString(),
      };

      if (editingEvent) {
        await onUpdateEvent(eventData);
      } else {
        await onAddEvent(eventData);
      }

      setFormData({
        title: "",
        description: "",
        eventDate: "",
        location: "",
        price: "",
        registrationUrl: "",
        showDonationButton: false,
        isPublished: true,
        photoUrl: "",
        photoFile: null,
      });

      setPreviewUrl("");

      onClose();
    } catch (error) {
      console.error(
        "Error saving event:",
        error
      );

      alert(
        "Failed to save event. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-blue-600">
                  {editingEvent ? "✏️ Edit Event" : "➕ Add New Event"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Fill in the details below</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >
              {/* TITLE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Event Title
                </label>

                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="Enter event title"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none"
                  placeholder="Describe your event"
                />
              </div>

              {/* GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* DATE */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* LOCATION */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="Venue or online link"
                  />
                </div>

                {/* PRICE */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Price
                  </label>

                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                    placeholder="$150"
                  />
                </div>
              </div>

              {/* REGISTRATION URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registration URL
                </label>

                <input
                  type="url"
                  name="registrationUrl"
                  value={formData.registrationUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  placeholder="https://example.com/register"
                />
              </div>

              {/* FILE UPLOAD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Event Photo
                </label>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer">
                    <div className="px-4 py-2.5 bg-blue-600 text-white rounded-lg">
                      Upload Image
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-sm text-gray-500">
                    {formData.photoFile
                      ? formData.photoFile.name
                      : "No file chosen"}
                  </span>
                </div>

                {previewUrl && (
                  <div className="mt-3">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              {/* DONATION */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  name="showDonationButton"
                  checked={formData.showDonationButton}
                  onChange={handleChange}
                  className="w-5 h-5"
                />

                <label className="text-sm font-medium text-gray-700">
                  Show Donation Button
                </label>
              </div>

              {/* PUBLISH */}
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="w-5 h-5"
                />

                <label className="text-sm font-medium text-gray-700">
                  Publish Event
                </label>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingEvent
                      ? "Update Event"
                      : "Save Event"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* -------------------- VIEW MODAL -------------------- */

function ViewEventModal({ isOpen, onClose, event }) {
  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-blue-600">Event Details</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {event.photoUrls?.[0] && (
                <img
                  src={event.photoUrls[0]}
                  alt={event.title}
                  className="w-full h-80 object-cover rounded-lg mb-6"
                />
              )}

              <h2 className="text-3xl font-bold text-gray-800 mb-4">{event.title}</h2>

              <div className="space-y-4 mb-8">
                <p className="text-gray-600 text-lg">{event.description}</p>

                {event.eventDate && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })} at {new Date(event.eventDate).toLocaleTimeString("en-SG", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.isPublished ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {event.isPublished ? '📢 Published' : '🔒 Draft'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                {event.registrationUrl && (
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Register Now
                  </a>
                )}
                {event.showDonationButton && (
                  <a
                    href="https://ramakrishna.org.sg/Authentication/Login?returnUrl=%2FDonation%2FDonateNow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-6 py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
                  >
                    Donate Now
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* -------------------- MAIN COMPONENT -------------------- */

export default function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // Load events from API and localStorage on mount
  useEffect(() => {
    const loadAllEvents = async () => {
      try {
        const data: Event[] = await api.getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllEvents();

    // Real-time updates via SSE
    const eventSource = new EventSource("http://localhost:5000/api/events/stream");

    eventSource.addEventListener("event_created", loadAllEvents);
    eventSource.addEventListener("event_updated", loadAllEvents);
    eventSource.addEventListener("event_deleted", loadAllEvents);

    return () => {
      eventSource.close();
    };
  }, []);

  const handleAddEvent = async (newEvent) => {
    try {
      await api.createEvent(newEvent);
      const data = await api.getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to add event:", error);
      alert("Failed to add event. Please check if the backend is running.");
    }
  };

  const handleUpdateEvent = async (updatedEvent) => {
    try {
      await api.updateEvent(updatedEvent.id, updatedEvent);
      const data = await api.getEvents();
      setEvents(data);
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("Failed to update event.");
    }
    setEditingEvent(null);
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await api.deleteEvent(eventId);
        setEvents(prev => prev.filter(e => e.id !== eventId));
      } catch (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to delete event.");
      }
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50">
        <div className="w-full px-6 py-8">
          {/* BACK BUTTON ON TOP LEFT */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium"> Back</span>
            </button>
          </div>

          {/* HEADER WITH ADD BUTTON ON RIGHT SIDE */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Events Management</h1>
            </div>
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              style={{ backgroundColor: '#2563eb' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-base">+ Add New Event</span>
            </button>
          </div>

          {/* TABLE VIEW */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden w-full"
          >

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Event Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {events.length > 0 ? (
                    events.map((event, index) => (
                      <motion.tr
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50 transition-all duration-200"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{event.title}</div>
                          {event.photoUrls?.[0] && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">🖼️ Has image</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm max-w-md">
                          {event.description?.substring(0, 100) || "—"}
                          {event.description?.length > 100 && "..."}
                        </td>
                        <td className="px-6 py-4">
                          {event.eventDate ? (
                            <div>
                              <div className="text-gray-700 text-sm font-medium">
                                {new Date(event.eventDate).toLocaleDateString("en-SG", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-gray-400 text-xs mt-1">
                                {new Date(event.eventDate).toLocaleTimeString("en-SG", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {event.location ? (
                            <div className="flex items-center gap-1 text-gray-600 text-sm">📍 {event.location}</div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsViewModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                              title="View Details"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => {
                                setEditingEvent(event);
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg text-sm font-medium transition-colors"
                              title="Edit Event"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                              title="Delete Event"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 text-lg">No events found</p>
                          <p className="text-gray-400 text-sm">Click "+ Add New Event" to create your first event!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ADD/EDIT EVENT MODAL */}
      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        editingEvent={editingEvent}
      />

      {/* VIEW EVENT MODAL */}
      <ViewEventModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        event={selectedEvent}
      />
    </>
  );
}