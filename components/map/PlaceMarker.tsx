export function PlaceMarker({ index, active }: { index: number; active?: boolean }) {
  return <div className={`place-marker ${active ? "place-marker-active" : ""}`}>{index}</div>;
}
