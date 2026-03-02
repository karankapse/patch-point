import { useRef, useCallback } from 'react';
import { useSensorFusion } from './useSensorFusion';
import { usePotholes } from '../context/PotholeContext';
import { LocationData } from './useLocation';

export type DetectionSeverity = 'high' | 'medium' | 'low';

export interface DetectionEvent {
    confidence: number;
    label: string;
    bbox?: { x: number; y: number; width: number; height: number };
    visionHit: boolean;
    vibrationHit: boolean;
    severity: DetectionSeverity;
    location: LocationData | null;
    timestamp: number;
}

interface UseDetectionEngineOptions {
    location: LocationData | null;
    onDetection?: (event: DetectionEvent) => void;
}

/**
 * Orchestrates the dual-verification sensor fusion pipeline:
 * 1. Camera/model fires a "vision hit"
 * 2. We wait up to 500ms for a vibration confirmation
 * 3. Severity is determined by both signals + confidence score
 * 4. The confirmed pothole is persisted via PotholeContext
 */
export function useDetectionEngine({ location, onDetection }: UseDetectionEngineOptions) {
    const { waitForJolt } = useSensorFusion();
    const { addPothole } = usePotholes();
    const processingRef = useRef(false);
    const lastDetectionTime = useRef(0);
    const COOLDOWN_MS = 2000; // prevent duplicate detections

    const processVisionHit = useCallback(
        async (confidence: number, label: string, bbox?: DetectionEvent['bbox']) => {
            const now = Date.now();
            if (processingRef.current || now - lastDetectionTime.current < COOLDOWN_MS) return;
            processingRef.current = true;
            lastDetectionTime.current = now;

            const vibrationHit = await waitForJolt();
            const visionHit = true;

            let severity: DetectionSeverity;
            if (vibrationHit && confidence > 0.7) {
                severity = 'high';
            } else if (vibrationHit || confidence > 0.6) {
                severity = 'medium';
            } else {
                severity = 'low';
            }

            const event: DetectionEvent = {
                confidence,
                label,
                bbox,
                visionHit,
                vibrationHit,
                severity,
                location,
                timestamp: now,
            };

            // Persist to DB (only if we have location or it's high/medium confidence)
            if (location && severity !== 'low') {
                await addPothole({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    confidence,
                    vision_hit: visionHit ? 1 : 0,
                    vibration_hit: vibrationHit ? 1 : 0,
                    severity,
                    timestamp: now,
                });
            }

            onDetection?.(event);
            processingRef.current = false;
        },
        [waitForJolt, addPothole, location, onDetection]
    );

    return { processVisionHit };
}
