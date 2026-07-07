import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import SubServiceLayout from "./SubServiceLayout";
import { tabForMainTypeName } from "@/lib/serviceTabs";

const DEFAULT_IMAGE = "/assets/card2.jpg.jpeg";

export default function SubServiceDetailPage() {
  const [, params] = useRoute("/services/sub/:id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/counselling-types/sub/${params.id}`);
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || "Sub service not found");
        }
        if (!cancelled) setData(json.data);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err.message || "Failed to load service details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF5]">
        <div className="w-10 h-10 border-2 border-[#0D4A7A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF5] px-4 text-center">
        <p className="text-[#0D4A7A] text-lg font-medium mb-4">{error || "Service not found"}</p>
        <a href="/services" className="text-[#1B4585] underline">
          Back to Services
        </a>
      </div>
    );
  }

  const backHash = tabForMainTypeName(data.parent_type?.name);

  return (
    <SubServiceLayout
      serviceLabel={data.name}
      sectionTitle={data.heading || data.name}
      description={data.description || ""}
      therapyImage={data.image_url || DEFAULT_IMAGE}
      imageAlt={data.name}
      backHash={backHash}
      assignedTeamMembers={data.team_members || []}
      appointmentSelection={{
        counsellingTypeName: data.parent_type?.name,
        subTypeName: data.name,
      }}
    />
  );
}
