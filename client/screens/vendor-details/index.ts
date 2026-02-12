// Vendor Details Screens - Category-specific detail screens for vendors
export { default as VenueDetailsScreen } from "./VenueDetailsScreen";
export { default as PhotographerDetailsScreen } from "./PhotographerDetailsScreen";
export { default as FloristDetailsScreen } from "./FloristDetailsScreen";
export { default as CateringDetailsScreen } from "./CateringDetailsScreen";
export { default as MusicDetailsScreen } from "./MusicDetailsScreen";
export { default as CakeDetailsScreen } from "./CakeDetailsScreen";
export { default as BeautyDetailsScreen } from "./BeautyDetailsScreen";
export { default as TransportDetailsScreen } from "./TransportDetailsScreen";
export { default as PlannerDetailsScreen } from "./PlannerDetailsScreen";
export { default as PhotoVideoDetailsScreen } from "./PhotoVideoDetailsScreen";
export { default as DressDetailsScreen } from "./DressDetailsScreen";

// Category mapping helper — backed by shared VENDOR_CATEGORIES registry
import { getVendorDetailsRoute } from "@shared/event-types";

export const getCategoryDetailsScreen = (category: string): string | null => {
  return getVendorDetailsRoute(category);
};
