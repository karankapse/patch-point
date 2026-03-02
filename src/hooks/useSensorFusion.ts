import { useEffect, useRef, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';

const SAMPLE_RATE_MS = 10; // 100 Hz
const WINDOW_MS = 500;     // 500 ms window
const JOLT_THRESHOLD = 2.5; // g-force delta above baseline to count as jolt

interface AccelSample {
    z: number;
    time: number;
}

export interface SensorFusionHook {
    /** Call after a visual detection to wait for a vibration confirmation within 500ms */
    waitForJolt: () => Promise<boolean>;
    /** Current Z-axis reading (useful for UI display) */
    currentZ: React.MutableRefObject<number>;
}

export function useSensorFusion(): SensorFusionHook {
    const samplesRef = useRef<AccelSample[]>([]);
    const currentZ = useRef<number>(0);
    const baselineZ = useRef<number>(0);
    const sampleCount = useRef<number>(0);

    useEffect(() => {
        Accelerometer.setUpdateInterval(SAMPLE_RATE_MS);
        const subscription = Accelerometer.addListener(({ z }) => {
            const now = Date.now();
            currentZ.current = z;

            // Rolling window
            samplesRef.current.push({ z, time: now });
            samplesRef.current = samplesRef.current.filter((s) => now - s.time < WINDOW_MS * 2);

            // Build baseline from first 50 samples (calm driving average)
            sampleCount.current += 1;
            if (sampleCount.current <= 50) {
                baselineZ.current =
                    samplesRef.current.reduce((acc, s) => acc + s.z, 0) / samplesRef.current.length;
            }
        });

        return () => subscription.remove();
    }, []);

    /**
     * Resolves true if a jolt (sharp Z-axis spike) is detected within `timeoutMs` ms.
     * Call this immediately after a visual detection event.
     */
    const waitForJolt = useCallback((timeoutMs: number = WINDOW_MS): Promise<boolean> => {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const baseline = baselineZ.current;

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;

                // Check recent samples in the window
                const recentSamples = samplesRef.current.filter(
                    (s) => s.time >= startTime && s.time <= Date.now()
                );

                const joltDetected = recentSamples.some(
                    (s) => Math.abs(s.z - baseline) > JOLT_THRESHOLD
                );

                if (joltDetected) {
                    clearInterval(interval);
                    resolve(true);
                } else if (elapsed >= timeoutMs) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, 20);
        });
    }, []);

    return { waitForJolt, currentZ };
}
