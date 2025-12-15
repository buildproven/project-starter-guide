# Mobile App Starter Template

A React Native Expo starter template with TypeScript, navigation, and essential mobile app features.

**Complexity Level:** 2 | **Timeline:** 2-3 days | **Tech Stack:** React Native + Expo + TypeScript

> Need the one-page checklist? Use the commands below as your quick start.

## Features

- 📱 **React Native** with Expo SDK for cross-platform development
- 🔷 **TypeScript** for type safety and better development experience
- 🧭 **React Navigation** for screen navigation
- 🎨 **Modern UI** with consistent styling
- 📱 **Safe Area Support** for modern devices
- ✅ **ESLint** configuration for code quality
- 🧪 **Jest** testing setup
- 🚀 **EAS Build** ready for app store deployment

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Copy Environment Variables**

   ```bash
   cp .env.example .env
   ```

3. **Setup Quality Automation** (Recommended)

   ```bash
   # Add comprehensive quality automation
   npx create-qa-architect@latest
   npm install && npm run prepare

   # React Native + TypeScript quality checks
   npm run lint        # ESLint for React Native + TypeScript
   npm run format      # Prettier for JSX/TypeScript
   npm run security:audit  # Mobile security vulnerability scanning
   ```

4. **Start Development Server**

   ```bash
   npm start
   ```

5. **Run on Device/Simulator**

   ```bash
   # iOS Simulator
   npm run ios

   # Android Emulator
   npm run android

   # Web Browser
   npm run web
   ```

6. **Scan QR Code** with Expo Go app on your device

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/             # App screens
│   │   ├── HomeScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/          # Reusable components
│   ├── types/               # TypeScript type definitions
│   │   └── navigation.ts
│   └── utils/               # Utility functions
├── App.tsx                  # App entry point
├── package.json
└── README.md
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Building for Production

### Expo Application Services (EAS)

1. **Install EAS CLI**

   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**

   ```bash
   eas build:configure
   ```

3. **Build for Android**

   ```bash
   npm run build:android
   ```

4. **Build for iOS**
   ```bash
   npm run build:ios
   ```

## Customization

### 1. App Configuration

Add an Expo configuration file (`app.config.ts` or `app.json`) to customize:

- App name and description
- Icon and splash screen
- App store information
- Permissions

### 2. Navigation

Add new screens in `src/screens/` and register them in `App.tsx`:

```typescript
<Stack.Screen
  name="NewScreen"
  component={NewScreen}
  options={{ title: 'New Screen' }}
/>
```

### 3. Styling

The template uses StyleSheet for consistent styling:

- Colors: Update color palette in styles
- Typography: Consistent font sizes and weights
- Spacing: Standardized padding and margins

### 4. Components

Create reusable components in `src/components/`:

```typescript
// src/components/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
}

export default function Button({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}
```

## Adding Features

### State Management

For complex state, add Redux Toolkit or Zustand:

```bash
npm install @reduxjs/toolkit react-redux
```

### API Integration

Add Axios or fetch for API calls:

```bash
npm install axios
```

### Push Notifications

Add Expo Notifications:

```bash
expo install expo-notifications
```

### Local Storage

Add AsyncStorage:

```bash
expo install @react-native-async-storage/async-storage
```

### Camera

Add Expo Camera:

```bash
expo install expo-camera
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test
npm test -- App.test.tsx
```

The template includes starter tests in `__tests__/` that verify the navigation shell and profile screen layout. Use them as a reference when adding new screens.

### Continuous Integration

Use the example workflow at `.github/workflows/ci.yml` to wire linting and tests into GitHub Actions.

### Example Test

```typescript
// __tests__/HomeScreen.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../src/screens/HomeScreen';

const mockNavigation = {
  navigate: jest.fn(),
} as any;

test('renders welcome message', () => {
  const { getByText } = render(<HomeScreen navigation={mockNavigation} />);
  expect(getByText('Welcome to Your App')).toBeTruthy();
});
```

## Deployment

### App Store (iOS)

1. Build with EAS: `npm run build:ios`
2. Submit to App Store: `npm run submit:ios`
3. Complete App Store Connect setup

### Google Play Store (Android)

1. Build with EAS: `npm run build:android`
2. Submit to Play Store: `npm run submit:android`
3. Complete Play Console setup

## Performance Tips

1. **Optimize Images**: Use appropriate image formats and sizes
2. **Lazy Loading**: Load screens and components when needed
3. **Memory Management**: Properly cleanup listeners and subscriptions
4. **Bundle Size**: Use metro-bundler analysis to optimize
5. **Navigation**: Use lazy loading for screens

## Common Issues

### Metro Bundler Issues

```bash
# Clear cache
npx expo start --clear

# Reset metro cache
npx expo start --reset-cache
```

### iOS Simulator Issues

```bash
# Reset iOS Simulator
xcrun simctl erase all
```

### Android Emulator Issues

```bash
# Cold boot emulator
emulator -avd YOUR_AVD_NAME -cold-boot
```

## Expo SDK Features

The template is ready to use Expo SDK features:

- **Camera**: expo-camera
- **Location**: expo-location
- **Notifications**: expo-notifications
- **File System**: expo-file-system
- **Media Library**: expo-media-library
- **Contacts**: expo-contacts

## TypeScript Support

Full TypeScript support with:

- Type definitions for navigation
- Strict type checking
- IntelliSense support
- Type-safe props and state

## Troubleshooting

### Husky ".git can't be found" Warning

