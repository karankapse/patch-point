import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePotholes, PotholeEntry } from '../context/PotholeContext';
import { getAllPotholes, clearPotholes } from '../db/database';
import { Colors, Typography, FontWeight, Spacing, Radius, Shadow } from '../theme';

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function SeverityBadge({ severity }: { severity: string }) {
    const colors: Record<string, string> = {
        high: Colors.danger,
        medium: Colors.warning,
        low: Colors.cyan,
    };
    const color = colors[severity] ?? Colors.textMuted;
    return (
        <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{severity.toUpperCase()}</Text>
        </View>
    );
}

interface RecordCardProps {
    item: PotholeEntry;
}
function RecordCard({ item }: RecordCardProps) {
    const severityColor =
        item.severity === 'high' ? Colors.danger : item.severity === 'medium' ? Colors.warning : Colors.cyan;

    return (
        <View style={[styles.card, { borderLeftColor: severityColor }]}>
            <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                    <SeverityBadge severity={item.severity} />
                    <Text style={styles.cardTime}>{timeAgo(item.timestamp)}</Text>
                </View>
                <Text style={styles.cardConf}>{(item.confidence * 100).toFixed(0)}%</Text>
            </View>

            <Text style={styles.cardCoords}>
                📍 {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </Text>

            <View style={styles.cardMeta}>
                <View style={[styles.metaChip, { opacity: item.vision_hit ? 1 : 0.35 }]}>
                    <MaterialCommunityIcons name="eye" size={12} color={item.vision_hit ? Colors.success : Colors.textMuted} />
                    <Text style={[styles.metaText, { color: item.vision_hit ? Colors.success : Colors.textMuted }]}>
                        Visual
                    </Text>
                </View>
                <View style={[styles.metaChip, { opacity: item.vibration_hit ? 1 : 0.35 }]}>
                    <MaterialCommunityIcons name="vibrate" size={12} color={item.vibration_hit ? Colors.success : Colors.textMuted} />
                    <Text style={[styles.metaText, { color: item.vibration_hit ? Colors.success : Colors.textMuted }]}>
                        Vibration
                    </Text>
                </View>
                {item.vibration_hit && item.vision_hit && (
                    <View style={styles.confirmedChip}>
                        <Text style={styles.confirmedText}>✓ DUAL CONFIRMED</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function HistoryScreen() {
    const insets = useSafeAreaInsets();
    const { potholes, loadPotholes, clearPotholes: contextClear } = usePotholes();
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    const loadAll = useCallback(async () => {
        const rows = await getAllPotholes();
        loadPotholes(rows as PotholeEntry[]);
    }, [loadPotholes]);

    useEffect(() => {
        loadAll();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    const handleClear = () => {
        Alert.alert(
            'Clear All Records',
            'This will permanently delete all pothole records. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        await clearPotholes();
                        contextClear();
                    },
                },
            ]
        );
    };

    const filtered = filter === 'all' ? potholes : potholes.filter((p) => p.severity === filter);
    const dual = potholes.filter((p) => p.vision_hit && p.vibration_hit).length;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>History</Text>
                    <Text style={styles.subtitle}>
                        {potholes.length} records · {dual} dual-confirmed
                    </Text>
                </View>
                {potholes.length > 0 && (
                    <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
                {(['all', 'high', 'medium', 'low'] as const).map((f) => {
                    const color = f === 'all' ? Colors.textSecondary : f === 'high' ? Colors.danger : f === 'medium' ? Colors.warning : Colors.cyan;
                    return (
                        <TouchableOpacity
                            key={f}
                            style={[styles.chip, filter === f && { backgroundColor: color + '22', borderColor: color }]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.chipText, filter === f && { color }]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {filtered.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialCommunityIcons name="road-variant" size={56} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>No records yet</Text>
                    <Text style={styles.emptyDesc}>
                        Start a scan session from the Drive tab to begin detecting potholes.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => <RecordCard item={item} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.cyan}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    title: { fontSize: Typography['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    subtitle: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
    clearBtn: {
        padding: Spacing.sm,
        backgroundColor: Colors.dangerDim,
        borderRadius: Radius.sm,
        marginTop: 4,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
        paddingBottom: Spacing.sm,
    },
    chip: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipText: { fontSize: Typography.xs, fontWeight: FontWeight.semibold, color: Colors.textMuted },
    list: { paddingHorizontal: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
    card: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderLeftWidth: 3,
        gap: Spacing.sm,
        ...Shadow.card,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardConf: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary },
    cardTime: { fontSize: Typography.xs, color: Colors.textMuted },
    cardCoords: { fontSize: Typography.sm, color: Colors.textSecondary },
    cardMeta: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.bgSurface,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    metaText: { fontSize: 11, fontWeight: FontWeight.semibold },
    confirmedChip: {
        backgroundColor: Colors.successDim,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
    },
    confirmedText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.success, letterSpacing: 0.5 },
    badge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    badgeText: { fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
    emptyTitle: { fontSize: Typography.lg, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
    emptyDesc: { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
