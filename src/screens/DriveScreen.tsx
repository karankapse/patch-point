import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocation } from '../hooks/useLocation';
import { useDetectionEngine, DetectionEvent } from '../hooks/useDetectionEngine';
import { usePotholes } from '../context/PotholeContext';
import { Colors, Typography, FontWeight, Spacing, Radius } from '../theme';

const { width, height } = Dimensions.get('window');

// We simulate detections since we don't have a real .tflite file yet.
// Swap this with real TFLite inference in production.
function useSimulatedDetection(onDetect: (confidence: number) => void, active: boolean) {
    useEffect(() => {
        if (!active) return;
        const interval = setInterval(() => {
            // Random chance of a detection (simulates 1 every ~8s on average)
            if (Math.random() < 0.2) {
                const confidence = 0.55 + Math.random() * 0.4;
                onDetect(confidence);
            }
        }, 1600);
        return () => clearInterval(interval);
    }, [active, onDetect]);
}

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
    const color =
        severity === 'high' ? Colors.danger : severity === 'medium' ? Colors.warning : Colors.cyan;
    const label = severity === 'high' ? '🔴 HIGH' : severity === 'medium' ? '🟠 MEDIUM' : '🔵 LOW';
    return (
        <View style={[styles.badge, { backgroundColor: color + '33', borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
        </View>
    );
}

export default function DriveScreen() {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const { location } = useLocation();
    const { sessionActive, startSession, stopSession, potholes } = usePotholes();

    const [lastEvent, setLastEvent] = useState<DetectionEvent | null>(null);
    const [hitFlash, setHitFlash] = useState(false);
    const flashAnim = useRef(new Animated.Value(0)).current;
    const hitCountAnim = useRef(new Animated.Value(1)).current;

    const handleDetection = useCallback((event: DetectionEvent) => {
        setLastEvent(event);
        setHitFlash(true);

        Animated.sequence([
            Animated.timing(flashAnim, { toValue: event.severity === 'high' ? 0.35 : 0.15, duration: 80, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();

        Animated.sequence([
            Animated.timing(hitCountAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
            Animated.timing(hitCountAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        setTimeout(() => setHitFlash(false), 3000);
    }, []);

    const { processVisionHit } = useDetectionEngine({
        location,
        onDetection: handleDetection,
    });

    const handleSimDetection = useCallback(
        (confidence: number) => {
            processVisionHit(confidence, 'pothole');
        },
        [processVisionHit]
    );

    useSimulatedDetection(handleSimDetection, sessionActive);

    if (!permission) {
        return (
            <View style={styles.centered}>
                <Text style={styles.permText}>Requesting camera access...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.centered}>
                <MaterialCommunityIcons name="camera-off" size={48} color={Colors.textMuted} />
                <Text style={styles.permText}>Camera access is required</Text>
                <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
                    <Text style={styles.permButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const sessionPotholes = potholes.length;
    const highCount = potholes.filter((p) => p.severity === 'high').length;

    return (
        <View style={styles.container}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" />

            {/* Flash overlay on detection */}
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor:
                            lastEvent?.severity === 'high' ? Colors.danger : Colors.warning,
                        opacity: flashAnim,
                    },
                ]}
            />

            {/* Scan overlay grid */}
            {sessionActive && (
                <View pointerEvents="none" style={styles.scanGrid}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <View key={i} style={styles.scanLine} />
                    ))}
                </View>
            )}

            {/* Top HUD */}
            <View style={[styles.topHUD, { paddingTop: insets.top + Spacing.sm }]}>
                <View style={styles.hudLeft}>
                    <View style={[styles.hudPill, sessionActive && styles.hudPillActive]}>
                        <View style={[styles.recDot, sessionActive && styles.recDotActive]} />
                        <Text style={styles.hudPillText}>{sessionActive ? 'SCANNING' : 'IDLE'}</Text>
                    </View>
                </View>
                <View style={styles.hudRight}>
                    {location && (
                        <Text style={styles.coordText}>
                            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                        </Text>
                    )}
                    {location?.speed != null && (
                        <Text style={styles.speedText}>{(location.speed * 3.6).toFixed(0)} km/h</Text>
                    )}
                </View>
            </View>

            {/* Detection event banner */}
            {hitFlash && lastEvent && (
                <View style={[styles.hitBanner, { borderColor: lastEvent.severity === 'high' ? Colors.danger : Colors.warning }]}>
                    <Text style={styles.hitTitle}>
                        {lastEvent.severity === 'high' ? '⚠️ HIGH-CONFIDENCE HIT' : lastEvent.vibrationHit ? '✅ CONFIRMED HIT' : '👁 VISION HIT'}
                    </Text>
                    <View style={styles.hitRow}>
                        <SeverityBadge severity={lastEvent.severity} />
                        <Text style={styles.hitConf}>{(lastEvent.confidence * 100).toFixed(0)}% confidence</Text>
                    </View>
                    {lastEvent.vibrationHit && (
                        <Text style={styles.hitSub}>📳 Vibration confirmed</Text>
                    )}
                </View>
            )}

            {/* Bottom controls */}
            <View style={[styles.bottomControls, { paddingBottom: insets.bottom + Spacing.md }]}>
                {/* Session counter */}
                <View style={styles.counterRow}>
                    <Animated.View style={{ transform: [{ scale: hitCountAnim }] }}>
                        <View style={styles.counterCard}>
                            <Text style={styles.counterVal}>{sessionPotholes}</Text>
                            <Text style={styles.counterLabel}>Potholes</Text>
                        </View>
                    </Animated.View>
                    <View style={styles.counterCard}>
                        <Text style={[styles.counterVal, { color: Colors.danger }]}>{highCount}</Text>
                        <Text style={styles.counterLabel}>High</Text>
                    </View>
                </View>

                {/* Start/Stop button */}
                <TouchableOpacity
                    style={[styles.mainBtn, sessionActive && styles.mainBtnStop]}
                    onPress={sessionActive ? stopSession : startSession}
                    activeOpacity={0.85}
                >
                    {sessionActive ? (
                        <>
                            <Ionicons name="stop" size={24} color={Colors.textPrimary} />
                            <Text style={styles.mainBtnText}>Stop Session</Text>
                        </>
                    ) : (
                        <>
                            <MaterialCommunityIcons name="radar" size={24} color={Colors.bg} />
                            <Text style={[styles.mainBtnText, { color: Colors.bg }]}>Start Session</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centered: {
        flex: 1,
        backgroundColor: Colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        padding: Spacing.xl,
    },
    permText: { color: Colors.textSecondary, fontSize: Typography.base, textAlign: 'center' },
    permButton: {
        backgroundColor: Colors.cyan,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: Radius.full,
    },
    permButtonText: { color: Colors.bg, fontWeight: FontWeight.bold, fontSize: Typography.base },
    scanGrid: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-around',
        opacity: 0.12,
    },
    scanLine: { height: 1, backgroundColor: Colors.cyan, width: '100%' },
    topHUD: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        backgroundColor: 'rgba(10,14,26,0.7)',
    },
    hudLeft: { justifyContent: 'center' },
    hudRight: { alignItems: 'flex-end', gap: 2 },
    hudPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        gap: 6,
    },
    hudPillActive: { backgroundColor: Colors.dangerDim, borderWidth: 1, borderColor: Colors.danger },
    recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.textMuted },
    recDotActive: { backgroundColor: Colors.danger },
    hudPillText: { fontSize: Typography.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: 1 },
    coordText: { fontSize: 10, color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    speedText: { fontSize: Typography.md, fontWeight: FontWeight.bold, color: Colors.cyan },
    hitBanner: {
        position: 'absolute',
        top: '25%',
        left: Spacing.lg,
        right: Spacing.lg,
        backgroundColor: 'rgba(10,14,26,0.92)',
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    hitTitle: { fontSize: Typography.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    hitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    hitSub: { fontSize: Typography.sm, color: Colors.textSecondary },
    hitConf: { fontSize: Typography.sm, color: Colors.textSecondary },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1 },
    badgeText: { fontSize: Typography.xs, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(10,14,26,0.85)',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        gap: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    counterRow: { flexDirection: 'row', gap: Spacing.sm },
    counterCard: {
        flex: 1,
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: Spacing.sm,
        alignItems: 'center',
    },
    counterVal: {
        fontSize: Typography['2xl'],
        fontWeight: FontWeight.extrabold,
        color: Colors.textPrimary,
    },
    counterLabel: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
    mainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.cyan,
        borderRadius: Radius.full,
        paddingVertical: Spacing.md,
    },
    mainBtnStop: { backgroundColor: Colors.dangerDim, borderWidth: 1.5, borderColor: Colors.danger },
    mainBtnText: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
