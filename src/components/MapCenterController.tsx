import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterControllerProps {
  center: [number, number];
  zoom: number;
}

/**
 * Component to dynamically update map center when it changes
 * Must be used inside MapContainer
 */
export function MapCenterController({ center, zoom }: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}
