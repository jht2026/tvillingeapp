import { Tabs } from "expo-router";
import { AppProvider } from "./context";

export default function RootLayout() {
  return (
    <AppProvider>
      <Tabs screenOptions={{
        tabBarActiveTintColor: '#2C1810',
        tabBarInactiveTintColor: '#B5A090',
        tabBarStyle: { 
          backgroundColor: '#FDF8F3', 
          borderTopColor: '#EDE5DC',
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.3,
        },
        headerShown: false,
      }}>
        <Tabs.Screen name="index" options={{ title: 'Log' }} />
        <Tabs.Screen name="idag" options={{ title: 'I dag' }} />
        <Tabs.Screen name="oversigt" options={{ title: 'Oversigt' }} />
        <Tabs.Screen name="sync" options={{ title: 'Sync' }} />
        <Tabs.Screen name="indstillinger" options={{ title: '⚙️' }} />
        <Tabs.Screen name="store" options={{ href: null }} />
        <Tabs.Screen name="context" options={{ href: null }} />
        <Tabs.Screen name="firebase" options={{ href: null }} />
      </Tabs>
    </AppProvider>
  );
}