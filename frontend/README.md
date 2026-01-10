# JC Gold Admin - React Native Mobile App

A modern, professional mobile application for managing JC Gold Admin operations, built with React Native, Expo Router, and NativeWind (Tailwind CSS for React Native).

## 🚀 Features

- **Modern UI/UX**: Clean, professional design with smooth animations
- **NativeWind Styling**: Tailwind CSS utility classes for React Native
- **Expo Router**: File-based routing for seamless navigation
- **TypeScript**: Type-safe development
- **Responsive Design**: Optimized for all screen sizes
- **Custom Components**: Reusable Button, Card, and Input components

## 📱 Screens

1. **Home Screen** (`app/index.tsx`)
   - Hero section with welcome message
   - Quick stats overview
   - Quick action cards for navigation

2. **Dashboard** (`app/dashboard.tsx`)
   - Key business metrics
   - Recent orders list
   - Quick action buttons

3. **Products** (`app/products.tsx`)
   - Product search functionality
   - Category filtering
   - Product inventory management

## 🛠️ Tech Stack

- **React Native**: 0.74.0
- **Expo**: ~51.0.0
- **Expo Router**: ~3.5.0
- **NativeWind**: ^4.0.1
- **TypeScript**: Latest
- **Tailwind CSS**: ^3.4.0

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on specific platform:
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 🎨 Styling with NativeWind

This project uses NativeWind v4, which brings Tailwind CSS to React Native. You can use Tailwind utility classes directly in your components:

```tsx
<View className="bg-white rounded-2xl p-5 shadow-sm">
  <Text className="text-lg font-bold text-gray-800">
    Hello World
  </Text>
</View>
```

### Custom Colors

The project includes custom color palettes:

- **Primary**: Orange shades (50-900)
- **Gold**: Gold/yellow shades (50-900)

## 📁 Project Structure

```
frontend/
├── app/
│   ├── _layout.tsx          # Root layout with navigation
│   ├── index.tsx            # Home screen
│   ├── dashboard.tsx        # Dashboard screen
│   └── products.tsx         # Products screen
├── components/
│   ├── Button.tsx           # Reusable button component
│   ├── Card.tsx             # Reusable card component
│   └── Input.tsx            # Reusable input component
├── assets/                  # Images and other assets
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── metro.config.js          # Metro bundler configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── global.css               # Global styles
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🔧 Configuration Files

### babel.config.js
Configured with NativeWind and Reanimated plugins for optimal performance.

### metro.config.js
Integrated with NativeWind for CSS processing.

### tailwind.config.js
Custom theme with primary and gold color palettes.

## 📝 Development Notes

- All screens use NativeWind for styling
- TypeScript is enabled for type safety
- Expo Router handles navigation automatically
- Components are designed to be reusable and customizable

## 🎯 Next Steps

1. Connect to backend API (running on port 5000)
2. Implement authentication
3. Add real-time data fetching
4. Implement state management (Redux/Zustand)
5. Add push notifications
6. Implement offline support

## 🤝 Contributing

This is a private project for JC Gold Admin. For any changes, please create a feature branch and submit for review.

## 📄 License

Private - All rights reserved
