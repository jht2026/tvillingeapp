import { Tabs } from "expo-router";
import { AppProvider } from "./context";

export default function RootLayout() {
  return (
    <AppProvider>
      <Tabs screenOptions={{
        tabBarActiveTintColor: '#534AB7',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: 'white', borderTopColor: '#E0E0E0' },
        headerShown: false,
      }}>
        <Tabs.Screen name="index" options={{ title: 'Log' }} />
        <Tabs.Screen name="idag" options={{ title: 'I dag' }} />
        <Tabs.Screen name="oversigt" options={{ title: 'Oversigt' }} />
        <Tabs.Screen name="indstillinger" options={{ title: 'Indstillinger' }} />
      </Tabs>
    </AppProvider>
  );
}