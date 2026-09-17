import { StatusBar } from 'expo-status-bar';
import { createElement, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

const HEXAGON_URL = 'https://syntheticsix.com';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = () => {
    setFailed(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  const handleNavigation = (event: WebViewNavigation) => {
    if (!event.url.startsWith(HEXAGON_URL)) return false;
    return true;
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.frame}>
        {Platform.OS === 'web' ? (
          createElement('iframe', {
            src: HEXAGON_URL,
            title: 'The Hexagon',
            style: styles.iframe,
            onLoad: () => setLoading(false),
          })
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: HEXAGON_URL }}
            style={styles.webview}
            originWhitelist={[HEXAGON_URL]}
            allowsBackForwardNavigationGestures
            javaScriptEnabled
            domStorageEnabled
            pullToRefreshEnabled
            sharedCookiesEnabled
            setSupportMultipleWindows={false}
            onLoadStart={() => {
              setLoading(true);
              setFailed(false);
            }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
            onShouldStartLoadWithRequest={handleNavigation}
          />
        )}

        {loading && !failed ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#2dd4bf" />
            <Text style={styles.overlayText}>Opening The Hexagon</Text>
          </View>
        ) : null}

        {failed ? (
          <View style={styles.overlay}>
            <Text style={styles.title}>The council could not open.</Text>
            <Text style={styles.body}>
              Check your connection, then try again.
            </Text>
            <Pressable style={styles.button} onPress={reload}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050607',
  },
  frame: {
    flex: 1,
    backgroundColor: '#050607',
  },
  webview: {
    flex: 1,
    backgroundColor: '#050607',
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#050607',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 28,
    backgroundColor: '#050607',
  },
  overlayText: {
    color: '#8aa2ac',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f1efe8',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#9aa7ad',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#2dd4bf',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#2dd4bf',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
});
