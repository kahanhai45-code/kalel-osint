import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 20, lng: 0 },
  initialZoom = 3,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialisation de la carte Leaflet
    const map = L.map(mapContainer.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });
    
    mapRef.current = map;

    // Couche Satellite (Esri) - Plus robuste
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
    }).addTo(map);

    // Couche de référence (Routes/Labels) - CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
      opacity: 0.8
    }).addTo(map);

    // Forcer le redimensionnement après un court délai
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className={className} 
      style={{ width: '100%', height: '100%', backgroundColor: '#050a14', position: 'absolute', inset: 0 }} 
    />
  );
}
