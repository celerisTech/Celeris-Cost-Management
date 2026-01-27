"use client";
import React, { useEffect, useRef, useCallback, useState } from 'react';

// Add this helper function at the top
const isBrowser = typeof window !== 'undefined';

// Fix for Leaflet default markers in Next.js
const createLeafletIcon = (L) => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Function to parse Google Maps links
const parseGoogleMapsLink = (url) => {
  try {
    // Clean the URL
    const cleanUrl = url.trim();

    // Pattern 1: maps.google.com with @coordinates
    const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const atMatch = cleanUrl.match(atPattern);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      return { lat, lng, type: 'at_coordinates' };
    }

    // Pattern 2: maps.google.com with ll= coordinates
    const llPattern = /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const llMatch = cleanUrl.match(llPattern);
    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);
      return { lat, lng, type: 'll_parameter' };
    }

    // Pattern 3: maps.app.goo.gl or goo.gl short links (would need to fetch first)
    if (cleanUrl.includes('goo.gl/maps') || cleanUrl.includes('maps.app.goo.gl')) {
      // These need to be expanded first
      return { type: 'short_link', url: cleanUrl };
    }

    // Pattern 4: place/ with place ID
    const placePattern = /\/place\/([^\/@?&]+)\/@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const placeMatch = cleanUrl.match(placePattern);
    if (placeMatch) {
      const placeName = placeMatch[1];
      const lat = parseFloat(placeMatch[2]);
      const lng = parseFloat(placeMatch[3]);
      return { lat, lng, placeName, type: 'place_with_coords' };
    }

    // Pattern 5: query parameter with coordinates
    const queryPattern = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const queryMatch = cleanUrl.match(queryPattern);
    if (queryMatch) {
      const lat = parseFloat(queryMatch[1]);
      const lng = parseFloat(queryMatch[2]);
      return { lat, lng, type: 'q_parameter' };
    }

    return null;
  } catch (error) {
    console.error('Error parsing Google Maps link:', error);
    return null;
  }
};

