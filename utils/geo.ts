export interface Coordinate {
  lat: number;
  lng: number;
}

export function calculateMidpoint(locations: Coordinate[]): Coordinate {
  if (locations.length === 0) {
    throw new Error("No locations provided");
  }

  if (locations.length === 1) {
    return locations[0];
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const { lat, lng } of locations) {
    const latRad = toRadians(lat);
    const lngRad = toRadians(lng);

    x += Math.cos(latRad) * Math.cos(lngRad);
    y += Math.cos(latRad) * Math.sin(lngRad);
    z += Math.sin(latRad);
  }

  x /= locations.length;
  y /= locations.length;
  z /= locations.length;

  const lngRad = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, hyp);

  return {
    lat: toDegrees(latRad),
    lng: toDegrees(lngRad)
  };
}

export function haversineDistance(a: Coordinate, b: Coordinate): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const latA = toRadians(a.lat);
  const latB = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(latA) * Math.cos(latB) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}
