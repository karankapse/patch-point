import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import DriveScreen from '../screens/DriveScreen';
import MapScreen from '../screens/MapScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

interface TabIconProps {
    focused: boolean;
    icon: React.ReactNode;
}

function TabIcon({ focused, icon }: TabIconProps) {
    return (
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            {icon}
        </View>
    );
}

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.cyan,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: styles.tabLabel,
                tabBarItemStyle: styles.tabItem,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            icon={<Ionicons name="home" size={22} color={color} />}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Drive"
                component={DriveScreen}
                options={{
                    tabBarLabel: 'Drive',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            icon={<MaterialCommunityIcons name="radar" size={24} color={focused ? Colors.bg : color} />}
                        />
                    ),
                    tabBarItemStyle: styles.tabItemCenter,
                    tabBarIconStyle: styles.tabIconCenter,
                    tabBarLabelStyle: { ...styles.tabLabel, color: Colors.cyan },
                    tabBarActiveTintColor: Colors.cyan,
                }}
            />
            <Tab.Screen
                name="Map"
                component={MapScreen}
                options={{
                    tabBarLabel: 'Map',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            icon={<Ionicons name="map" size={22} color={color} />}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            focused={focused}
                            icon={<MaterialCommunityIcons name="clipboard-list-outline" size={23} color={color} />}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: 'rgba(17,24,39,0.97)',
        borderTopColor: 'rgba(255,255,255,0.06)',
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 82 : 65,
        paddingTop: 6,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: Platform.OS === 'ios' ? 0 : 4,
    },
    tabItem: {
        paddingTop: 2,
    },
    tabItemCenter: {
        paddingTop: 2,
    },
    tabIconCenter: {},
    iconWrap: {
        width: 42,
        height: 36,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: Colors.cyanDim,
    },
});
