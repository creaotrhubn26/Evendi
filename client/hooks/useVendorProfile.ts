import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/query-client";

export interface VendorCategoryProfile {
  id: string;
  name: string;
  slug?: string | null;
  dashboardKey?: string | null;
  sortOrder?: number | null;
  icon?: string | null;
  applicableEventTypes?: string[];
}

export interface VendorProfileResponse {
  googleReviewUrl?: string | null;
  category: VendorCategoryProfile | null;
}

export function useVendorProfile(sessionToken: string | null | undefined) {
  return useQuery<VendorProfileResponse>({
    queryKey: ["/api/vendor/profile", sessionToken],
    queryFn: async () => {
      if (!sessionToken) {
        return { googleReviewUrl: null, category: null };
      }
      const response = await fetch(new URL("/api/vendor/profile", getApiUrl()).toString(), {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (!response.ok) {
        return { googleReviewUrl: null, category: null };
      }
      return response.json();
    },
    enabled: !!sessionToken,
  });
}
