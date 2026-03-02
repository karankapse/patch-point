import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
    latitude: number;
    longitude: number;
    speed: number | null;       // m/s
    heading: number | null;     // degrees
    accuracy: number | null;    // meters
}

export function useLocation() {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const watchRef = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied. Pothole coordinates will not be available.');
                return;
            }
            if (!mounted) return;
            setPermissionGranted(true);

            watchRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 500,
                    distanceInterval: 0,
                },
                (loc) => {
                    if (!mounted) return;
                    setLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        speed: loc.coords.speed,
                        heading: loc.coords.heading,
                        accuracy: loc.coords.accuracy,
                    });
                }
            );
        })();

        return () => {
            mounted = false;
            watchRef.current?.remove();
        };
    }, []);

    return { location, permissionGranted, error };
}
