export type PlaceCategory = "catering.cafe" | "catering.restaurant" | "catering.pub";

export interface NormalisedPlace {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  distanceMeters: number;
  rating: number | null;
  openNow: boolean | null;
  website: string | null;
  phone: string | null;
}

export interface PlacesResponse {
  midpoint: { lat: number; lng: number };
  places: NormalisedPlace[];
}
