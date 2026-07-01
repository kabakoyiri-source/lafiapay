// ============================================================================
// LafiaPay — Interactive Merchant Map
// Dynamic Leaflet map loaded from CDN to show and locate merchants around Bamako
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, MapPin, Tag } from 'lucide-react';
import { mockStore } from '../../lib/mockData';
import { CATEGORY_INFO } from '../../types';
import type { Commercant, CommerceCategory } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function MerchantMapPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CommerceCategory | 'all'>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<Commercant | null>(null);

  // Sync Supabase data on mount
  useEffect(() => {
    mockStore.syncWithSupabase();
  }, []);

  // Dynamically load Leaflet CDN assets
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  // Filter merchants based on search and category
  const filteredMerchants = mockStore.commercants.filter(m => {
    const matchesSearch = m.nom_boutique.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.adresse || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || m.categorie === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Map initialization and updates
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return;

    // @ts-ignore
    const L = window.L;
    if (!L) return;

    // Initialize map centered at Bamako
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([12.6392, -8.0029], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Create custom pin icon
    const customIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div style="
          width: 28px; height: 28px; 
          background: var(--color-primary-600); 
          border-radius: 50% 50% 50% 0; 
          transform: rotate(-45deg); 
          border: 2px white solid;
          box-shadow: var(--shadow-md);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="transform: rotate(45deg); font-size: 11px; color: white;">🛒</div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    // Add new markers
    filteredMerchants.forEach(m => {
      const lat = m.latitude || 12.6392 + (Math.random() - 0.5) * 0.04;
      const lng = m.longitude || -8.0029 + (Math.random() - 0.5) * 0.04;

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedMerchant(m);
        map.setView([lat, lng], 14, { animate: true });
      });

      markersRef.current.push(marker);
    });

    // Fit map bounds if there are markers
    if (filteredMerchants.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.15));
    }

  }, [leafletLoaded, filteredMerchants]);

  const selectMerchantAndFly = (m: Commercant) => {
    setSelectedMerchant(m);
    if (mapRef.current) {
      // @ts-ignore
      const L = window.L;
      const lat = m.latitude || 12.6392;
      const lng = m.longitude || -8.0029;
      mapRef.current.setView([lat, lng], 15, { animate: true });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Search Header */}
      <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid var(--color-surface-100)', zIndex: 10 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass className="text-primary" size={22} />
          Trouver un Commerce
        </h1>

        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <Search size={18} style={{
            position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-surface-400)'
          }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.75rem', height: '40px' }}
            type="text"
            placeholder="Rechercher une boutique, une adresse..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', border: 'none',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: activeCategory === 'all' ? 'var(--color-primary-600)' : 'var(--color-surface-100)',
              color: activeCategory === 'all' ? 'white' : 'var(--color-surface-600)',
            }}
          >
            Tous
          </button>
          {(Object.keys(CATEGORY_INFO) as CommerceCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-full)', border: 'none',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                background: activeCategory === cat ? 'var(--color-primary-600)' : 'var(--color-surface-100)',
                color: activeCategory === cat ? 'white' : 'var(--color-surface-600)',
              }}
            >
              {CATEGORY_INFO[cat]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Dynamic loading splash */}
        {!leafletLoaded && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5,
            fontSize: '0.875rem', fontWeight: 600
          }}>
            Chargement de la carte...
          </div>
        )}

        {/* Selected merchant bottom card */}
        {selectedMerchant && (
          <div style={{
            position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
            background: 'white', borderRadius: 'var(--radius-2xl)', padding: '1rem',
            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-surface-100)',
            zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-100)', fontWeight: 600 }}>
                    {CATEGORY_INFO[selectedMerchant.categorie]?.label}
                  </span>
                  {selectedMerchant.est_agent && (
                    <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-success-100)', color: 'var(--color-success-700)', fontWeight: 600 }}>
                      Agent Agréé
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedMerchant.nom_boutique}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-500)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={12} />
                  {selectedMerchant.adresse || 'Bamako, Mali'}
                </p>
                {selectedMerchant.secteur_activite && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-surface-400)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                    <Tag size={12} />
                    Spécialité : {selectedMerchant.secteur_activite}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedMerchant(null)}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: 'var(--color-surface-400)', fontSize: '1.25rem', fontWeight: 600
                }}
              >
                &times;
              </button>
            </div>

            {profile?.role === 'client' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  // Navigate directly to pay screen and preset the manual code
                  navigate('/client/pay', { state: { presetQrCode: selectedMerchant.qr_code_id } });
                }}
                style={{ width: '100%', height: '38px', borderRadius: 'var(--radius-lg)' }}
              >
                Payer ce commerce
              </button>
            )}
          </div>
        )}
      </div>

      {/* Embedded results listing when drawer is active */}
      {filteredMerchants.length > 0 && !selectedMerchant && (
        <div style={{
          position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-xl)', padding: '0.5rem',
          boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-surface-100)',
          maxHeight: '130px', overflowY: 'auto', zIndex: 10
        }} className="no-scrollbar">
          {filteredMerchants.slice(0, 3).map(m => (
            <div
              key={m.id}
              onClick={() => selectMerchantAndFly(m)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              className="hover-bg"
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{m.nom_boutique}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-surface-500)' }}>{m.adresse || 'Bamako'}</div>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary-600)', fontWeight: 600 }}>Voir</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
