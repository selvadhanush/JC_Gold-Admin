# JC Gold Admin - React Native Setup Guide

## ✅ Installation Complete!

Your React Native mobile app with NativeWind is now ready to use!

## 📱 What's Included

### Core Files
- ✅ **package.json** - All dependencies configured
- ✅ **app.json** - Expo configuration
- ✅ **babel.config.js** - Babel with NativeWind support
- ✅ **metro.config.js** - Metro bundler with NativeWind
- ✅ **tailwind.config.js** - Tailwind CSS configuration
- ✅ **tsconfig.json** - TypeScript configuration

### App Structure
- ✅ **app/_layout.tsx** - Root layout with navigation
- ✅ **app/index.tsx** - Home screen
- ✅ **app/dashboard.tsx** - Dashboard screen
- ✅ **app/products.tsx** - Products screen

### Reusable Components
- ✅ **components/Button.tsx** - Custom button component
- ✅ **components/Card.tsx** - Card component
- ✅ **components/Input.tsx** - Input component

### Utilities & Config
- ✅ **config/api.ts** - API endpoint configuration
- ✅ **utils/api.ts** - API service for HTTP requests
- ✅ **constants/theme.ts** - Design tokens and theme

### Assets
- ✅ **assets/icon.png** - App icon (generated)
- ✅ **assets/splash.png** - Splash screen (generated)
- ✅ **assets/adaptive-icon.png** - Android icon
- ✅ **assets/favicon.png** - Web favicon

## 🚀 Running the App

### Start Development Server
```bash
npm start
```

This will open Expo DevTools. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Press `w` to open in web browser
- Scan QR code with Expo Go app on your phone

### Platform-Specific Commands
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📱 Testing on Physical Device

1. Install **Expo Go** app from:
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android)
   - [Apple App Store](https://apps.apple.com/app/expo-go/id982107779) (iOS)

2. Run `npm start` in your terminal

3. Scan the QR code with:
   - **Android**: Expo Go app
   - **iOS**: Camera app (it will open in Expo Go)

## 🎨 NativeWind Usage

NativeWind allows you to use Tailwind CSS classes in React Native:

```tsx
import { View, Text } from 'react-native';

export default function Example() {
  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-gray-800">
        Hello World!
      </Text>
    </View>
  );
}
```

### Custom Colors Available
- **Primary**: `bg-primary-500`, `text-primary-600`, etc.
- **Gold**: `bg-gold-500`, `text-gold-600`, etc.

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```bash
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_ENV=development
```

### Connecting to Backend
The app is pre-configured to connect to your backend at `http://localhost:5000/api`.

To use the API service:
```tsx
import apiService from '../utils/api';

// GET request
const data = await apiService.get('/products');

// POST request
const result = await apiService.post('/products', { name: 'Gold Ring' });
```

## 📁 Project Structure

```
frontend/
├── app/                    # Screens (Expo Router)
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Home screen
│   ├── dashboard.tsx      # Dashboard
│   └── products.tsx       # Products
├── components/            # Reusable components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Input.tsx
├── config/               # Configuration files
│   └── api.ts           # API endpoints
├── utils/               # Utility functions
│   └── api.ts          # API service
├── constants/          # Constants & theme
│   └── theme.ts       # Design tokens
├── assets/           # Images & assets
└── ...config files
```

## 🐛 Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npx expo start -c
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript Errors
```bash
# Restart TypeScript server in VS Code
Ctrl+Shift+P > TypeScript: Restart TS Server
```

### NativeWind Not Working
Make sure:
1. `global.css` is imported in `app/_layout.tsx`
2. Metro bundler is configured correctly
3. Babel config includes NativeWind plugin

## 📚 Next Steps

1. **Add Authentication**
   - Create login/register screens
   - Implement JWT token storage
   - Add protected routes

2. **Connect to Backend**
   - Update API endpoints in `config/api.ts`
   - Implement data fetching in screens
   - Add loading states

3. **Add More Features**
   - Order management
   - Customer management
   - Analytics and reports
   - Push notifications

4. **Styling Enhancements**
   - Add animations with Reanimated
   - Implement dark mode
   - Add custom fonts

## 🎯 Key Features Implemented

✅ **Modern UI/UX** - Clean, professional design  
✅ **NativeWind** - Tailwind CSS for React Native  
✅ **Expo Router** - File-based navigation  
✅ **TypeScript** - Type-safe development  
✅ **API Service** - Ready for backend integration  
✅ **Reusable Components** - Button, Card, Input  
✅ **Custom Theme** - Orange/Gold color palette  
✅ **Error-Free Setup** - All configurations complete  

## 📖 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🆘 Need Help?

If you encounter any issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure your backend is running on port 5000
4. Clear Metro cache: `npx expo start -c`

---

**Happy Coding! 🚀**
