import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE = "/api";
const PAGE_SIZE = 10;

const STATUS_OPTIONS = ["pending", "reviewing", "approved", "rejected"];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status) {
  const s = (status || "pending").toLowerCase();
  const colors = {
    pending: "bg-amber-50 text-amber-700",
    reviewing: "bg-blue-50 text-blue-700",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${colors[s] || colors.pending}`}>
      {s}
    </span>
  );
}

export default function VolunteerAdmin() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [editFormData, setEditFormData] = useState({});

  const handleBack = () => window.history.back();

  const fetchVolunteers = async () => {
    try {
      const response = await fetch(`${API_BASE}/volunteers`);
      const data = await response.json();
      setVolunteers(data.volunteers || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this volunteer record?")) return;
    try {
      const response = await fetch(`${API_BASE}/volunteers/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Delete failed");
        return;
      }
      alert("Volunteer record deleted successfully");
      fetchVolunteers();
    } catch {
      alert("Failed to delete volunteer record");
    }
  };

  const handleView = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setModalMode("view");
    setShowModal(true);
  };

  const handleEdit = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setEditFormData({
      name: volunteer.name || "",
      email: volunteer.email || "",
      phone_hp: volunteer.phone_hp || "",
      address: volunteer.address || "",
      skills_hobbies: volunteer.skills_hobbies || "",
      preferred_days: volunteer.preferred_days || "",
      time_from: volunteer.time_from || "",
      time_to: volunteer.time_to || "",
      commitment_duration: volunteer.commitment_duration || "",
      commitment_unit: volunteer.commitment_unit || "Months",
      status: volunteer.status || "pending",
      admin_notes: volunteer.admin_notes || "",
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`${API_BASE}/volunteers/${selectedVolunteer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Update failed");
        return;
      }
      alert("Volunteer updated successfully");
      setShowModal(false);
      fetchVolunteers();
    } catch {
      alert("Failed to update volunteer");
    }
  };

  const exportExcel = () => {
    const headers = [
      "Volunteer Name",
      "Email",
      "Phone Number",
      "Address",
      "Skills",
      "Availability",
      "Status",
      "Created Date",
    ];
    const rows = filteredVolunteers.map((item) => [
      `"${(item.name || "").replace(/"/g, '""')}"`,
      `"${(item.email || "").replace(/"/g, '""')}"`,
      `"${(item.phone_hp || "").replace(/"/g, '""')}"`,
      `"${(item.address || "").replace(/"/g, '""')}"`,
      `"${(item.skills_hobbies || "").replace(/"/g, '""')}"`,
      `"${(item.availability || "").replace(/"/g, '""')}"`,
      `"${(item.status || "").replace(/"/g, '""')}"`,
      `"${formatDate(item.created_at).replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `volunteers_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const filteredVolunteers = useMemo(
    () =>
      volunteers.filter(
        (item) =>
          item.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.email?.toLowerCase().includes(search.toLowerCase()) ||
          item.phone_hp?.toLowerCase().includes(search.toLowerCase()) ||
          item.address?.toLowerCase().includes(search.toLowerCase()) ||
          item.skills_hobbies?.toLowerCase().includes(search.toLowerCase()) ||
          item.status?.toLowerCase().includes(search.toLowerCase()) ||
          item.preferred_days?.toLowerCase().includes(search.toLowerCase())
      ),
    [volunteers, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredVolunteers.length / PAGE_SIZE));
  const paginatedVolunteers = filteredVolunteers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#0D4A7A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A]">Volunteers</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-full lg:w-[320px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search volunteers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[46px] bg-white border border-gray-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:border-[#004689]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="h-[46px] px-5 rounded-xl bg-[#004689] text-white flex items-center gap-2 font-semibold shadow-sm hover:opacity-95 transition-all"
            >
              Export
              <ChevronDown size={16} />
            </button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden z-50">
                  <button onClick={exportExcel} className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-100">
                    Excel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-[#eef2ff]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Volunteer Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Phone Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Skills</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Availability</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Created Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-500">Loading volunteers...</td>
                </tr>
              ) : paginatedVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">No volunteer submissions found</td>
                </tr>
              ) : (
                paginatedVolunteers.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-50 hover:bg-[#F8FAFC] transition-all ${index % 2 === 0 ? "bg-white" : "bg-[#FCFCFD]"}`}
                  >
                    <td className="px-6 py-5 text-sm text-gray-700 font-medium">{item.name}</td>
                    <td className="px-6 py-5 text-sm text-gray-700">{item.email}</td>
                    <td className="px-6 py-5 text-sm text-gray-700">{item.phone_hp}</td>
                    <td className="px-6 py-5 text-sm text-gray-700 max-w-[180px]"><div className="line-clamp-2">{item.address || "—"}</div></td>
                    <td className="px-6 py-5 text-sm text-gray-700 max-w-[160px]"><div className="line-clamp-2">{item.skills_hobbies || "—"}</div></td>
                    <td className="px-6 py-5 text-sm text-gray-700 max-w-[200px]"><div className="line-clamp-2">{item.availability || "—"}</div></td>
                    <td className="px-6 py-5">{statusBadge(item.status)}</td>
                    <td className="px-6 py-5 text-sm text-gray-700 whitespace-nowrap">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleView(item)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(item)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 transition-all" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredVolunteers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-[#FCFCFD]">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredVolunteers.length)} of {filteredVolunteers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0D4A7A] px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {modalMode === "view" ? "Volunteer Details" : "Edit Volunteer"}
                </h3>
                <p className="text-blue-100 text-sm mt-1">Volunteer application record</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalMode === "view" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ["Name", selectedVolunteer?.name],
                    ["Email", selectedVolunteer?.email],
                    ["Phone", selectedVolunteer?.phone_hp],
                    ["Address", selectedVolunteer?.address],
                    ["Skills", selectedVolunteer?.skills_hobbies],
                    ["Interest Areas", selectedVolunteer?.interest_areas],
                    ["Preferred Days", selectedVolunteer?.preferred_days],
                    ["Availability", selectedVolunteer?.availability],
                    ["Status", selectedVolunteer?.status],
                    ["Created", formatDate(selectedVolunteer?.created_at)],
                    ["Admin Notes", selectedVolunteer?.admin_notes],
                  ].map(([label, value]) => (
                    <div key={label} className={label === "Address" || label === "Admin Notes" ? "md:col-span-2" : ""}>
                      <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                      <p className="text-gray-900 font-medium mt-1 whitespace-pre-wrap">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ["name", "Name"],
                    ["email", "Email"],
                    ["phone_hp", "Phone"],
                    ["status", "Status", "select"],
                  ].map(([name, label, type]) =>
                    type === "select" ? (
                      <div key={name}>
                        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                        <select name={name} value={editFormData[name] || ""} onChange={handleEditChange} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl">
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div key={name}>
                        <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                        <input name={name} value={editFormData[name] || ""} onChange={handleEditChange} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl" />
                      </div>
                    )
                  )}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                    <textarea name="address" value={editFormData.address || ""} onChange={handleEditChange} rows={2} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Skills</label>
                    <textarea name="skills_hobbies" value={editFormData.skills_hobbies || ""} onChange={handleEditChange} rows={2} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl resize-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Admin Notes</label>
                    <textarea name="admin_notes" value={editFormData.admin_notes || ""} onChange={handleEditChange} rows={3} className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-xl resize-none" />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl border border-gray-200 font-semibold">Cancel</button>
                    <button onClick={handleUpdate} className="px-6 py-3 rounded-xl bg-[#004689] text-white font-semibold">Save Changes</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
