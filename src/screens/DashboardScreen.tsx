import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePotholes } from '../context/PotholeContext';
import { getPotholeStats } from '../db/database';
import { Colors, Typography, Spacing, Radius, Shadow, FontWeight } from '../theme';

const { width } = Dimensions.get('window');

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    delay?: number;
}

function StatCard({ icon, label, value, color, delay = 0 }: StatCardProps) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statCard,
                {
                    borderLeftColor: color,
                    opacity: anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
            ]}
        >
            <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>{icon}</View>
            <View style={styles.statText}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
        </Animated.View>
    );
}

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { potholes, sessionActive } = usePotholes();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const titleAnim = useRef(new Animated.Value(0)).current;
    const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });

    useEffect(() => {
        Animated.timing(titleAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    useEffect(() => {
        getPotholeStats().then(setStats);
    }, [potholes]);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {/* Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: titleAnim,
                            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                        },
                    ]}
                >
                    <View>
                        <Text style={styles.greeting}>Welcome back 👋</Text>
                        <Text style={styles.title}>PatchPoint</Text>
                        <Text style={styles.subtitle}>Road intelligence in your pocket</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: sessionActive ? Colors.success : Colors.textMuted }]} />
                </Animated.View>

                {/* Hero CTA */}
                <View style={styles.heroWrap}>
                    <View style={styles.heroGlow} />
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => navigation.navigate('Drive')}
                            activeOpacity={0.85}
                        >
                            <MaterialCommunityIcons name="radar" size={36} color={Colors.bg} />
                            <Text style={styles.scanButtonText}>
                                {sessionActive ? 'Resume Scan' : 'Start Scan'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                    <Text style={styles.scanHint}>Tap to begin real-time pothole detection</Text>
                </View>

                {/* Stats */}
                <Text style={styles.sectionTitle}>Session Overview</Text>
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<MaterialCommunityIcons name="map-marker-alert" size={20} color={Colors.danger} />}
                        label="Total Found"
                        value={stats.total}
                        color={Colors.danger}
                        delay={100}
                    />
                    <StatCard
                        icon={<Ionicons name="warning" size={20} color={Colors.warning} />}
                        label="High Severity"
                        value={stats.high}
                        color={Colors.warning}
                        delay={200}
                    />
                    <StatCard
                        icon={<AntDesign name="check-circle" size={20} color={Colors.success} />}
                        label="Confirmed Hits"
                        value={potholes.filter((p) => p.vibration_hit).length}
                        color={Colors.success}
                        delay={300}
                    />
                    <StatCard
                        icon={<Ionicons name="eye" size={20} color={Colors.cyan} />}
                        label="Vision Only"
                        value={potholes.filter((p) => p.vision_hit && !p.vibration_hit).length}
                        color={Colors.cyan}
                        delay={400}
                    />
                </View>

                {/* How it works */}
                <Text style={styles.sectionTitle}>How It Works</Text>
                <View style={styles.infoCard}>
                    {[
                        { icon: '📷', title: 'Camera Detection', desc: 'AI model scans the road in real-time for pothole patterns.' },
                        { icon: '📳', title: 'Vibration Confirmation', desc: 'Accelerometer confirms with a Z-axis jolt within 500ms.' },
                        { icon: '📍', title: 'GPS Tagging', desc: 'Precise coordinates are stored for every confirmed hit.' },
                    ].map((item, i) => (
                        <View key={i} style={[styles.infoRow, i < 2 && styles.infoRowBorder]}>
                            <Text style={styles.infoEmoji}>{item.icon}</Text>
                            <View style={styles.infoText}>
                                <Text style={styles.infoTitle}>{item.title}</Text>
                                <Text style={styles.infoDesc}>{item.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: insets.bottom + Spacing.xl }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { paddingHorizontal: Spacing.md },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
    },
    greeting: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 2 },
    title: {
        fontSize: Typography['2xl'],
        fontWeight: FontWeight.extrabold,
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: { fontSize: Typography.sm, color: Colors.textMuted, marginTop: 2 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },
    heroWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
    heroGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.cyanGlow,
        opacity: 0.25,
        top: Spacing.xl - 30,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.cyan,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        ...Shadow.cyan,
    },
    scanButtonText: {
        fontSize: Typography.lg,
        fontWeight: FontWeight.bold,
        color: Colors.bg,
        letterSpacing: 0.3,
    },
    scanHint: { marginTop: Spacing.md, fontSize: Typography.sm, color: Colors.textMuted },
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    statCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.md,
        padding: Spacing.md,
        borderLeftWidth: 3,
        gap: Spacing.sm,
        width: (width - Spacing.md * 2 - Spacing.sm) / 2,
        ...Shadow.card,
    },
    statIconWrap: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
    statText: { flex: 1 },
    statValue: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    statLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },
    infoCard: {
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        ...Shadow.card,
        marginBottom: Spacing.lg,
    },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, gap: Spacing.md },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    infoEmoji: { fontSize: 24, lineHeight: 28 },
    infoText: { flex: 1 },
    infoTitle: { fontSize: Typography.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    infoDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
