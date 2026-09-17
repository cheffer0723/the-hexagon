# The Hexagon Mobile

Expo SDK 57 mobile shell for The Hexagon.

## Current Target

- App name: The Hexagon
- EAS project: `@critical-mass-lab/EXPO-MOBILE`
- EAS project ID: `4dc9a712-137b-42a9-abad-55b94e3ea0b9`
- iOS bundle ID: `com.syntheticsix.hexagon`
- Web target: `https://syntheticsix.com`

## Local Checks

```powershell
npx tsc --noEmit
npx expo-doctor
npx expo config --type public
```

## EAS Build

Preview/internal and production builds are configured in `eas.json`.

```powershell
npm run build:ios:preview
npm run build:ios:production
```

The first iOS cloud build currently needs interactive Apple credential setup.
The non-interactive attempts reached EAS credentials and stopped because there
was no suitable internal distribution credential and no configured distribution
certificate for production builds.
