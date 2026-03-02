import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { PotholeProvider } from './src/context/PotholeContext';
import TabNavigator from './src/navigation/TabNavigator';
import { Colors } from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PotholeProvider>
          <NavigationContainer>
            <StatusBar style="light" backgroundColor={Colors.bg} />
            <TabNavigator />
          </NavigationContainer>
        </PotholeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0E1A' },
});
