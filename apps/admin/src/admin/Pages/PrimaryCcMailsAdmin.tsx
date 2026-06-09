import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "../lib/api";

type Recipient = {
  id: number;
  email: string;
  type: "primary" | "cc";
  createdAt: string;
};

const PAGE_SIZE = 50;

export default function PrimaryCcMailsAdmin() {
  const [, navigate] = useLocation();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [newEmail, setNewEmail] = useState("");
  const [newType, setNewType] = useState<"primary" | "cc">("primary");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);


    const handleBack = () => {
    window.history.back();
  };
  const loadRecipients = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.getFormSubmissionEmails();
      // Transform the data to show unique recipients from primary and CC fields
      const primaryRecipients: Recipient[] = rows
        .filter(row => row.primaryMail?.trim())
        .flatMap(row => 
          row.primaryMail.split(",").map(email => ({
            id: `primary-${row.id}-${email.trim()}` as any,
            email: email.trim(),
            type: "primary" as const,
            createdAt: row.createdAt,
          }))
        );
      
      const ccRecipients: Recipient[] = rows
        .filter(row => row.ccMail?.trim())
        .flatMap(row =>
          row.ccMail.split(",").map(email => ({
            id: `cc-${row.id}-${email.trim()}` as any,
            email: email.trim(),
            type: "cc" as const,
            createdAt: row.createdAt,
          }))
        );
      
      // Combine and remove duplicates by email
      const allRecipients = [...primaryRecipients, ...ccRecipients];
      const uniqueRecipients = Array.from(
        new Map(allRecipients.map(r => [r.email, r])).values()
      );
      
      setRecipients(uniqueRecipients);
    } catch {
      toast.error("Failed to load recipients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipients();
  }, [loadRecipients]);

  const filtered = useMemo(() => {
    let list = recipients;
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => item.email.toLowerCase().includes(q));
  }, [recipients, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleAddRecipient = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!emailRegex.test(newEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (recipients.some(r => r.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      toast.error("This email already exists in the list.");
      return;
    }

    setAdding(true);
    try {
      // Store the recipient in localStorage or state for now
      const newRecipient: Recipient = {
        id: Date.now(),
        email: newEmail.trim(),
        type: newType,
        createdAt: new Date().toISOString(),
      };
      setRecipients(prev => [...prev, newRecipient]);
      toast.success(`${newType.toUpperCase()} recipient added successfully.`);
      setNewEmail("");
      setNewType("primary");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add recipient.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteRecipient = async (id: number, email: string) => {
    const confirmed = window.confirm(`Remove "${email}" from ${recipients.find(r => r.id === id)?.type.toUpperCase()} list?`);
    if (!confirmed) return;

    setDeleting(id);
    try {
      setRecipients(prev => prev.filter(r => r.id !== id));
      toast.success("Recipient removed successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove recipient.");
    } finally {
      setDeleting(null);
    }
  };

  const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

  const primaryCount = recipients.filter(r => r.type === "primary").length;
  const ccCount = recipients.filter(r => r.type === "cc").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-4 ">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                title="Go Back"
              >
                                <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="#0D4A7A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
              </button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-1">Manage Recipients</h1>
           
              </div>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Primary Recipients</p>
                <p className="text-3xl font-bold mt-2">{primaryCount}</p>
              </div>
              <Mail size={32} className="text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">CC Recipients</p>
                <p className="text-3xl font-bold mt-2">{ccCount}</p>
              </div>
              <Mail size={32} className="text-purple-200" />
            </div>
          </div>
        </div>

        {/* Add New Recipient Form - Horizontal Layout */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Recipient</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as "primary" | "cc")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                <option value="primary">Primary</option>
                <option value="cc">CC</option>
              </select>
            </div>
            <div>
             <button
  onClick={handleAddRecipient}
  className="inline-flex items-center gap-2 px-6 py-2 bg-[#0D4A7A]  text-white font-medium rounded-lg transition"
>
  {adding ? "Adding..." : "Add Recipient"}
</button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipients..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#eef2ff] ">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                    Email Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                    Added Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No recipients found
                    </td>
                  </tr>
                ) : (
                  paged.map((recipient) => (
                    <tr key={recipient.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{recipient.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            recipient.type === "primary"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                        {recipient.type === "cc"
  ? "CC"
  : recipient.type.charAt(0).toUpperCase() +
    recipient.type.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(recipient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteRecipient(recipient.id as number, recipient.email)}
                          disabled={deleting === recipient.id}
                          className="inline-flex text-center gap-1 px-3 py-1  rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {rangeStart} to {rangeEnd} of {filtered.length} recipients
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-600">
                  Page {safePage + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}