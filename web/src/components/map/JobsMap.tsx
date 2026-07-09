import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom icons
const pickupIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


interface RouteMapPreviewProps {
  pickup: [number, number]; // [lat, lng]
  dropoff: [number, number]; // [lat, lng]
}

export function JobsMap({ pickup, dropoff }: RouteMapPreviewProps) {
  const center: [number, number] = [(pickup[0] + dropoff[0]) / 2, (pickup[1] + dropoff[1]) / 2];

  return (
    <MapContainer 
      center={center} 
      zoom={11} 
      style={{ height: '100%', width: '100%' }}
      dragging={false}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={pickup} icon={pickupIcon} />
      <Marker position={dropoff} icon={dropoffIcon} />
      <Polyline positions={[pickup, dropoff]} color="#264123" weight={3} dashArray="5, 5" />
    </MapContainer>
  );
}