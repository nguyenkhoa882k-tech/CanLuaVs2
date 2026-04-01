import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeScreen } from '../screens/HomeScreen';
import { BuyerDetailScreen } from '../screens/BuyerDetailScreen';
import { WeighingScreen } from '../screens/WeighingScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { CollectionScreen } from '../screens/CollectionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TareSettingsScreen } from '../screens/TareSettingsScreen';
import { InputFormatScreen } from '../screens/InputFormatScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="BuyerDetail" component={BuyerDetailScreen} />
      <Stack.Screen
        name="Weighing"
        component={WeighingScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const StatsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatsMain" component={StatsScreen} />
      <Stack.Screen name="BuyerDetail" component={BuyerDetailScreen} />
      <Stack.Screen
        name="Weighing"
        component={WeighingScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="TareSettings" component={TareSettingsScreen} />
      <Stack.Screen name="InputFormat" component={InputFormatScreen} />
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
            return {
              tabBarLabel: 'Tổng quan',
              tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} />,
              tabBarStyle:
                routeName === 'Weighing'
                  ? { display: 'none' }
                  : {
                      backgroundColor: colors.white,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingBottom: 8,
                      paddingTop: 8,
                      height: 60,
                    },
            };
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsStack}
          options={({ route }) => {
            const routeName =
              getFocusedRouteNameFromRoute(route) ?? 'StatsMain';
            return {
              tabBarLabel: 'Thống kê',
              tabBarIcon: ({ color }) => <Icon name="chart-bar" size={24} color={color} />,
              tabBarStyle:
                routeName === 'Weighing'
                  ? { display: 'none' }
                  : {
                      backgroundColor: colors.white,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      paddingBottom: 8,
                      paddingTop: 8,
                      height: 60,
                    },
            };
          }}
        />
        <Tab.Screen
          name="Collection"
          component={CollectionScreen}
          options={{
            tabBarLabel: 'Thu chi',
            tabBarIcon: ({ color }) => <Icon name="cash-multiple" size={24} color={color} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            tabBarLabel: 'Cài đặt',
            tabBarIcon: ({ color }) => <Icon name="cog" size={24} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
