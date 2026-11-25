import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Create custom SVG train locomotive icon
const trainIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36">
  <circle cx="16" cy="16" r="15" fill="#0284C7" stroke="#ffffff" stroke-width="2.5" />
  <path d="M16 6c-4 0-6.5.5-6.5 3.5V20c0 1.5 1.5 2.5 3 2.5l-1.5 1.5v.5h10v-.5l-1.5-1.5c1.5 0 3-1 3-2.5V9.5C22.5 6.5 20 6 16 6zm-3.5 13c-.8 0-1.5-.7-1.5-1.5S11.7 16 12.5 16s1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm7 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm1.5-5H11v-4h10v4z" fill="#ffffff" />
</svg>
`;

const stationIconSvg = (code) => `
<div style="background:#0F172A; color:#38BDF8; font-weight:700; font-size:10px; padding:2px 6px; border-radius:9999px; border:2px solid #ffffff; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2); white-space:nowrap; text-align:center;">
  ${code}
</div>
`;

const LiveMap = ({ 
  latitude, 
  longitude, 
  speed, 
  schedules = [], 
  trainNumber = '', 
  trainName = '',
  status = 'In Transit',
  height = '500px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trainMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const stationMarkersRef = useRef([]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = latitude || 25.5;
      const initialLng = longitude || 76.5;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 7,
        zoomControl: true,
      });

      // Standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline & Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing station markers
    stationMarkersRef.current.forEach(m => m.remove());
    stationMarkersRef.current = [];

    // Extract station coordinates from schedules if available
    const stationCoords = [
      { code: 'NDLS', name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
      { code: 'KOTA', name: 'Kota Junction', lat: 25.2238, lng: 75.8648 },
      { code: 'RTM', name: 'Ratlam Junction', lat: 23.3341, lng: 75.0376 },
      { code: 'BRC', name: 'Vadodara Junction', lat: 22.3106, lng: 73.1812 },
      { code: 'ST', name: 'Surat', lat: 21.2049, lng: 72.8406 },
      { code: 'BVI', name: 'Borivali', lat: 19.2294, lng: 72.8576 },
      { code: 'MMCT', name: 'Mumbai Central', lat: 18.9696, lng: 72.8194 },
      { code: 'GZB', name: 'Ghaziabad', lat: 28.6679, lng: 77.4377 },
      { code: 'CNB', name: 'Kanpur Central', lat: 26.4537, lng: 80.3507 },
      { code: 'LKO', name: 'Lucknow Charbagh', lat: 26.8315, lng: 80.9231 },
      { code: 'PRYJ', name: 'Prayagraj Junction', lat: 25.4526, lng: 81.8349 },
      { code: 'BSB', name: 'Varanasi Junction', lat: 25.3283, lng: 82.9868 },
      { code: 'HWH', name: 'Howrah Junction', lat: 22.5850, lng: 88.3426 },
      { code: 'BBS', name: 'Bhubaneswar', lat: 20.2668, lng: 85.8436 }
    ];

    const coordMap = {};
    stationCoords.forEach(st => { coordMap[st.code] = st; });

    const routePoints = [];

    if (Array.isArray(schedules) && schedules.length > 0) {
      schedules.forEach(stop => {
        const info = coordMap[stop.stationCode];
        if (info) {
          routePoints.push([info.lat, info.lng]);

          const stIcon = L.divIcon({
            html: stationIconSvg(stop.stationCode),
            className: 'custom-station-icon',
            iconSize: [40, 20],
            iconAnchor: [20, 10]
          });

          const marker = L.marker([info.lat, info.lng], { icon: stIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-size:12px; font-family:sans-serif;">
              <strong>${stop.stationName} (${stop.stationCode})</strong><br/>
              Platform: <b>#${stop.platformNumber || 1}</b><br/>
              Sch Arr: ${stop.scheduledArrival || '--'} | Dep: ${stop.scheduledDeparture || '--'}
            </div>
          `);
          stationMarkersRef.current.push(marker);
        }
      });
    }

    // Draw Route Polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    if (routePoints.length >= 2) {
      routePolylineRef.current = L.polyline(routePoints, {
        color: '#0284C7',
        weight: 4,
        opacity: 0.75,
        dashArray: '8, 8',
        smoothFactor: 1
      }).addTo(map);
    }
  }, [schedules]);

  // Update Train Locomotive Live Position Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || latitude === undefined || longitude === undefined) return;

    const trainIcon = L.divIcon({
      html: trainIconSvg,
      className: 'custom-train-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    if (!trainMarkerRef.current) {
      trainMarkerRef.current = L.marker([latitude, longitude], { icon: trainIcon }).addTo(map);
      trainMarkerRef.current.bindPopup(`
        <div style="font-family:sans-serif; min-width:140px;">
          <b style="color:#0284C7; font-size:13px;">${trainNumber} ${trainName}</b><br/>
          <span>Status: <b>${status}</b></span><br/>
          <span>Speed: <b>${speed || 0} km/h</b></span><br/>
          <span style="color:#64748B; font-size:10px;">Source: SIMULATED GPS</span>
        </div>
      `);
    } else {
      trainMarkerRef.current.setLatLng([latitude, longitude]);
      trainMarkerRef.current.setPopupContent(`
        <div style="font-family:sans-serif; min-width:140px;">
          <b style="color:#0284C7; font-size:13px;">${trainNumber} ${trainName}</b><br/>
          <span>Status: <b>${status}</b></span><br/>
          <span>Speed: <b>${speed || 0} km/h</b></span><br/>
          <span style="color:#64748B; font-size:10px;">Source: SIMULATED GPS</span>
        </div>
      `);
    }
  }, [latitude, longitude, speed, trainNumber, trainName, status]);

  const recenterTrain = () => {
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.setView([latitude, longitude], 8, { animate: true });
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Recenter & Telemetry HUD Overlay */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button
          onClick={recenterTrain}
          className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-md backdrop-blur border border-slate-700 transition-all flex items-center gap-1.5"
          title="Recenter on live locomotive position"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Recenter Train
        </button>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/90 text-white backdrop-blur px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1 text-slate-300">
            LAT: <b className="text-white">{latitude?.toFixed(4) || '--'}</b>
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            LNG: <b className="text-white">{longitude?.toFixed(4) || '--'}</b>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">STATUS:</span>
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold text-[11px] border border-sky-500/30">
              {status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 text-[11px]">SPEED:</span>
            <b className="text-emerald-400 text-sm">{speed || 0}</b>
            <span className="text-slate-400 text-[10px]">km/h</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
