import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { usePotholes } from '../context/PotholeContext';
import { getAllPotholes } from '../db/database';
import { PotholeEntry } from '../context/PotholeContext';
import { Colors, Typography, FontWeight, Spacing, Radius, Shadow } from '../theme';

function getMarkerColor(severity: string) {
    if (severity === 'high') return Colors.danger;
    if (severity === 'medium') return Colors.warning;
    return Colors.cyan;
}

export default function MapScreen() {
    const insets = useSafeAreaInsets();
    const { potholes, loadPotholes } = usePotholes();
    const [userCoord, setUserCoord] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<PotholeEntry | null>(null);
    const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    useEffect(() => {
        // Load all saved potholes from DB into context
        getAllPotholes().then((rows) => loadPotholes(rows as PotholeEntry[]));

        // Get current location for map centering
        Location.requestForegroundPermissionsAsync().then(({ status }) => {
            if (status === 'granted') {
                Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((pos) => {
                    setUserCoord({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                    setLoading(false);
                });
            } else {
                setLoading(false);
            }
        });
    }, []);

    const filtered = filter === 'all' ? potholes : potholes.filter((p) => p.severity === filter);

    const defaultRegion = userCoord
        ? { ...userCoord, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        : { latitude: 40.7128, longitude: -74.006, latitudeDelta: 0.05, longitudeDelta: 0.05 };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={Colors.cyan} size="large" />
                <Text style={styles.loadingText}>Locating you...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_DEFAULT}
                initialRegion={defaultRegion}
                showsUserLocation
                showsMyLocationButton={false}
                userInterfaceStyle="dark"
                mapType="standard"
            >
                {filtered.map((p) => (
                    <React.Fragment key={p.id}>
                        <Marker
                            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                            onPress={() => setSelected(p)}
                        >
                            <View style={[styles.markerOuter, { borderColor: getMarkerColor(p.severity) }]}>
                                <View style={[styles.markerInner, { backgroundColor: getMarkerColor(p.severity) }]} />
                            </View>
                        </Marker>
                        <Circle
                            center={{ latitude: p.latitude, longitude: p.longitude }}
                            radius={8}
                            fillColor={getMarkerColor(p.severity) + '30'}
                            strokeColor={getMarkerColor(p.severity) + '60'}
                            strokeWidth={1}
                        />
                    </React.Fragment>
                ))}
            </MapView>

            {/* Top header */}
            <View style={[styles.topBar, { paddingTop: insets.top + Spacing.xs }]}>
                <View style={styles.topBarInner}>
                    <Text style={styles.mapTitle}>Pothole Map</Text>
                    <Text style={styles.mapCount}>{filtered.length} hit{filtered.length !== 1 ? 's' : ''}</Text>
                </View>

                {/* Filter chips */}
                <View style={styles.filterRow}>
                    {(['all', 'high', 'medium', 'low'] as const).map((f) => {
                        const color =
                            f === 'all' ? Colors.textSecondary
                                : f === 'high' ? Colors.danger
                                    : f === 'medium' ? Colors.warning
                                        : Colors.cyan;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.chip, filter === f && { backgroundColor: color + '33', borderColor: color }]}
                                onPress={() => setFilter(f)}
                            >
                                <Text style={[styles.chipText, filter === f && { color }]}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Stats legend */}
            <View style={[styles.legend, { bottom: insets.bottom + (selected ? 180 : 20) }]}>
                {[
                    { label: 'High', color: Colors.danger, count: potholes.filter((p) => p.severity === 'high').length },
                    { label: 'Medium', color: Colors.warning, count: potholes.filter((p) => p.severity === 'medium').length },
                    { label: 'Low', color: Colors.cyan, count: potholes.filter((p) => p.severity === 'low').length },
                ].map((item) => (
                    <View key={item.label} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>{item.label}: {item.count}</Text>
                    </View>
                ))}
            </View>

            {/* Selected marker bottom sheet */}
            {selected && (
                <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>
                    <View style={styles.sheetHandle} />
                    <View style={styles.sheetRow}>
                        <View style={[styles.sheetSeverityDot, { backgroundColor: getMarkerColor(selected.severity) }]} />
                        <Text style={styles.sheetSeverity}>{selected.severity.toUpperCase()} SEVERITY</Text>
                        <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                            <Ionicons name="close" size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.sheetCoords}>
                        {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                    </Text>
                    <View style={styles.sheetMeta}>
                        <View style={styles.metaPill}>
                            <MaterialCommunityIcons name="eye" size={13} color={selected.vision_hit ? Colors.success : Colors.textMuted} />
                            <Text style={[styles.metaText, { color: selected.vision_hit ? Colors.success : Colors.textMuted }]}>
                                Vision
                            </Text>
                        </View>
                        <View style={styles.metaPill}>
                            <MaterialCommunityIcons name="vibrate" size={13} color={selected.vibration_hit ? Colors.success : Colors.textMuted} />
                            <Text style={[styles.metaText, { color: selected.vibration_hit ? Colors.success : Colors.textMuted }]}>
                                Vibration
                            </Text>
                        </View>
                        <View style={styles.metaPill}>
                            <Ionicons name="speedometer" size={13} color={Colors.cyan} />
                            <Text style={[styles.metaText, { color: Colors.cyan }]}>
                                {(selected.confidence * 100).toFixed(0)}%
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.sheetTime}>
                        {new Date(selected.timestamp).toLocaleString()}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    loadingText: { color: Colors.textSecondary, fontSize: Typography.base },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(10,14,26,0.9)',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topBarInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    mapTitle: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    mapCount: { fontSize: Typography.sm, color: Colors.textMuted },
    filterRow: { flexDirection: 'row', gap: Spacing.xs },
    chip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipText: { fontSize: Typography.xs, fontWeight: FontWeight.semibold, color: Colors.textMuted },
    markerOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        backgroundColor: 'rgba(10,14,26,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerInner: { width: 9, height: 9, borderRadius: 5 },
    legend: {
        position: 'absolute',
        right: Spacing.md,
        backgroundColor: 'rgba(10,14,26,0.85)',
        borderRadius: Radius.md,
        padding: Spacing.sm,
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: Typography.xs, color: Colors.textSecondary },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.bgCard,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        padding: Spacing.md,
        gap: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        ...Shadow.card,
    },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 4 },
    sheetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sheetSeverityDot: { width: 10, height: 10, borderRadius: 5 },
    sheetSeverity: { flex: 1, fontSize: Typography.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: 0.5 },
    closeBtn: { padding: 4 },
    sheetCoords: { fontSize: Typography.sm, color: Colors.textSecondary, fontFamily: 'monospace' },
    sheetMeta: { flexDirection: 'row', gap: Spacing.sm },
    metaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.bgSurface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    metaText: { fontSize: Typography.xs, fontWeight: FontWeight.semibold },
    sheetTime: { fontSize: Typography.xs, color: Colors.textMuted },
});
