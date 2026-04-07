import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { Incident, SafetyZone, Attraction, Hotel, EmergencyService, WeatherInfo } from '../../types';
import { Shield, AlertTriangle, MapPin, Navigation, Info, Layers, X, Crosshair, Search, Loader2, Thermometer, Users, Calendar, Star, DollarSign, Heart, Phone, Building2, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";

const GOOGLE_MAPS_API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

export default function SafetyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const userMarker = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyService[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [safetyInsight, setSafetyInsight] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const currentSafetyScore = React.useMemo(() => {
    let score = 100;
    // Reduce score based on nearby incidents
    incidents.forEach(incident => {
      score -= incident.severity === 'critical' ? 15 : incident.severity === 'high' ? 10 : 5;
    });
    // Reduce score based on caution/restricted zones
    zones.forEach(zone => {
      if (zone.type === 'restricted') score -= 20;
      if (zone.type === 'caution') score -= 10;
    });
    return Math.max(0, score);
  }, [incidents, zones]);

  useEffect(() => {
    // Global handler for Google Maps authentication failures
    (window as any).gm_authFailure = () => {
      setApiError('ApiProjectMapError');
    };

    if (!mapRef.current || googleMap.current || !GOOGLE_MAPS_API_KEY) return;

    (setOptions as any)({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
    });

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('visualization')
    ]).then(([mapsLib, _markerLib, vizLib]) => {
      const { Map } = mapsLib as google.maps.MapsLibrary;
      const { HeatmapLayer } = vizLib as google.maps.VisualizationLibrary;
      if (!mapRef.current) return;
      
      googleMap.current = new Map(mapRef.current, {
        center: { lat: 1.290270, lng: 103.851959 }, // Default Singapore
        zoom: 13,
        styles: darkMapStyle,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // Initialize Heatmap
      heatmapRef.current = new HeatmapLayer({
        data: [],
        map: googleMap.current,
        radius: 30,
        opacity: 0.6,
      });

      setMapLoaded(true);

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          googleMap.current?.setCenter({ lat: latitude, lng: longitude });
          googleMap.current?.setZoom(14);
        });

        navigator.geolocation.watchPosition((position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          if (userMarker.current) {
            userMarker.current.setPosition({ lat: latitude, lng: longitude });
          } else {
            userMarker.current = new google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: googleMap.current,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              title: "Your Location"
            });
          }
        }, (err) => console.error("Geolocation error", err), {
          enableHighAccuracy: true
        });
      }
    });

    const unsubIncidents = onSnapshot(collection(db, 'incidents'), (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'incidents'));

    const unsubZones = onSnapshot(collection(db, 'safety_zones'), (snapshot) => {
      setZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SafetyZone)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'safety_zones'));

    const unsubAttractions = onSnapshot(collection(db, 'attractions'), (snapshot) => {
      setAttractions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attraction)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attractions'));

    const unsubHotels = onSnapshot(collection(db, 'hotels'), (snapshot) => {
      setHotels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hotel)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'hotels'));

    const unsubEmergencies = onSnapshot(collection(db, 'emergency_services'), (snapshot) => {
      setEmergencies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyService)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'emergency_services'));

    return () => {
      unsubIncidents();
      unsubZones();
      unsubAttractions();
      unsubHotels();
      unsubEmergencies();
    };
  }, []);

  const locateUser = () => {
    if (userLocation && googleMap.current) {
      googleMap.current.panTo({ lat: userLocation[0], lng: userLocation[1] });
      googleMap.current.setZoom(16);
    }
  };

  const handleScan = async () => {
    if (!userLocation) return;
    setIsScanning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      
      const prompt = `Act as a Smart Travel Map AI. Analyze the area around coordinates ${userLocation[0]}, ${userLocation[1]}.
      
      1. Discover 3-5 Hotels based on: safety score of area, distance, emergency access, and verified status.
      2. Discover 3-5 Tourist Attractions based on: safety rating, popularity, and current weather suitability.
      3. Identify 3 Emergency Services (Hospital, Police, Embassy) nearby.
      4. Provide a brief Safety Insight about the current route/area.
      5. Provide current Weather Info.

      Return ONLY a JSON object with this structure:
      {
        "hotels": [{
          "name": string,
          "priceRange": "$" | "$$" | "$$$" | "$$$$",
          "safetyRating": number (1-5),
          "rating": number (1-5),
          "amenities": string[],
          "description": string,
          "location": { "lat": number, "lng": number },
          "distance": string,
          "navigationTip": string,
          "whyRecommended": string,
          "accessibilityToEmergency": string,
          "suitability": ["solo" | "family" | "group"]
        }],
        "attractions": [{
          "name": string,
          "category": "adventure" | "spiritual" | "historical" | "entertainment" | "shopping" | "nature" | "culture" | "landmark",
          "safetyScore": number (0-100),
          "description": string,
          "location": { "lat": number, "lng": number },
          "bestTimeToVisit": string,
          "whyVisit": string,
          "travelTip": string,
          "popularityScore": number,
          "crowdDensity": "low" | "medium" | "high"
        }],
        "emergencies": [{
          "name": string,
          "type": "hospital" | "police" | "embassy",
          "location": { "lat": number, "lng": number },
          "description": string,
          "contact": string
        }],
        "safetyInsight": string,
        "weather": {
          "condition": string,
          "temp": number,
          "humidity": number,
          "windSpeed": number,
          "safetyAlert": string (optional)
        }
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      setSafetyInsight(data.safetyInsight);
      setWeather(data.weather);

      // Save discovered items to Firestore
      if (data.attractions) {
        for (const attraction of data.attractions) {
          try {
            await addDoc(collection(db, 'attractions'), attraction);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'attractions');
          }
        }
      }
      if (data.hotels) {
        for (const hotel of data.hotels) {
          try {
            await addDoc(collection(db, 'hotels'), hotel);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'hotels');
          }
        }
      }
      if (data.emergencies) {
        for (const emergency of data.emergencies) {
          try {
            await addDoc(collection(db, 'emergency_services'), emergency);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'emergency_services');
          }
        }
      }
    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (!googleMap.current || !mapLoaded) return;

    // Clear existing markers and circles
    markersRef.current.forEach(m => m.setMap(null));
    circlesRef.current.forEach(c => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // Render Zones
    zones.forEach(zone => {
      const color = zone.type === 'safe' ? '#22c55e' : zone.type === 'caution' ? '#eab308' : '#ef4444';
      const circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 0.1,
        map: googleMap.current,
        center: { lat: zone.geometry.center.lat, lng: zone.geometry.center.lng },
        radius: zone.geometry.radius,
      });
      circlesRef.current.push(circle);
    });

    // Render Incidents
    incidents.forEach(incident => {
      const marker = new google.maps.Marker({
        position: { lat: incident.location.lat, lng: incident.location.lng },
        map: googleMap.current,
        icon: {
          path: "M12 2L2 22h20L12 2z",
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#000000",
          strokeWeight: 1,
          scale: 1,
          anchor: new google.maps.Point(12, 24),
        },
        title: incident.type
      });
      marker.addListener('click', () => setSelectedItem({ ...incident, itemType: 'incident' }));
      markersRef.current.push(marker);
    });

    // Render Attractions
    attractions.forEach(attraction => {
      const marker = new google.maps.Marker({
        position: { lat: attraction.location.lat, lng: attraction.location.lng },
        map: googleMap.current,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#000000",
          strokeWeight: 1,
          scale: 4,
        },
        title: attraction.name
      });
      marker.addListener('click', () => setSelectedItem({ ...attraction, itemType: 'attraction' }));
      markersRef.current.push(marker);
    });

    // Render Hotels
    hotels.forEach(hotel => {
      const marker = new google.maps.Marker({
        position: { lat: hotel.location.lat, lng: hotel.location.lng },
        map: googleMap.current,
        icon: {
          path: "M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z",
          fillColor: "#6366f1",
          fillOpacity: 1,
          strokeColor: "#000000",
          strokeWeight: 1,
          scale: 0.8,
        },
        title: hotel.name
      });
      marker.addListener('click', () => setSelectedItem({ ...hotel, itemType: 'hotel' }));
      markersRef.current.push(marker);
    });

    // Render Emergencies
    emergencies.forEach(emergency => {
      const color = emergency.type === 'hospital' ? '#ef4444' : emergency.type === 'police' ? '#3b82f6' : '#eab308';
      const marker = new google.maps.Marker({
        position: { lat: emergency.location.lat, lng: emergency.location.lng },
        map: googleMap.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 6,
        },
        title: emergency.name
      });
      marker.addListener('click', () => setSelectedItem({ ...emergency, itemType: 'emergency' }));
      markersRef.current.push(marker);
    });

    // Update Heatmap
    if (heatmapRef.current) {
      const heatmapData = attractions.map(a => ({
        location: new google.maps.LatLng(a.location.lat, a.location.lng),
        weight: a.crowdDensity === 'high' ? 3 : a.crowdDensity === 'medium' ? 2 : 1
      }));
      heatmapRef.current.setData(heatmapData);
    }

  }, [incidents, zones, attractions, hotels, emergencies, mapLoaded]);

  const generateItinerary = async () => {
    if (!userLocation) return;
    setIsGeneratingItinerary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const prompt = `Based on the current location ${userLocation[0]}, ${userLocation[1]} and the following nearby spots:
      Attractions: ${attractions.map(a => a.name).join(', ')}
      Hotels: ${hotels.map(h => h.name).join(', ')}
      
      Create a curated itinerary for:
      1. Half-day trip
      2. One-day trip
      3. Multi-day exploration
      
      Include safety tips, best times to visit, and travel advice for each.
      Format as Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      setItinerary(response.text);
    } catch (error) {
      console.error("Itinerary generation failed", error);
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-slate-950">
      <div ref={mapRef} className="h-full w-full z-0" />

      {(!GOOGLE_MAPS_API_KEY || apiError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-50 p-6 text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            {!GOOGLE_MAPS_API_KEY ? (
              <>
                <h2 className="text-2xl font-bold mb-3">Google Maps Key Required</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Please provide your Google Maps API Key in the environment variables (<code className="text-blue-400">VITE_GOOGLE_MAPS_API_KEY</code>) to enable the map view.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-3">Maps API Not Enabled</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Your API key is valid, but the <span className="text-white font-semibold">Maps JavaScript API</span> is not enabled in your Google Cloud project.
                </p>
                <div className="bg-slate-800/50 rounded-2xl p-4 text-left border border-slate-700 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">How to fix:</h3>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal pl-4">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>.</li>
                    <li>Select your project and go to <span className="text-white">APIs & Services &gt; Library</span>.</li>
                    <li>Search for <span className="text-white font-semibold">"Maps JavaScript API"</span> and click <span className="text-green-400 font-bold">Enable</span>.</li>
                    <li>Wait 2-5 minutes for the changes to take effect.</li>
                  </ol>
                </div>
              </>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all active:scale-95"
            >
              Refresh Application
            </button>
          </div>
        </div>
      )}

      {/* Map Overlays */}
      <div className="absolute top-4 left-4 right-4 flex flex-col gap-4 pointer-events-none z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-xl">
              <div className={`p-2 rounded-lg ${currentSafetyScore > 80 ? 'bg-green-500/20 text-green-500' : currentSafetyScore > 50 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-none">Current Safety</span>
                <span className={`text-lg font-bold ${currentSafetyScore > 80 ? 'text-green-400' : currentSafetyScore > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {currentSafetyScore > 80 ? 'High' : currentSafetyScore > 50 ? 'Moderate' : 'Low'} ({currentSafetyScore}%)
                </span>
              </div>
            </div>

            {weather && (
              <div className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-xl">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold leading-none">{weather.condition}</span>
                  <span className="text-lg font-bold text-blue-400">{weather.temp}°C</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pointer-events-auto">
            <button className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl text-slate-400 hover:text-white shadow-xl">
              <Layers className="w-5 h-5" />
            </button>
            <button 
              onClick={locateUser}
              className="p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl text-blue-500 hover:text-blue-400 shadow-xl"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>
        </div>

        {safetyInsight && (
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="p-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl pointer-events-auto shadow-2xl max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500 mt-1">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">Safety Insight</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{safetyInsight}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Scan & Itinerary Buttons */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <button
          onClick={handleScan}
          disabled={isScanning || !userLocation}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full font-bold text-xs shadow-xl shadow-blue-900/40 flex items-center gap-2 transition-all active:scale-95"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning Surroundings...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Discover Nearby
            </>
          )}
        </button>

        {attractions.length > 0 && (
          <button
            onClick={generateItinerary}
            disabled={isGeneratingItinerary}
            className="px-6 py-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"
          >
            {isGeneratingItinerary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
            Curate Itinerary
          </button>
        )}
      </div>

      {/* Itinerary Modal */}
      <AnimatePresence>
        {itinerary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-6 overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
              <button 
                onClick={() => setItinerary(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-full text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-500">
                  <Calendar className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Curated Itinerary</h2>
                  <p className="text-slate-500 text-sm">Personalized travel plan based on safety & interests</p>
                </div>
              </div>

              <div className="markdown-body text-slate-300 prose prose-invert max-w-none">
                <Markdown>{itinerary}</Markdown>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setItinerary(null)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-28 left-4 p-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl z-10 space-y-2 shadow-xl">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="w-2 h-2 rounded-full bg-red-500" /> Incident
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Attraction
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <div className="w-2 h-2 rounded-full bg-indigo-500" /> Hotel
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-24 left-0 right-0 p-4 z-20 pointer-events-none"
          >
            <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl pointer-events-auto relative">
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-full text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  selectedItem.itemType === 'incident' ? 'bg-red-500/20 text-red-500' :
                  selectedItem.itemType === 'attraction' ? 'bg-blue-500/20 text-blue-500' :
                  selectedItem.itemType === 'hotel' ? 'bg-indigo-500/20 text-indigo-500' :
                  selectedItem.itemType === 'emergency' ? 'bg-orange-500/20 text-orange-500' :
                  'bg-green-500/20 text-green-500'
                }`}>
                  {selectedItem.itemType === 'incident' ? <AlertTriangle className="w-6 h-6" /> :
                   selectedItem.itemType === 'attraction' ? <Landmark className="w-6 h-6" /> :
                   selectedItem.itemType === 'hotel' ? <HotelIcon className="w-6 h-6" /> :
                   selectedItem.itemType === 'emergency' ? (
                     selectedItem.type === 'hospital' ? <Heart className="w-6 h-6" /> :
                     selectedItem.type === 'police' ? <Shield className="w-6 h-6" /> :
                     <Building2 className="w-6 h-6" />
                   ) :
                   <Shield className="w-6 h-6" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="font-bold text-lg leading-tight">{selectedItem.name || selectedItem.type?.replace('_', ' ')}</h3>
                    {selectedItem.severity && (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded">
                        {selectedItem.severity}
                      </span>
                    )}
                    {selectedItem.itemType === 'hotel' && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded">
                        {selectedItem.priceRange}
                      </span>
                    )}
                    {selectedItem.itemType === 'hotel' && selectedItem.safetyRating && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded border border-green-500/20">
                        <Shield className="w-2.5 h-2.5" />
                        {selectedItem.safetyRating}/5
                      </span>
                    )}
                    {selectedItem.itemType === 'attraction' && selectedItem.safetyScore && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded border border-blue-500/20">
                        <Shield className="w-2.5 h-2.5" />
                        {selectedItem.safetyScore}%
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-2">{selectedItem.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {selectedItem.itemType === 'hotel' && (
                      <>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <Star className="w-3 h-3 text-yellow-500" /> {selectedItem.rating}/5 Rating
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <MapPin className="w-3 h-3 text-blue-500" /> {selectedItem.distance}
                        </div>
                      </>
                    )}
                    {selectedItem.itemType === 'attraction' && (
                      <>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <Calendar className="w-3 h-3 text-indigo-500" /> {selectedItem.bestTimeToVisit}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <Users className="w-3 h-3 text-green-500" /> {selectedItem.crowdDensity} Crowd
                        </div>
                      </>
                    )}
                    {selectedItem.itemType === 'emergency' && (
                      <div className="col-span-2 flex items-center gap-2 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                        <Phone className="w-3 h-3" /> {selectedItem.contact}
                      </div>
                    )}
                  </div>

                  {selectedItem.whyRecommended && (
                    <div className="mt-3 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Why Recommended</h4>
                      <p className="text-xs text-slate-400 italic">"{selectedItem.whyRecommended}"</p>
                    </div>
                  )}

                  {selectedItem.travelTip && (
                    <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                      <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Travel Tip</h4>
                      <p className="text-xs text-slate-400 italic">"{selectedItem.travelTip}"</p>
                    </div>
                  )}
                  
                  <div className="pt-3 flex gap-2">
                    <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <Navigation className="w-3 h-3" /> Navigate
                    </button>
                    <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <Info className="w-3 h-3" /> Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HotelIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M13 13h4"/><path d="M13 17h4"/><path d="M7 13h2"/><path d="M7 17h2"/></svg>;
}
