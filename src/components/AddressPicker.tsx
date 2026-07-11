import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icons broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export type DeliveryLocation = {
  address: string;
  lat: number;
  lng: number;
};

type AddressPickerProps = {
  value: DeliveryLocation | null;
  onChange: (value: DeliveryLocation) => void;
  disabled?: boolean;
};

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const DEFAULT_CENTER: L.LatLngExpression = [4.711, -74.0721]; // Bogotá
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'SmartInventoryFrontend/1.0',
};

async function searchAddress(query: string): Promise<NominatimResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '0');
  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!res.ok) return [];
  return (await res.json()) as NominatimResult[];
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function AddressPicker({ value, onChange, disabled = false }: AddressPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [query, setQuery] = useState(value?.address ?? '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: value ? [value.lat, value.lng] : DEFAULT_CENTER,
      zoom: value ? 16 : 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', async (e: L.LeafletMouseEvent) => {
      if (disabled) return;
      const { lat, lng } = e.latlng;
      setMarker(lat, lng);
      try {
        const address = await reverseGeocode(lat, lng);
        setQuery(address);
        onChange({ address, lat, lng });
      } catch {
        const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setQuery(address);
        onChange({ address, lat, lng });
      }
    });

    mapInstance.current = map;

    if (value) {
      setMarker(value.lat, value.lng);
    }

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!value || !mapInstance.current) return;
    setMarker(value.lat, value.lng);
    mapInstance.current.setView([value.lat, value.lng], 16);
    setQuery(value.address);
  }, [value?.lat, value?.lng, value?.address]);

  const setMarker = (lat: number, lng: number) => {
    const map = mapInstance.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: !disabled }).addTo(map);
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        try {
          const address = await reverseGeocode(pos.lat, pos.lng);
          setQuery(address);
          onChange({ address, lat: pos.lat, lng: pos.lng });
        } catch {
          const address = `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
          setQuery(address);
          onChange({ address, lat: pos.lat, lng: pos.lng });
        }
      });
      markerRef.current = marker;
    }
  };

  useEffect(() => {
    if (disabled || query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (value?.address && query.trim() === value.address.trim()) {
      setResults([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      setSearching(true);
      setGeoError(null);
      try {
        const found = await searchAddress(query.trim());
        setResults(found);
      } catch {
        setGeoError('No se pudo buscar la dirección. Intenta de nuevo.');
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => window.clearTimeout(handle);
  }, [query, disabled, value?.address]);

  const selectResult = (item: NominatimResult) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    setQuery(item.display_name);
    setResults([]);
    setMarker(lat, lng);
    mapInstance.current?.setView([lat, lng], 16);
    onChange({ address: item.display_name, lat, lng });
  };

  const useMyLocation = () => {
    if (disabled || !navigator.geolocation) {
      setGeoError('Tu navegador no permite geolocalización.');
      return;
    }
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMarker(lat, lng);
        mapInstance.current?.setView([lat, lng], 16);
        try {
          const address = await reverseGeocode(lat, lng);
          setQuery(address);
          onChange({ address, lat, lng });
        } catch {
          const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setQuery(address);
          onChange({ address, lat, lng });
        }
      },
      () => setGeoError('No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca tu dirección..."
          className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono disabled:opacity-50"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 uppercase">
            Buscando...
          </span>
        )}
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-[#16191b] border border-gray-700 text-xs">
            {results.map((item) => (
              <li key={`${item.lat}-${item.lon}-${item.display_name}`}>
                <button
                  type="button"
                  onClick={() => selectResult(item)}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:bg-[#00ece0]/10 hover:text-[#00ece0] transition-colors"
                >
                  {item.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500 font-mono">
          Haz clic en el mapa o arrastra el marcador
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={disabled}
          className="text-[10px] font-mono uppercase tracking-wider text-[#00ece0] hover:underline disabled:opacity-40"
        >
          Usar mi ubicación
        </button>
      </div>

      <div
        ref={mapRef}
        className="w-full h-56 border border-gray-700 bg-[#0d1117] z-0"
        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}
      />

      {geoError && (
        <div className="text-[10px] text-[#ff4655] bg-[#ff4655]/10 border border-[#ff4655]/30 px-2 py-1">
          {geoError}
        </div>
      )}

      {value?.address && (
        <p className="text-[10px] text-gray-400 font-mono break-words">
          Seleccionada: <span className="text-white">{value.address}</span>
        </p>
      )}
    </div>
  );
}

export default AddressPicker;