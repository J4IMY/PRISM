import React, { createContext, useContext, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './screens/auth/LoginScreen';
import SignupScreen from './screens/auth/SignupScreen';
import ForgotScreen from './screens/auth/ForgotScreen';
import ResetScreen from './screens/auth/ResetScreen';

import DiscoveryScreen from './screens/discovery/DiscoveryScreen';
import SystemDetailScreen from './screens/discovery/SystemDetailScreen';
import CompareScreen from './screens/discovery/CompareScreen';
import WatchlistScreen from './screens/discovery/WatchlistScreen';

import ProfileScreen from './screens/account/ProfileScreen';
import SettingsScreen from './screens/account/SettingsScreen';

import VendorDashboard from './screens/vendor/VendorDashboard';
import VendorCompany from './screens/vendor/VendorCompany';
import VendorTeam from './screens/vendor/VendorTeam';
import VendorInbox from './screens/vendor/VendorInbox';
import VendorSystems from './screens/vendor/VendorSystems';
import VendorSystemEdit from './screens/vendor/VendorSystemEdit';

import AdminDashboard from './screens/admin/AdminDashboard';
import AdminScraper from './screens/admin/AdminScraper';
import AdminDeletions from './screens/admin/AdminDeletions';
import AdminModerators from './screens/admin/AdminModerators';
import AdminVendors from './screens/admin/AdminVendors';
import AdminAudit from './screens/admin/AdminAudit';

import ModeratorDashboard from './screens/moderator/ModeratorDashboard';
import ModeratorQueue from './screens/moderator/ModeratorQueue';
import ModeratorItem from './screens/moderator/ModeratorItem';

export type Role = 'buyer' | 'vendor' | 'moderator' | 'admin' | null;
type AuthCtx = { role: Role; setRole: (r: Role) => void; signOut: () => void };
const AuthContext = createContext<AuthCtx>({ role: null, setRole: () => {}, signOut: () => {} });
export const useAuth = () => useContext(AuthContext);

const AuthStack = createNativeStackNavigator();
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="Forgot" component={ForgotScreen} />
      <AuthStack.Screen name="Reset" component={ResetScreen} />
    </AuthStack.Navigator>
  );
}

const DiscoveryStack = createNativeStackNavigator();
function DiscoveryNavigator() {
  return (
    <DiscoveryStack.Navigator>
      <DiscoveryStack.Screen name="Discovery" component={DiscoveryScreen} options={{ title: 'Discover' }} />
      <DiscoveryStack.Screen name="SystemDetail" component={SystemDetailScreen} options={{ title: 'System' }} />
      <DiscoveryStack.Screen name="Compare" component={CompareScreen} />
    </DiscoveryStack.Navigator>
  );
}

const AccountStack = createNativeStackNavigator();
function AccountNavigator() {
  return (
    <AccountStack.Navigator>
      <AccountStack.Screen name="Profile" component={ProfileScreen} />
      <AccountStack.Screen name="Settings" component={SettingsScreen} />
    </AccountStack.Navigator>
  );
}

const Tabs = createBottomTabNavigator();
function BuyerTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            DiscoveryTab: 'search', WatchlistTab: 'heart-outline',
            CompareTab: 'git-compare-outline', AccountTab: 'person-circle-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="DiscoveryTab" component={DiscoveryNavigator} options={{ title: 'Discover' }} />
      <Tabs.Screen name="WatchlistTab" component={WatchlistScreen} options={{ title: 'Watchlist' }} />
      <Tabs.Screen name="CompareTab" component={CompareScreen} options={{ title: 'Compare' }} />
      <Tabs.Screen name="AccountTab" component={AccountNavigator} options={{ title: 'Account' }} />
    </Tabs.Navigator>
  );
}

const VendorDrawer = createDrawerNavigator();
function VendorNavigator() {
  return (
    <VendorDrawer.Navigator>
      <VendorDrawer.Screen name="Overview" component={VendorDashboard} />
      <VendorDrawer.Screen name="Company" component={VendorCompany} />
      <VendorDrawer.Screen name="Team" component={VendorTeam} />
      <VendorDrawer.Screen name="Inbox" component={VendorInbox} />
      <VendorDrawer.Screen name="Systems" component={VendorSystems} />
      <VendorDrawer.Screen name="SystemEdit" component={VendorSystemEdit} options={{ drawerItemStyle: { display: 'none' } }} />
    </VendorDrawer.Navigator>
  );
}

const AdminDrawer = createDrawerNavigator();
function AdminNavigator() {
  return (
    <AdminDrawer.Navigator>
      <AdminDrawer.Screen name="Dashboard" component={AdminDashboard} />
      <AdminDrawer.Screen name="Scraper Queue" component={AdminScraper} />
      <AdminDrawer.Screen name="Deletions" component={AdminDeletions} />
      <AdminDrawer.Screen name="Moderators" component={AdminModerators} />
      <AdminDrawer.Screen name="Vendors" component={AdminVendors} />
      <AdminDrawer.Screen name="Audit Log" component={AdminAudit} />
    </AdminDrawer.Navigator>
  );
}

const ModStack = createNativeStackNavigator();
function ModeratorNavigator() {
  return (
    <ModStack.Navigator>
      <ModStack.Screen name="ModDashboard" component={ModeratorDashboard} options={{ title: 'Moderator' }} />
      <ModStack.Screen name="Queue" component={ModeratorQueue} />
      <ModStack.Screen name="Item" component={ModeratorItem} />
    </ModStack.Navigator>
  );
}

const RootStack = createNativeStackNavigator();
export default function App() {
  const [role, setRole] = useState<Role>(null);
  const ctx = useMemo<AuthCtx>(() => ({ role, setRole, signOut: () => setRole(null) }), [role]);

  return (
    <AuthContext.Provider value={ctx}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!role && <RootStack.Screen name="Auth" component={AuthNavigator} />}
          {role === 'buyer' && <RootStack.Screen name="Buyer" component={BuyerTabs} />}
          {role === 'vendor' && <RootStack.Screen name="Vendor" component={VendorNavigator} />}
          {role === 'admin' && <RootStack.Screen name="Admin" component={AdminNavigator} />}
          {role === 'moderator' && <RootStack.Screen name="Moderator" component={ModeratorNavigator} />}
        </RootStack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
