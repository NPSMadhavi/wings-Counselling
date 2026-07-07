import { useEffect, useState } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Pencil,
    Briefcase,
    X,
    Layers
} from "lucide-react";

import { toast } from "react-toastify";
import { api, resolveAssetUrl } from "../lib/api";

export default function CounsellingTypesPage() {

    const [types, setTypes] = useState([]);

    /* MAIN TYPE FORM STATE */
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editingSubId, setEditingSubId] = useState(null);

    const [search, setSearch] = useState("");

    /* MODAL STATES */
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add", "edit", "add_sub", "edit_sub"

    /* SUB COUNSELLING TYPE STATE */
    const [subName, setSubName] = useState("");
    const [subDescription, setSubDescription] = useState("");
    const [subHeading, setSubHeading] = useState("");
    const [subImageUrl, setSubImageUrl] = useState("");
    const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<number[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [teamLoading, setTeamLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [selectedMainTypeId, setSelectedMainTypeId] = useState("");

    const handleBack = () => {
  window.history.back();
};



    /* =====================================================
       FETCH TYPES
    ===================================================== */

    const fetchTypes = async () => {

        try {
            console.log("FETCHING COUNSELLING TYPES...");
            setFetchError("");

            const response = await fetch("/api/counselling-types");
            const data = await response.json();

            if (data.success) {
                setTypes(data.data || []);
            } else {
                setFetchError(data.message || "Failed to load counselling types");
            }

        } catch (error) {
            console.log("FETCH ERROR:", error);
            setFetchError("Unable to load counselling types right now.");
            toast.error("Failed to fetch data");
        }
    };



    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setTeamLoading(true);
            const rows = await api.getTeam();
            setTeamMembers(Array.isArray(rows) ? rows : []);
        } catch {
            toast.error("Failed to load team members");
            setTeamMembers([]);
        } finally {
            setTeamLoading(false);
        }
    };

    const resetSubForm = () => {
        setSubName("");
        setSubDescription("");
        setSubHeading("");
        setSubImageUrl("");
        setSelectedTeamMemberIds([]);
        setSelectedMainTypeId("");
        setEditingSubId(null);
    };

    const toggleTeamMember = (memberId: number) => {
        setSelectedTeamMemberIds((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleSubImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.warning("Please upload an image file");
            return;
        }

        try {
            setImageUploading(true);
            const { urls } = await api.uploadFiles([file]);
            setSubImageUrl(urls[0] || "");
            toast.success("Image uploaded");
        } catch (err: any) {
            toast.error(err?.message || "Image upload failed");
        } finally {
            setImageUploading(false);
            e.target.value = "";
        }
    };



    /* =====================================================
       SUBMIT MAIN TYPE
    ===================================================== */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.warning("Please enter counselling type");
            return;
        }

        try {
            setLoading(true);

            const payload = { name, description };
            let url = "/api/counselling-types/create";
            let method = "POST";

            if (editingId) {
                url = `/api/counselling-types/${editingId}`;
                method = "PUT";
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(editingId ? "Updated Successfully" : "Added Successfully");
                setName("");
                setDescription("");
                setEditingId(null);
                fetchTypes();
                setIsModalOpen(false);
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            console.log(error);
            toast.error("Server Error");
        } finally {
            setLoading(false);
        }
    };



    /* =====================================================
       SUBMIT SUB TYPE (CREATE & UPDATE)
    ===================================================== */

    const handleSubSubmit = async (e) => {
        e.preventDefault();

        if (!selectedMainTypeId) {
            toast.warning("Please select main counselling type");
            return;
        }

        if (!subName.trim()) {
            toast.warning("Please enter sub counselling type");
            return;
        }

        try {
            setLoading(true);

            let url = "/api/counselling-types/create";
            let method = "POST";
            let payload = {
                name: subName,
                description: subDescription,
                heading: subHeading,
                image_url: subImageUrl,
                team_member_ids: selectedTeamMemberIds,
                counselling_type_id: selectedMainTypeId
            };

            // If editing sub type
            if (editingSubId) {
                url = `/api/counselling-types/${editingSubId}?is_sub_type=true`;
                method = "PUT";
                payload = {
                    name: subName,
                    description: subDescription,
                    heading: subHeading,
                    image_url: subImageUrl,
                    team_member_ids: selectedTeamMemberIds,
                    counselling_type_id: selectedMainTypeId
                };
            }

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(editingSubId ? "Sub Type Updated Successfully" : "Sub counselling type added successfully");
                resetSubForm();
                fetchTypes();
                setIsModalOpen(false);
            } else {
                toast.error(data.message || "Something went wrong");
            }
        } catch (error) {
            console.log(error);
            toast.error("Server Error");
        } finally {
            setLoading(false);
        }
    };



    /* =====================================================
       OPEN MODALS
    ===================================================== */

    const openAddModal = () => {
        setModalMode("add");
        setEditingId(null);
        setName("");
        setDescription("");
        setIsModalOpen(true);
    };

    const openAddSubModal = () => {
        setModalMode("add_sub");
        resetSubForm();
        setIsModalOpen(true);
        fetchTeamMembers();
    };

    const handleEdit = (item) => {
        setModalMode("edit");
        setEditingId(item.id);
        setName(item.name);
        setDescription(item.description || "");
        setIsModalOpen(true);
    };

    const handleEditSub = (subItem, mainTypeId) => {
        setModalMode("edit_sub");
        setEditingSubId(subItem.id);
        setSubName(subItem.name);
        setSubDescription(subItem.description || "");
        setSubHeading(subItem.heading || "");
        setSubImageUrl(subItem.image_url || "");
        setSelectedTeamMemberIds(
            Array.isArray(subItem.team_member_ids)
                ? subItem.team_member_ids.map((id: any) => Number(id)).filter((id: number) => id > 0)
                : []
        );
        setSelectedMainTypeId(String(mainTypeId));
        setIsModalOpen(true);
        fetchTeamMembers();
    };



    /* =====================================================
       DELETE
    ===================================================== */

    const handleDelete = async (id: any) => {
        if (!window.confirm("Are you sure?")) return;

        try {
            const response = await fetch(
                typeof id === "string" && id.includes("?")
                    ? `/api/counselling-types/${id}`
                    : `/api/counselling-types/${id}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (response.ok) {
                toast.success("Deleted Successfully");
                fetchTypes();
            } else {
                toast.error(data.message || "Delete failed");
            }
        } catch (error) {
            console.log(error);
            toast.error("Server Error");
        }
    };



    /* =====================================================
       FILTER
    ===================================================== */

    const filteredData = types.filter(
        (item) => item?.name?.toLowerCase().includes(search.toLowerCase())
    );



    return (
        <div className="min-h-screen bg-[#f8fafc] p-6">

            {/* =====================================================
               HEADER WITH BUTTONS
            ===================================================== */}

            <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
             <div className="flex items-center gap-2">
  <button
    onClick={handleBack}
    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
  >
    <svg
      width="32"
      height="32"
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

  <h1 className="text-3xl md:text-4xl font-bold text-[#0D4A7A] mb-2">
   Services Types
  </h1>
</div>

                <div className="flex gap-3">
                    <button
                        onClick={openAddModal}
                        className="bg-[#0D4A7A] text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        {/* <Plus size={18} /> */}
                        Add Service
                    </button>
                    
                    <button
                        onClick={openAddSubModal}
                        className="bg-[#0D4A7A] text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        {/* <Layers size={18} /> */}
                        Add Sub Service
                    </button>
                </div>
            </div>

            {fetchError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {fetchError}
                </div>
            )}

            {/* =====================================================
               TABLE
            ===================================================== */}

            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#eef2ff]">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">ID</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Description</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center p-10 text-gray-400">
                                    No data found
                                </td>
                            </tr>
                        ) : (
                            filteredData.flatMap((item, index) => {
                                const mainRow = (
                                    <tr key={`main-${item.id}`} className="border-t bg-gray-50">
                                        <td className="p-4 font-bold">{index + 1}</td>
                                        <td className="p-4 font-bold text-[#0D4A7A]">{item.name}</td>
                                        <td className="p-4">{item.description || "-"}</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button 
                                                onClick={() => handleEdit(item)}
                                                className="transition-colors"
                                                title="Edit Main Type"
                                            >
                                                 <Pencil size="16" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className=" transition-colors"
                                                title="Delete Main Type"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );

                                const subRows = (item.sub_types || []).map((sub) => (
                                    <tr key={`sub-${sub.id}`} className="border-t hover:bg-gray-50">
                                        <td className="p-4"></td>
                                        <td className="p-4 pl-10 text-gray-700">
                                            <span className="inline-flex items-center gap-2">
                                                <span className="text-gray-400">↳</span>
                                                {sub.name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">{sub.description || "-"}</td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button 
                                                onClick={() => handleEditSub(sub, item.id)}
                                                className="  transition-colors"
                                                title="Edit Sub Type"
                                            >
                                                     <Pencil size="16" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(`${sub.id}?is_sub_type=true`)}
                                                className=" transition-colors"
                                                title="Delete Sub Type"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ));

                                return [mainRow, ...subRows];
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* =====================================================
               MODAL POPUP - UNIFIED
            ===================================================== */}

{isModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-[700px] max-w-[90vw] rounded-2xl shadow-xl animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#0D4A7A] px-8 py-6 rounded-t-2xl flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">
                        {modalMode === "add" && "Add Service Type"}
                        {modalMode === "edit" && "Edit Service Type"}
                        {modalMode === "add_sub" && "Add Sub Service Type"}
                        {modalMode === "edit_sub" && "Edit Sub Service Type"}
                    </h2>
                </div>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white transition-colors hover:text-gray-200"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Modal Body - Main Type Form */}
            {(modalMode === "add" || modalMode === "edit") && (
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Service Type *
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Service type"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-14 px-5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Description (Optional)
                            </label>
                            <textarea
                                placeholder="Enter description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-[250px] px-5 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                rows={5}
                            />
                        </div>
                    </div>
  <div className="flex justify-end gap-3 mt-8 pt-6 ">
            <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all duration-200"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#0D4A7A] text-white font-medium text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D4A7A]/90"
            >
                {loading ? "Saving..." : (modalMode === "add" ? "Save" : "Update")}
            </button>
        </div>
                </form>
            )}

            {/* Modal Body - Sub Type Form (Add & Edit) */}
            {(modalMode === "add_sub" || modalMode === "edit_sub") && (
                <form onSubmit={handleSubSubmit} className="p-8 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Main Service Type *
                            </label>
                            <select
                                value={selectedMainTypeId}
                                onChange={(e) => setSelectedMainTypeId(e.target.value)}
                                className="w-full h-14 px-5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D4A7A] focus:border-transparent bg-white"
                                required
                                disabled={modalMode === "edit_sub"}
                            >
                                <option value=""> Main Service Type</option>
                                {types.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {modalMode === "edit_sub" && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Main type cannot be changed while editing
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Sub Service Type  *
                            </label>
                            <input
                                type="text"
                                placeholder="Enter sub service type"
                                value={subName}
                                onChange={(e) => setSubName(e.target.value)}
                                className="w-full h-14 px-5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D4A7A] focus:border-transparent"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Heading
                            </label>
                            <input
                                type="text"
                                placeholder="Enter heading for detail page"
                                value={subHeading}
                                onChange={(e) => setSubHeading(e.target.value)}
                                className="w-full h-14 px-5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D4A7A] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Image
                            </label>
                            <div className="space-y-3">
                                {subImageUrl && (
                                    <img
                                        src={resolveAssetUrl(subImageUrl)}
                                        alt="Sub service preview"
                                        className="w-full max-h-48 object-cover rounded-xl border"
                                    />
                                )}
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="inline-flex items-center px-4 py-2.5 bg-[#0D4A7A] text-white rounded-lg cursor-pointer hover:bg-[#0D4A7A]/90 transition">
                                        {imageUploading ? "Uploading..." : "Upload Image"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleSubImageUpload}
                                            disabled={imageUploading}
                                        />
                                    </label>
                                    {subImageUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setSubImageUrl("")}
                                            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Or paste image URL"
                                    value={subImageUrl}
                                    onChange={(e) => setSubImageUrl(e.target.value)}
                                    className="w-full h-12 px-5 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D4A7A] focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Description (Optional)
                            </label>
                            <textarea
                                placeholder="Enter description"
                                value={subDescription}
                                onChange={(e) => setSubDescription(e.target.value)}
                                className="w-full h-[200px] px-5 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D4A7A] focus:border-transparent resize-y"
                                rows={4}
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-3">
                                Team Members
                            </label>
                            <div className="border rounded-xl max-h-48 overflow-y-auto p-3 space-y-2 bg-gray-50">
                                {teamLoading ? (
                                    <p className="text-sm text-gray-500 px-2 py-3">Loading team members...</p>
                                ) : teamMembers.length === 0 ? (
                                    <p className="text-sm text-gray-500 px-2 py-3">No team members found.</p>
                                ) : (
                                    teamMembers.map((member) => (
                                        <label
                                            key={member.id}
                                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedTeamMemberIds.includes(member.id)}
                                                onChange={() => toggleTeamMember(member.id)}
                                                className="w-4 h-4 accent-[#0D4A7A]"
                                            />
                                            <span className="text-sm text-gray-800">
                                                {member.name}
                                                {member.title ? ` — ${member.title}` : ""}
                                            </span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Select one or more team members for this sub-service.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-6 ">
            <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all duration-200"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#0D4A7A] text-white font-medium text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D4A7A]/90"
            >
                {loading ? "Saving..." : (modalMode === "add" ? "Save" : "Update")}
            </button>
        </div>
                </form>
            )}
        </div>
    </div>
)}

            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}