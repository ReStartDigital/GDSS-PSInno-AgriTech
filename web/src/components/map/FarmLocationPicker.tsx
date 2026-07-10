import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons not loading with Leaflet in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export function FarmLocationPicker({ position, onChange }: { 
  position: { lat: number, lng: number } | null, 
  onChange: (pos: { lat: number, lng: number }) => void 
}) {
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  };

  return (
    <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer 
        center={position || [5.6037, -0.187]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {position && <Marker position={[position.lat, position.lng]} />}
        <MapEvents />
      </MapContainer>
    </div>
  );
}
