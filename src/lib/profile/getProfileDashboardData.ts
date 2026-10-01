import { GET as getCustomerProfileResponse } from "@/app/api/profile/route";
import { getCalendarDiscoveryData } from "./getCalendarDiscoveryData";

export async function getProfileDashboardData() {
  try {
    const response = await getCustomerProfileResponse();
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.ok) return null;
    const calendar = await getCalendarDiscoveryData();
    return { ...data, calendar };
  } catch (error) {
    console.error("getProfileDashboardData error", error);
    return null;
  }
}
