import { GET as getCustomerProfileResponse } from "@/app/api/profile/route";

export async function getProfileDashboardData() {
  try {
    const response = await getCustomerProfileResponse();
    if (!response.ok) return null;
    const data = await response.json();
    return data?.ok ? data : null;
  } catch (error) {
    console.error("getProfileDashboardData error", error);
    return null;
  }
}
