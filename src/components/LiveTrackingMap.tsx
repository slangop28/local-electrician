'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

interface LiveTrackingMapProps {
    // Static marker (customer or electrician location)
    destinationLat?: number;
    destinationLng?: number;
    destinationLabel?: string;

    // Live tracking (electrician's moving position)
    trackElectricianId?: string;

    // Map settings
    height?: string;
    showDirections?: boolean;

    // Address fallback for geocoding
    address?: string;
}

const mapContainerStyle = {
    width: '100%',
    borderRadius: '16px',
};

const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center

export function LiveTrackingMap({
    destinationLat,
    destinationLng,
    destinationLabel = 'Location',
    trackElectricianId,
    height = '300px',
    showDirections = false,
    address,
}: LiveTrackingMapProps) {
    const { isLoaded } = useGoogleMaps();
    const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [geocodedLocation, setGeocodedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    // Geocode address if no lat/lng provided
    useEffect(() => {
        if (!isLoaded || destinationLat || destinationLng || !address) return;

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setGeocodedLocation({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                });
            }
        });
    }, [isLoaded, address, destinationLat, destinationLng]);

    // Poll for live electrician location
    useEffect(() => {
        if (!trackElectricianId) return;

        const fetchLocation = async () => {
            try {
                const res = await fetch(`/api/location?electricianId=${trackElectricianId}`);
                const data = await res.json();
                if (data.success && data.location) {
                    setLiveLocation({
                        lat: data.location.latitude,
                        lng: data.location.longitude,
                    });
                }
            } catch (err) {
                console.error('Failed to fetch live location:', err);
            }
        };

        fetchLocation();
        const interval = setInterval(fetchLocation, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [trackElectricianId]);

    // Calculate directions when both points are available
    useEffect(() => {
        if (!isLoaded || !showDirections || !liveLocation) return;

        const dest = destinationLat && destinationLng
            ? { lat: destinationLat, lng: destinationLng }
            : geocodedLocation;

        if (!dest) return;

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: liveLocation,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    setDirections(result);
                }
            }
        );
    }, [isLoaded, showDirections, liveLocation, destinationLat, destinationLng, geocodedLocation]);

    if (!isLoaded) {
        return (
            <div style={{ height, width: '100%' }} className="bg-gray-800 rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Loading map...</p>
                </div>
            </div>
        );
    }

    const destPosition = (destinationLat && destinationLng)
        ? { lat: destinationLat, lng: destinationLng }
        : geocodedLocation;

    const center = liveLocation || destPosition || defaultCenter;
    const zoom = destPosition ? 14 : 5;

    return (
        <div className="relative">
            <GoogleMap
                mapContainerStyle={{ ...mapContainerStyle, height }}
                zoom={zoom}
                center={center}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    styles: [
                        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
                        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
                        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
                        { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
                        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
                        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
                        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
                    ],
                }}
            >
                {/* Destination marker */}
                {destPosition && !directions && (
                    <Marker
                        position={destPosition}
                        label={{
                            text: destinationLabel.charAt(0),
                            color: '#fff',
                            fontWeight: 'bold',
                        }}
                    />
                )}

                {/* Live electrician marker */}
                {liveLocation && !directions && (
                    <Marker
                        position={liveLocation}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#10b981',
                            fillOpacity: 1,
                            strokeColor: '#fff',
                            strokeWeight: 3,
                        }}
                        label={{
                            text: '⚡',
                            fontSize: '14px',
                        }}
                    />
                )}

                {/* Route */}
                {directions && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            polylineOptions: {
                                strokeColor: '#10b981',
                                strokeWeight: 5,
                                strokeOpacity: 0.8,
                            },
                            suppressMarkers: false,
                        }}
                    />
                )}
            </GoogleMap>

            {/* Live tracking indicator */}
            {liveLocation && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-green-300 text-xs font-semibold">LIVE TRACKING</span>
                </div>
            )}

            {/* Get Directions button */}
            {destPosition && (
                <button
                    onClick={() => {
                        const url = liveLocation
                            ? `https://www.google.com/maps/dir/${liveLocation.lat},${liveLocation.lng}/${destPosition.lat},${destPosition.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${destPosition.lat},${destPosition.lng}`;
                        window.open(url, '_blank');
                    }}
                    className="absolute bottom-3 right-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                    🧭 Get Directions
                </button>
            )}
        </div>
    );
}
