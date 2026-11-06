import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { AppLifecycleHandler } from './src/components/common/AppLifecycleHandler';
import { ToastProvider } from './src/components/ui/Toast';
import { GlobalModalContainer } from './src/components/ui/GlobalModal';
import { navigationRef } from './src/navigation/navigationRef';
import { NotificationNavigationHandler } from './src/navigation/NotificationNavigationHandler';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './src/navigation/types';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'hostelhive://',
    'http://localhost:8081',
    'exp://',
  ],
  config: {
    screens: {
      StudentApp: {
        initialRouteName: 'StudentTabs',
        screens: {
          Invoices: 'payments/:paymentStatus',
        },
      },
    },
  },
};

export default function App() {
  const [navigationVersion, setNavigationVersion] = useState(0);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppLifecycleHandler />
        <SafeAreaProvider>
          <ErrorBoundary>
            <ToastProvider>
              <NavigationContainer ref={navigationRef} linking={linking} onReady={() => setNavigationVersion((version) => version + 1)} onStateChange={() => setNavigationVersion((version) => version + 1)}>
                <StatusBar style="dark" />
                <RootNavigator />
                <GlobalModalContainer />
              </NavigationContainer>
              <NotificationNavigationHandler navigationVersion={navigationVersion} />
            </ToastProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
