export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function truncateAddress(address: string, max = 72): string {
  if (address.length <= max) {
    return address;
  }

  return `${address.slice(0, max - 1)}...`;
}

export function titleCase(value: string): string {
  return value
    .replace(/[._-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
