import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DonationSite } from "@/api";

// Fix bundler-broken default marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const TAIWAN_CENTER: [number, number] = [23.9, 120.95];
const DEFAULT_ZOOM = 8;
const SITE_ZOOM = 13;

interface Props {
  sites: DonationSite[];
}

export function SiteMap({ sites }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: TAIWAN_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers whenever sites change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const withCoords = sites.filter(
      (s) => s.latitude != null && s.longitude != null
    );

    withCoords.forEach((site) => {
      const popup = `
        <div style="min-width:160px">
          <p style="font-weight:700;color:#e11d48;margin:0 0 4px">${site.loca_name}</p>
          <p style="font-size:12px;color:#475569;margin:0">${site.address}</p>
          ${
            site.open_time || site.close_time
              ? `<p style="font-size:12px;color:#64748b;margin:4px 0 0">${(site.open_time ?? "").slice(0, 5)} – ${(site.close_time ?? "").slice(0, 5)}</p>`
              : ""
          }
          <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            site.address
          )}" target="_blank" rel="noopener noreferrer"
            style="font-size:12px;color:#0ea5e9;display:block;margin-top:6px">
            導航前往 →
          </a>
        </div>`;
      const marker = L.marker([site.latitude!, site.longitude!])
        .addTo(map)
        .bindPopup(popup);
      markersRef.current.push(marker);
    });

    if (withCoords.length === 0) {
      map.setView(TAIWAN_CENTER, DEFAULT_ZOOM);
    } else if (withCoords.length === 1) {
      map.setView([withCoords[0].latitude!, withCoords[0].longitude!], SITE_ZOOM);
    } else {
      const bounds = L.latLngBounds(
        withCoords.map((s) => [s.latitude!, s.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [sites]);

  return <div ref={containerRef} className="w-full h-full" />;
}
