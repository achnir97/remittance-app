// ─── Global mocks ────────────────────────────────────────────────
// IMPORTANT: jest.mock factories are hoisted — do NOT require()
// modules that trigger nativewind/CSS-interop Babel transforms.
// Use plain strings for component stubs.

// @expo/vector-icons — stub icons as plain view names
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
}));

// expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    loadAsync: jest.fn(),
    fromModule: jest.fn(() => ({ uri: 'mock-uri', downloadAsync: jest.fn() })),
  },
}));

// expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

// expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  Link: 'Link',
  Stack: { Screen: 'Screen' },
}));

// expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

// expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// expo-constants
jest.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.0.0' } },
}));

// expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));

// expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));

// @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// react-native-safe-area-context — stub containers as plain view names
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: 'SafeAreaProvider',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// nativewind
jest.mock('nativewind', () => ({ styled: (c) => c }));

// i18n — return key as translation in tests
jest.mock('./locales/i18n', () => ({
  i18n: { t: (key) => key, locale: 'en' },
  normalizeLocale: (l) => l,
  SUPPORTED_LOCALES: ['en'],
}));
