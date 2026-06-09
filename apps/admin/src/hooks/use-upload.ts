import { useState } from "react";
import { apiUrl } from "@/lib/queryClient";

type UploadOptions = {
  onSuccess?: (response: { objectPath: string }) => void;
  onError?: (error: Error) => void;
};

export function useUpload(options: UploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const token =
        localStorage.getItem("wings_candidate_token") ||
        sessionStorage.getItem("wings_admin_token");

      const res = await fetch(apiUrl("/api/applications/upload"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        const error = new Error(errorText || res.statusText || "Upload failed");
        options.onError?.(error);
        throw error;
      }

      const data = await res.json();
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        options.onError?.(error);
      }
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
}