// Function to fetch detailed address from coordinates (reverse geocoding)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      const addressParts = [
        addr.house_number,
        addr.road || addr.street || addr.footway,
        addr.neighbourhood || addr.suburb,
        addr.city || addr.town || addr.village || addr.city_district,
        addr.county,
        addr.state,
        addr.postcode
      ].filter(Boolean);

      return addressParts.join(', ') || data.display_name;
    }
    return `Latitude: ${lat.toFixed(8)}, Longitude: ${lng.toFixed(8)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `Latitude: ${lat.toFixed(8)}, Longitude: ${lng.toFixed(8)}`;
  }
};

const MapPicker = ({ lat, lng, radius, onSelect }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [displayLat, setDisplayLat] = useState(null);
  const [displayLng, setDisplayLng] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapType, setMapType] = useState('satellite'); // 'street' or 'satellite'

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [foundAddress, setFoundAddress] = useState(null);

  // Input Mode State
  const [inputMode, setInputMode] = useState('address'); // 'address' or 'googleMaps'
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [isProcessingLink, setIsProcessingLink] = useState(false);

  // Validate and parse coordinates
  const parseCoordinate = useCallback((value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : null;
  }, []);

  // Process Google Maps link
  const handleGoogleMapsLink = async (e) => {
    e.preventDefault();
    if (!googleMapsLink.trim()) return;

    setIsProcessingLink(true);
    setSearchError(null);
    setFoundAddress(null);

    try {
      const parsed = parseGoogleMapsLink(googleMapsLink);

      if (!parsed) {
        setSearchError("Invalid Google Maps link format. Please paste a valid link.");
        return;
      }

      if (parsed.type === 'short_link') {
        // For short links, we need to expand them first
        setSearchError("Processing shortened link... Please use full Google Maps links with coordinates for best results.");
        return;
      }

      // Extract coordinates
      const { lat: newLat, lng: newLng } = parsed;

      // Get address from coordinates
      const address = await reverseGeocode(newLat, newLng);

      setDisplayLat(newLat);
      setDisplayLng(newLng);
      setFoundAddress(`📍 Google Maps Pin: ${address}`);

      // Update parent
      if (onSelect) {
        onSelect(newLat, newLng, `Google Maps: ${address}`);
      }

      // Update map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([newLat, newLng], 20); // Max zoom for exact pin

        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          markerRef.current.setPopupContent(`
            <div class="text-xs max-w-xs">
              <p class="font-bold mb-1 text-blue-600">📍 Google Maps Pin</p>
              <p class="mb-2 p-2 bg-blue-50 rounded" style="white-space: normal; word-wrap: break-word;">
                ${address}
              </p>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <strong>Latitude:</strong><br/>
                  <span class="font-mono">${newLat.toFixed(8)}</span>
                </div>
                <div>
                  <strong>Longitude:</strong><br/>
                  <span class="font-mono">${newLng.toFixed(8)}</span>
                </div>
              </div>
              <p class="mt-2 text-green-600">✓ Exact coordinates from Google Maps</p>
            </div>
          `);
          markerRef.current.openPopup();
        }

        if (circleRef.current) {
          circleRef.current.setLatLng([newLat, newLng]);
        }
      }
    } catch (error) {
      console.error('Error processing Google Maps link:', error);
      setSearchError("Failed to process Google Maps link. Please check the format.");
    } finally {
      setIsProcessingLink(false);
    }
  };

  // Handle address search
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setFoundAddress(null);

    try {
      // Enhanced search with additional parameters for exact building
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&countrycodes=in&polygon_geojson=1&namedetails=1&dedupe=1&extratags=1&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        // Filter and sort for best building-level results
        const resultsWithBuilding = data.filter(item => {
          const addr = item.address || {};
          return addr.house_number || addr.building || addr.amenity;
        });

        // Use building results if available, otherwise use all results
        const results = resultsWithBuilding.length > 0 ? resultsWithBuilding : data;

        // Sort by importance and building presence
        results.sort((a, b) => {
          const aScore = (a.address?.house_number ? 100 : 0) + (a.address?.building ? 50 : 0) + a.importance;
          const bScore = (b.address?.house_number ? 100 : 0) + (b.address?.building ? 50 : 0) + b.importance;
          return bScore - aScore;
        });

        const result = results[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        // Construct detailed address string
        const addr = result.address || {};
        let displayString = "";

        // Build address in hierarchical order with building focus
        const addressParts = [
          addr.house_number ? `House No. ${addr.house_number}` : null,
          addr.building ? `Building: ${addr.building}` : null,
          addr.road || addr.street || addr.footway,
          addr.neighbourhood || addr.suburb,
          addr.city || addr.town || addr.village || addr.city_district,
          addr.county,
          addr.state,
          addr.postcode
        ].filter(Boolean);

        displayString = addressParts.join(', ');

        // If no building details, indicate it's approximate
        if (!addr.house_number && !addr.building) {
          displayString += " (Approximate area location)";
        }

        setDisplayLat(newLat);
        setDisplayLng(newLng);
        setFoundAddress(displayString);

        // Update parent
        if (onSelect) {
          onSelect(newLat, newLng, displayString);
        }

        // Update map view with appropriate zoom
        if (mapInstanceRef.current) {
          let zoomLevel = 19; // Default high zoom

          if (addr.house_number || addr.building) {
            zoomLevel = 20; // Max zoom for building-level
          } else if (addr.road) {
            zoomLevel = 18; // Street level
          }

          mapInstanceRef.current.setView([newLat, newLng], zoomLevel);

          if (markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            markerRef.current.setPopupContent(`
              <div class="text-xs max-w-xs">
                <p class="font-bold mb-1 ${addr.house_number || addr.building ? 'text-green-600' : 'text-amber-600'}">
                  ${addr.house_number || addr.building ? '🏠 Exact Building Found' : '📍 Area Location'}
                </p>
                <p class="mb-2 p-2 ${addr.house_number || addr.building ? 'bg-green-50' : 'bg-amber-50'} rounded" 
                   style="white-space: normal; word-wrap: break-word;">
                  ${displayString}
                </p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong>Latitude:</strong><br/>
                    <span class="font-mono">${newLat.toFixed(8)}</span>
                  </div>
                  <div>
                    <strong>Longitude:</strong><br/>
                    <span class="font-mono">${newLng.toFixed(8)}</span>
                  </div>
                </div>
                ${addr.house_number ?
                '<p class="mt-2 text-green-600">✓ Building-level accuracy</p>' :
                '<p class="mt-2 text-amber-600">⚠️ Building not specified - approximate location</p>'}
              </div>
            `);
            markerRef.current.openPopup();
          }

          if (circleRef.current) {
            circleRef.current.setLatLng([newLat, newLng]);
          }
        }
      } else {
        setSearchError("Location not found. Try being more specific (include house number, street, city).");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Search service temporarily unavailable. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const initializeMap = useCallback(async () => {
    // Check if we're in browser and map container exists
    if (!isBrowser) {
      console.warn('Not in browser environment');
      return;
    }

    // Check if map container exists and is visible
    if (!mapContainerRef.current) {
      console.warn('Map container ref is not available yet');
      return;
    }

    // Check if map container is actually in DOM
    if (!document.body.contains(mapContainerRef.current)) {
      console.warn('Map container is not in DOM yet');
      return;
    }

    try {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      createLeafletIcon(L);

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Parse incoming coordinates with validation
      const parsedLat = parseCoordinate(lat);
      const parsedLng = parseCoordinate(lng);

      // Use provided coordinates or default
      const initialLat = parsedLat !== null ? parsedLat : 11.455799;
      const initialLng = parsedLng !== null ? parsedLng : 77.433868;
      const initialRadius = radius || 150;

      // Set display state
      setDisplayLat(initialLat);
      setDisplayLng(initialLng);

      // Create map instance
      const mapElement = mapContainerRef.current;
      
      // Double-check element exists and is visible
      if (!mapElement || mapElement.offsetParent === null) {
        console.warn('Map element is not visible');
        return;
      }

      mapInstanceRef.current = L.map(mapElement).setView([initialLat, initialLng], 15);

      // Add Tile Layers with enhanced satellite view

      // Street Map with OpenStreetMap
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      });

      // High-quality Satellite Imagery (Esri World Imagery)
      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 19,
      });

      // Enhanced labels overlay with better visibility (like Google Maps)
      // Using CartoDB Positron for better label contrast on satellite
      const labelLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap, © CartoDB',
        maxZoom: 19,
        opacity: 0.3, // Semi-transparent for satellite overlay
      });

      // Store layers
      mapRef.current = {
        osm: osmLayer,
        satellite: satelliteLayer,
        labels: labelLayer
      };

      // Add default layers based on map type
      if (mapType === 'satellite') {
        satelliteLayer.addTo(mapInstanceRef.current);
        // Add labels over satellite (roads & area names)
        labelLayer.addTo(mapInstanceRef.current);
      } else {
        osmLayer.addTo(mapInstanceRef.current);
      }

      // Create enhanced draggable marker
      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
        title: 'Drag to set exact location',
        icon: L.divIcon({
          html: `
            <div style="
              position: relative;
              width: 40px;
              height: 40px;
            ">
              <div style="
                position: absolute;
                width: 32px;
                height: 32px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                left: 4px;
                top: 4px;
              "></div>
              <div style="
                position: absolute;
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                left: 16px;
                top: 16px;
              "></div>
            </div>
          `,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })
      }).addTo(mapInstanceRef.current);

      // Add popup to marker
      markerRef.current.bindPopup(`
        <div class="text-xs">
          <p class="font-bold mb-1 text-blue-600">📍 Selected Location</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <strong>Latitude:</strong><br/>
              <span class="font-mono">${initialLat.toFixed(8)}</span>
            </div>
            <div>
              <strong>Longitude:</strong><br/>
              <span class="font-mono">${initialLng.toFixed(8)}</span>
            </div>
          </div>
        </div>
      `);

      // Create circle for radius visualization
      circleRef.current = L.circle([initialLat, initialLng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        radius: initialRadius,
        dashArray: '5, 5'
      }).addTo(mapInstanceRef.current);

      // Marker drag end event
      markerRef.current.on('dragend', function (event) {
        const marker = event.target;
        const position = marker.getLatLng();

        // Update display state
        setDisplayLat(position.lat);
        setDisplayLng(position.lng);
        setFoundAddress(null);

        // Call the parent callback
        if (onSelect) {
          onSelect(position.lat, position.lng);
        }

        // Update circle position
        if (circleRef.current) {
          circleRef.current.setLatLng([position.lat, position.lng]);
        }

        // Update marker popup
        marker.setPopupContent(`
          <div class="text-xs">
            <p class="font-bold mb-1 text-blue-600">📍 Manually Placed</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <strong>Latitude:</strong><br/>
                <span class="font-mono">${position.lat.toFixed(8)}</span>
              </div>
              <div>
                <strong>Longitude:</strong><br/>
                <span class="font-mono">${position.lng.toFixed(8)}</span>
              </div>
            </div>
          </div>
        `);
      });

      // Map click event
      mapInstanceRef.current.on('click', function (event) {
        const { lat: clickLat, lng: clickLng } = event.latlng;

        // Update display state
        setDisplayLat(clickLat);
        setDisplayLng(clickLng);
        setFoundAddress(null);

        // Call the parent callback
        if (onSelect) {
          onSelect(clickLat, clickLng);
        }

        // Update marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
          markerRef.current.setPopupContent(`
            <div class="text-xs">
              <p class="font-bold mb-1 text-blue-600">📍 Clicked Location</p>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <strong>Latitude:</strong><br/>
                  <span class="font-mono">${clickLat.toFixed(8)}</span>
                </div>
                <div>
                  <strong>Longitude:</strong><br/>
                  <span class="font-mono">${clickLng.toFixed(8)}</span>
                </div>
              </div>
            </div>
          `);
        }

        // Update circle position
        if (circleRef.current) {
          circleRef.current.setLatLng([clickLat, clickLng]);
        }
      });

      setIsMapReady(true);
      setMapError(null);

      // Force a small delay and then invalidate map size
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
    }
  }, [lat, lng, radius, onSelect, parseCoordinate, mapType]);

  // Handle Layer Toggle
  const toggleMapType = (type) => {
    setMapType(type);
    if (mapInstanceRef.current && mapRef.current) {
      if (type === 'satellite') {
        // Switch to satellite with enhanced labels
        mapInstanceRef.current.removeLayer(mapRef.current.osm);
        mapInstanceRef.current.addLayer(mapRef.current.satellite);
        mapRef.current.labels.setOpacity(0.3);
        mapInstanceRef.current.addLayer(mapRef.current.labels);
      } else {
        // Switch to street map
        mapInstanceRef.current.removeLayer(mapRef.current.satellite);
        mapInstanceRef.current.removeLayer(mapRef.current.labels);
        mapInstanceRef.current.addLayer(mapRef.current.osm);
      }
    }
  };

  // Update map when props change
  useEffect(() => {
    if (isMapReady && mapInstanceRef.current && markerRef.current && circleRef.current) {
      const parsedLat = parseCoordinate(lat);
      const parsedLng = parseCoordinate(lng);

      const currentLat = parsedLat !== null ? parsedLat : 11.455799;
      const currentLng = parsedLng !== null ? parsedLng : 77.433868;
      const currentRadius = radius || 150;

      // Get current marker position
      const markerLatLng = markerRef.current.getLatLng();

      // Check if position has changed significantly
      const latChanged = Math.abs(markerLatLng.lat - currentLat) > 0.0001;
      const lngChanged = Math.abs(markerLatLng.lng - currentLng) > 0.0001;

      if (latChanged || lngChanged) {
        // Update marker position
        markerRef.current.setLatLng([currentLat, currentLng]);

        // Update marker popup
        markerRef.current.setPopupContent(`
          <div class="text-xs">
            <p class="font-bold mb-1 text-blue-600">📍 Selected Location</p>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <strong>Latitude:</strong><br/>
                <span class="font-mono">${currentLat.toFixed(8)}</span>
              </div>
              <div>
                <strong>Longitude:</strong><br/>
                <span class="font-mono">${currentLng.toFixed(8)}</span>
              </div>
            </div>
          </div>
        `);

        // Update circle position and radius
        circleRef.current.setLatLng([currentLat, currentLng]);
        circleRef.current.setRadius(currentRadius);

        // Update map view
        mapInstanceRef.current.setView([currentLat, currentLng], 15);

        // Update display state
        setDisplayLat(currentLat);
        setDisplayLng(currentLng);
      }
    }
  }, [lat, lng, radius, isMapReady, parseCoordinate]);

  // Initialize map on mount with more robust timing
  useEffect(() => {
    if (!isBrowser) return;

    // Use a timeout to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  // Re-initialize map when container becomes visible (for tabs, modals, etc.)
  useEffect(() => {
    if (!isBrowser || !mapContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isMapReady) {
            // Container is now visible, initialize map
            setTimeout(() => {
              initializeMap();
            }, 300);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      if (mapContainerRef.current) {
        observer.unobserve(mapContainerRef.current);
      }
    };
  }, [isMapReady, initializeMap]);

  return (
    <div className="w-full space-y-4">
      {/* Input Mode Toggle */}
      <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setInputMode('address')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${inputMode === 'address'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            📍 Type Full Address
          </button>
          <button
            type="button"
            onClick={() => setInputMode('googleMaps')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${inputMode === 'googleMaps'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            🔗 Paste Google Maps Link
          </button>
        </div>

        {/* Address Search Mode */}
        {inputMode === 'address' ? (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 Search for Exact Building/Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Example: 123 Main Street, Chennai, Tamil Nadu 600001"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch(e)}
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Building
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>💡 <strong>For exact building:</strong> Include house number, building name, street, and city</p>
            </div>
          </>
        ) : (
          <>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔗 Paste Google Maps Link for Exact Pin
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
                placeholder="Example: https://maps.google.com/?q=13.0827,80.2707 or https://maps.app.goo.gl/..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleGoogleMapsLink(e)}
              />
              <button
                type="button"
                onClick={handleGoogleMapsLink}
                disabled={isProcessingLink}
                className="px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isProcessingLink ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Extract Pin
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <p>💡 <strong>Supported formats:</strong> maps.google.com links with @coordinates, place URLs, or short links</p>
            </div>
          </>
        )}

        {/* Search Results */}
        {foundAddress && (
          <div className={`mt-3 p-3 rounded-md border ${inputMode === 'googleMaps' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
            }`}>
            <div className="flex items-start gap-2">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${inputMode === 'googleMaps' ? 'text-green-600' : 'text-blue-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`font-semibold ${inputMode === 'googleMaps' ? 'text-green-800' : 'text-blue-800'}`}>
                  {inputMode === 'googleMaps' ? '📍 Google Maps Pin Extracted' : '🏠 Exact Location Found'}
                </p>
                <p className={`mt-1 ${inputMode === 'googleMaps' ? 'text-green-700' : 'text-blue-700'}`}>
                  {foundAddress}
                </p>
                {inputMode === 'address' && foundAddress.includes("House") && (
                  <p className="text-green-600 text-xs mt-1">✓ Building-level accuracy achieved</p>
                )}
              </div>
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{searchError}</p>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full rounded-lg border border-gray-300 bg-gray-100 shadow-sm hover:shadow-md transition-shadow relative z-0"
          style={{ minHeight: '256px', height: '450px' }}
        />

        {/* Enhanced Layer Toggle Control */}
        <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-300 flex overflow-hidden">
          <button
            type="button"
            onClick={() => toggleMapType('satellite')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 9l9 5m-9-5V7m9 5l4.553 2.276A1 1 0 0122 16.382V5.618a1 1 0 00-.553-.894L13 7m0 9V7" />
            </svg>
            Satellite + Labels
          </button>
          <button
            type="button"
            onClick={() => toggleMapType('street')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${mapType === 'street' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 9l9 5m-9-5V7m9 5l4.553 2.276A1 1 0 0122 16.382V5.618a1 1 0 00-.553-.894L13 7m0 9V7" />
            </svg>
            Street View
          </button>
        </div>

        {/* Map Type Indicator */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-300 px-3 py-1">
          <span className="text-xs font-medium text-gray-700">
            {mapType === 'satellite' ? '🛰️ Satellite with Road & Area Names' : '🗺️ Street Map'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {mapError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.908 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium text-red-800">⚠️ Map Error</p>
              <p className="text-red-700 text-sm">{mapError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600">🔗</span>
            </div>
            <h4 className="font-semibold text-blue-800">Google Maps Link</h4>
          </div>
          <p className="text-sm text-blue-700">Paste any Google Maps link to extract exact pin coordinates</p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600">🏠</span>
            </div>
            <h4 className="font-semibold text-green-800">Exact Building Search</h4>
          </div>
          <p className="text-sm text-green-700">Type full address with house number for building-level accuracy</p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600">🛰️</span>
            </div>
            <h4 className="font-semibold text-purple-800">Satellite + Labels</h4>
          </div>
          <p className="text-sm text-purple-700">Toggle to see satellite imagery with road and area names overlay</p>
        </div>
      </div>

      {/* Enhanced Coordinates Display */}
      <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📍 Selected Coordinates</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${displayLat && displayLng ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className={`text-xs font-medium ${displayLat && displayLng ? 'text-green-600' : 'text-gray-500'}`}>
              {displayLat && displayLng ? 'Coordinates Set' : 'Awaiting Input'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Latitude</label>
            <div className={`p-4 rounded-lg border-2 font-mono text-lg font-bold text-center ${displayLat !== null ? 'bg-blue-50 border-blue-400 text-blue-900' : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}>
              {displayLat !== null ? parseFloat(displayLat).toFixed(8) : '--.--------'}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Longitude</label>
            <div className={`p-4 rounded-lg border-2 font-mono text-lg font-bold text-center ${displayLng !== null ? 'bg-blue-50 border-blue-400 text-blue-900' : 'bg-gray-50 border-gray-300 text-gray-500'
              }`}>
              {displayLng !== null ? parseFloat(displayLng).toFixed(8) : '--.--------'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;