import React, { useEffect, useRef, useState } from 'react'

interface GoogleRouteMapProps {
  pickup: { lat: number; lng: number }
  dropoff: { lat: number; lng: number }
  status: string
}

declare global {
  interface Window {
    google: any
  }
}

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({ pickup, dropoff, status }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loadError, setLoadError] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey) {
      setLoadError(true)
      return
    }

    const scriptId = 'google-maps-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement

    const handleScriptLoad = () => {
      setScriptLoaded(true)
    }

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
      script.addEventListener('load', handleScriptLoad)
    } else {
      if (window.google && window.google.maps) {
        setScriptLoaded(true)
      } else {
        script.addEventListener('load', handleScriptLoad)
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', handleScriptLoad)
      }
    }
  }, [])

  useEffect(() => {
    if (!scriptLoaded || !mapRef.current) return

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: {
          lat: (pickup.lat + dropoff.lat) / 2,
          lng: (pickup.lng + dropoff.lng) / 2,
        },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: false,
      })

      // Add markers
      new window.google.maps.Marker({
        position: pickup,
        map,
        title: 'Pickup (Point A)',
        label: {
          text: 'A',
          color: '#ffffff',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#264123',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      new window.google.maps.Marker({
        position: dropoff,
        map,
        title: 'Dropoff (Point B)',
        label: {
          text: 'B',
          color: '#ffffff',
          fontWeight: 'bold',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#15803d',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })

      // Draw path
      new window.google.maps.Polyline({
        path: [pickup, dropoff],
        geodesic: true,
        strokeColor: status === 'in_transit' ? '#10b981' : '#264123',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      })

      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(pickup)
      bounds.extend(dropoff)
      map.fitBounds(bounds)
    } catch (err) {
      console.error('Error initializing map:', err)
      setLoadError(true)
    }
  }, [scriptLoaded, pickup, dropoff, status])

  if (loadError) {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: '#e5ebd9',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 16, textAlign: 'center', color: '#264123'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🗺️</div>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, margin: 0 }}>
          Google Map Mode
        </p>
        <p style={{ fontSize: '0.6rem', opacity: 0.7, margin: '2px 0 0 0', maxWidth: 180 }}>
          Configure VITE_GOOGLE_MAPS_API_KEY in .env to enable live tracking.
        </p>
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
}