**Issue:** During `npm install`, you see `.git can't be found`

**Cause:** You copied the template files instead of cloning with git

**Fix:**
```bash
git init
git add .
git commit -m "Initial commit"
npm install  # Re-run to set up git hooks
```

**Impact:** None - this only affects git hooks setup. The app works fine without git hooks.

---

### npm Audit Vulnerabilities

**Issue:** `npm install` reports 48 vulnerabilities (7 low, 31 moderate, 10 high)

**Status:** ✅ **Expected and documented**

**Details:**
- All vulnerabilities reviewed and documented in `.security-waivers.json`
- 12 production vulnerabilities are React Native ecosystem dependencies
- Security team has assessed and waived these for the mobile development context

**Action:**
1. Review `.security-waivers.json` for rationale
2. Run `npm audit` to see specific packages
3. Update dependencies as the React Native ecosystem matures
4. See `SECURITY.md` for our security policy

**Do NOT run** `npm audit fix --force` - this may break React Native compatibility

---

### Slow npm install (5+ minutes)

**Issue:** `npm install` takes 5-13 minutes

**Cause:** React Native has a large dependency tree (~1,800 packages)

**Status:** ✅ **Expected for React Native projects**

**Tips to speed up:**
```bash
# Use npm ci for faster installs (requires package-lock.json)
npm ci

# Enable caching in CI/CD
# See .github/workflows/ci.yml for GitHub Actions caching example
```

**Expected times:**
- **First install:** 5-10 minutes
- **With cache:** 1-2 minutes
- **npm ci:** 3-5 minutes

---

### Metro Bundler Cache Issues

**Issue:** App not updating or showing old code

**Fix:**
```bash
# Clear Expo cache
npx expo start --clear

# Reset metro bundler cache
npx expo start --reset-cache

# Nuclear option - clear all caches
rm -rf node_modules .expo .expo-shared
npm install
npx expo start --clear
```

---

### iOS Simulator Not Starting

**Issue:** `npm run ios` fails or simulator doesn't launch

**Fixes:**
```bash
# Reset all simulators
xcrun simctl erase all

# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 15 Pro"

# Open simulator manually
open -a Simulator
```

---

### Android Emulator Issues

**Issue:** `npm run android` fails to connect to emulator

**Fixes:**
```bash
# List running emulators
adb devices

# Restart adb server
adb kill-server && adb start-server

# Cold boot emulator (reset state)
emulator -avd YOUR_AVD_NAME -cold-boot

# Check if emulator is running
emulator -list-avds
```

---

### TypeScript Errors in Tests

**Issue:** ESLint warnings about `@typescript-eslint/no-explicit-any`

**Status:** ✅ **Acceptable in test files**

**Why:** Test mocks often use `any` for navigation, props, and callbacks

**Fix (optional):**
```typescript
// Instead of:
const mockNavigation = {} as any;

// Use proper typing:
import { NavigationProp } from '@react-navigation/native';
const mockNavigation: Partial<NavigationProp<any>> = {
  navigate: jest.fn(),
};
```

---

### Expo Go Connection Issues

**Issue:** QR code scanning doesn't connect to dev server

**Fixes:**
1. **Check network:** Phone and computer must be on same WiFi
2. **Disable VPN:** VPNs can block local network connections
3. **Try tunnel mode:**
   ```bash
   npx expo start --tunnel
   ```
4. **Manual connection:** In Expo Go app, manually enter your computer's IP:
   ```
   exp://192.168.1.XXX:8081
   ```

---

### Build Errors with EAS

**Issue:** `eas build` fails with unclear errors

**Common fixes:**
```bash
# Ensure EAS CLI is up to date
npm install -g eas-cli@latest

# Clear EAS cache
eas build --clear-cache

# Check app.json configuration
# Ensure all required fields are present

# Verify credentials
eas credentials
```

---

### Performance Issues

**Issue:** App feels slow or laggy

**Diagnostic steps:**
1. **Enable performance monitor:**
   - Shake device → "Show Performance Monitor"
   - Look for dropped frames (should be 60 FPS)

2. **Check bundle size:**
   ```bash
   npx expo-doctor
   ```

3. **Optimize images:**
   - Use appropriate formats (WebP for photos, PNG for icons)
   - Compress images before bundling
   - Lazy load large images

4. **Profile with Flipper:**
   - Install Flipper
   - Connect to app
   - Monitor render times and memory

---

### Environment Variables Not Loading

**Issue:** `.env` values not accessible in app

**Fix:**
```bash
# Expo uses .env differently than web apps
# Install expo-constants
expo install expo-constants

# Access variables:
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

**Note:** Restart dev server after changing `.env` file

---

### Common Dependency Conflicts

**Issue:** Peer dependency warnings during install

**Fix:**
```bash
# Use --legacy-peer-deps for compatibility
npm install --legacy-peer-deps

# Or update to compatible versions
npm install expo@latest
```

---

### Still Having Issues?

1. **Check Expo documentation:** https://docs.expo.dev
2. **Search GitHub issues:** https://github.com/expo/expo/issues
3. **Ask on Discord:** https://discord.gg/expo
4. **Review validation results:** See `claudedocs/fresh-clone-validation-results.md`

**Need more help?** Open an issue with:
- Node version (`node --version`)
- npm version (`npm --version`)
- Expo version (`expo --version`)
- Operating system
- Full error message
- Steps to reproduce

## License

MIT License - free to use for personal and commercial projects.
