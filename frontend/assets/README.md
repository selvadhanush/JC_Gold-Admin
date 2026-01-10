# Assets Directory

This directory contains all the static assets for the JC Gold Admin mobile app.

## Required Assets

To run the app without warnings, you need to add the following files:

1. **icon.png** - App icon (1024x1024 PNG)
2. **splash.png** - Splash screen (1284x2778 PNG)
3. **adaptive-icon.png** - Android adaptive icon (1024x1024 PNG)
4. **favicon.png** - Web favicon (48x48 PNG)

## Generating Assets

You can use Expo's asset generation tools:

```bash
npx expo-asset
```

Or create them manually and place them in this directory.

## Temporary Solution

For development, you can create simple placeholder images or the app will use default Expo assets.
