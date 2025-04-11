import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { EntryCountProvider, useEntryCount } from './src/context/EntryCountContext';
import { TravelEntriesProvider } from './src/context/TravelEntriesContext';
import HomeScreen from './src/screens/HomeScreen';
import AddTravelEntryScreen from './src/screens/AddTravelEntryScreen';
import { View, Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator();

function Navigation() {
  const { theme } = useTheme();
  const { count } = useEntryCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                {count > 0 && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.badgeText, { color: theme.isDark ? '#000000' : '#ffffff' }]}>{count}</Text>
                  </View>
                )}
              </View>
            );
          } else if (route.name === 'Add') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.isDark ? '#3a383b' : '#e0e0e0',
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add" component={AddTravelEntryScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: 7,
    minWidth: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EntryCountProvider>
          <TravelEntriesProvider>
            <NavigationContainer>
              <Navigation />
            </NavigationContainer>
          </TravelEntriesProvider>
        </EntryCountProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
