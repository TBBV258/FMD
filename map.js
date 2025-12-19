// Simple map helper - opens coordinates in Google Maps in a new window/tab
(function () {
    window.mapHelper = {
        open(lat, lng) {
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                console.warn('Invalid coordinates');
                return;
            }
            const url = `https://www.google.com/maps?q=${lat},${lng}`;
            window.open(url, '_blank');
        },

        showCurrentLocation() {
            if (!navigator.geolocation) return alert('Geolocation not supported');
            navigator.geolocation.getCurrentPosition(pos => {
                window.mapHelper.open(pos.coords.latitude, pos.coords.longitude);
            }, err => {
                console.error('Geolocation error', err);
                alert('Unable to get location');
            });
        }
    };
    
    // Leaflet-based location picker
    let map = null;
    let marker = null;
    let activeContext = null; // 'lost' | 'found'

    // Ensure Leaflet assets are present. If missing, try to load them dynamically from CDN.
    function ensureLeafletLoaded(timeout = 8000) {
        return new Promise((resolve, reject) => {
            if (typeof L !== 'undefined') return resolve();

            // Add Leaflet CSS if not present
            const cssHref = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            if (![...document.styleSheets].some(s => s.href && s.href.includes('leaflet'))) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssHref;
                document.head.appendChild(link);
            }

            // Add Leaflet script if not present
            const scriptSrc = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            let existing = [...document.scripts].find(s => s.src && s.src.includes('leaflet'));
            if (!existing) {
                existing = document.createElement('script');
                existing.src = scriptSrc;
                existing.defer = false;
                document.head.appendChild(existing);
            }

            const start = Date.now();
            const check = () => {
                if (typeof L !== 'undefined') return resolve();
                if (Date.now() - start > timeout) return reject(new Error('Leaflet load timeout'));
                setTimeout(check, 150);
            };
            // If the script element emits an error, reject early
            existing.addEventListener && existing.addEventListener('error', () => reject(new Error('Failed to load Leaflet script')));
            check();
        });
    }

    // Simple reverse geocoder using OpenStreetMap Nominatim
    async function reverseGeocode(lat, lng) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt`;
            const res = await fetch(url, { headers: { 'User-Agent': 'FindMyDocument/1.0' } });
            const data = await res.json();
            const a = data.address || {};
            // Build human-readable address prioritizing road + house number + suburb/city
            const road = a.road || a.pedestrian || a.footway || a.cycleway || a.path || a.residential || a.neighbourhood || '';
            const number = a.house_number ? `, ${a.house_number}` : '';
            const suburb = a.suburb || a.village || a.town || a.city_district || '';
            const city = a.city || a.town || a.village || a.municipality || '';
            const state = a.state || '';
            const country = a.country || '';
            const parts = [
                `${road}${number}`.trim(),
                suburb,
                city,
                state,
                country
            ].filter(Boolean);
            const shortAddress = parts.join(', ');
            return shortAddress || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        } catch (e) {
            console.warn('Reverse geocode failed', e);
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    }

    function openLocationPicker(context) {
        activeContext = context;
        const modal = document.getElementById('location-picker-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        // Try to ensure Leaflet is available; if not, attempt to load it dynamically
        ensureLeafletLoaded().then(() => {
            setTimeout(() => {
                const mapEl = document.getElementById('leaflet-map');
                if (!mapEl) return;

                if (typeof L === 'undefined') {
                    console.error('Leaflet not available after dynamic load');
                    const body = modal.querySelector('.modal-body');
                    if (body) body.innerHTML = '<p class="text-center error">Mapa não pôde ser carregado. Verifique sua ligação.</p>';
                    return;
                }

                if (!map) {
                    map = L.map(mapEl).setView([-25.9692, 32.5732], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; OpenStreetMap'
                    }).addTo(map);

                    map.on('click', (e) => {
                        setMarker(e.latlng);
                    });
                } else {
                    map.invalidateSize();
                }

                // Try to center on current user location the first time
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        map.setView(latlng, 15);
                        setMarker(latlng);
                    });
                }
            }, 50);
        }).catch((err) => {
            console.warn('ensureLeafletLoaded failed', err);
            const body = modal.querySelector('.modal-body');
            if (body) body.innerHTML = '<p class="text-center error">Mapa não pôde ser carregado. Verifique sua ligação.</p>';
        });
    }

    // Inline mini-map initializers for lost/found sections
    function initInlineMap(mapContainerId, latInputId, lngInputId, addressInputId) {
        const container = document.getElementById(mapContainerId);
        if (!container) return null;

        if (typeof L === 'undefined') {
            // Attempt to load Leaflet and re-initialize once available
            ensureLeafletLoaded().then(() => {
                try {
                    // Try to initialize synchronously after load
                    initInlineMap(mapContainerId, latInputId, lngInputId, addressInputId);
                } catch (e) {
                    console.warn('Failed to init inline map after loading Leaflet', e);
                }
            }).catch(() => {
                // No op; return null for now
            });
            return null;
        }

        const mapInstance = L.map(container).setView([-25.9692, 32.5732], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(mapInstance);

        let m = null;
        const latInput = document.getElementById(latInputId);
        const lngInput = document.getElementById(lngInputId);
        const addrInput = addressInputId ? document.getElementById(addressInputId) : null;

        async function setLatLng(latlng) {
            if (!m) {
                m = L.marker(latlng, { draggable: true }).addTo(mapInstance);
                m.on('dragend', async () => {
                    const pos = m.getLatLng();
                    if (latInput) latInput.value = String(pos.lat);
                    if (lngInput) lngInput.value = String(pos.lng);
                    if (addrInput) addrInput.value = await reverseGeocode(pos.lat, pos.lng);
                });
            } else {
                m.setLatLng(latlng);
            }
            if (latInput) latInput.value = String(latlng.lat);
            if (lngInput) lngInput.value = String(latlng.lng);
            if (addrInput) addrInput.value = await reverseGeocode(latlng.lat, latlng.lng);
        }

        mapInstance.on('click', (e) => setLatLng(e.latlng));

        // Try current position
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                mapInstance.setView(ll, 15);
                setLatLng(ll);
            });
        }

        return { map: mapInstance, setLatLng };
    }

    async function setMarker(latlng) {
        if (!map) return;
        if (!marker) {
            marker = L.marker(latlng, { draggable: true }).addTo(map);
            marker.on('dragend', async () => {
                const pos = marker.getLatLng();
                const addr = await reverseGeocode(pos.lat, pos.lng);
                const addressInput = document.getElementById('location-picker-address');
                if (addressInput) addressInput.value = addr;
            });
        } else {
            marker.setLatLng(latlng);
        }
        // Pre-fill address field
        const addr = await reverseGeocode(latlng.lat, latlng.lng);
        const addressInput = document.getElementById('location-picker-address');
        if (addressInput) addressInput.value = addr;
    }

    function closeLocationPicker() {
        const modal = document.getElementById('location-picker-modal');
        if (modal) modal.style.display = 'none';
    }

    async function confirmLocationPick() {
        if (!marker || !activeContext) {
            closeLocationPicker();
            return;
        }
        const { lat, lng } = marker.getLatLng();
        const addressInput = document.getElementById('location-picker-address');
        let description = addressInput?.value || '';
        if (!description) {
            description = await reverseGeocode(lat, lng);
        }

        const namePrefix = activeContext === 'lost' ? 'lost' : 'found';
        const textInput = document.getElementById(`${namePrefix}-location`);
        const latInput = document.getElementById(`${namePrefix}-lat`);
        const lngInput = document.getElementById(`${namePrefix}-lng`);

        if (textInput) {
            textInput.value = description;
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (latInput) latInput.value = String(lat);
        if (lngInput) lngInput.value = String(lng);

        closeLocationPicker();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const openLostBtn = document.getElementById('pick-lost-location');
        const openFoundBtn = document.getElementById('pick-found-location');
        const closeBtn = document.getElementById('close-location-picker');
        const cancelBtn = document.getElementById('cancel-location-pick');
        const confirmBtn = document.getElementById('confirm-location-pick');
        const useCurrentBtn = document.getElementById('use-current-location');

        openLostBtn?.addEventListener('click', () => openLocationPicker('lost'));
        openFoundBtn?.addEventListener('click', () => openLocationPicker('found'));
        closeBtn?.addEventListener('click', closeLocationPicker);
        cancelBtn?.addEventListener('click', closeLocationPicker);
        confirmBtn?.addEventListener('click', confirmLocationPick);

        useCurrentBtn?.addEventListener('click', () => {
            if (!map || !navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
                const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                map.setView(latlng, 16);
                setMarker(latlng);
            });
        });

        // Initialize inline maps for lost and found sections
        const lostInline = initInlineMap('lost-map', 'lost-lat', 'lost-lng', 'lost-location');
        const foundInline = initInlineMap('found-map', 'found-lat', 'found-lng', 'found-location');

        // Hook up quick buttons to use current location and update inline maps
        const lostUseCurrent = document.getElementById('lost-use-current');
        const foundUseCurrent = document.getElementById('found-use-current');
        lostUseCurrent?.addEventListener('click', () => {
            if (!navigator.geolocation || !lostInline) return;
            navigator.geolocation.getCurrentPosition((pos) => {
                const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                lostInline.map.setView(ll, 16);
                lostInline.setLatLng(ll);
            });
        });
        foundUseCurrent?.addEventListener('click', () => {
            if (!navigator.geolocation || !foundInline) return;
            navigator.geolocation.getCurrentPosition((pos) => {
                const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                foundInline.map.setView(ll, 16);
                foundInline.setLatLng(ll);
            });
        });
    });

    // Expose for debugging if needed
    window.openLocationPicker = openLocationPicker;
})();