# Jewellery Admin Frontend

A premium, production-ready administrative dashboard for the Thangamayil Jewellery management system.

## Tech Stack

- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS (Custom Premium Gold Design System)
- **Icons**: Lucide React
- **Charts**: Chart.js / React-Chartjs-2
- **State**: React Context API (Auth)
- **HTTP**: Axios with Interceptors
- **Notifications**: React Toastify

## Features

- **Authentication**: Secure login and role-based access control.
- **Analytics**: Real-time business metrics and sales trends.
- **Product Management**: Multi-image upload and jewellery specifications.
- **Order Processing**: Lifecycle tracking and invoice handling.
- **Saving Schemes**: Enrollment tracking and installment management.
- **Payment Monitoring**: Transaction history and refund processing.
- **CMS**: Dynamic banner and content management.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Folder Structure

- `src/components/layout`: Sidebar, Navbar, and MainLayout.
- `src/pages/`: Feature-specific modules (Auth, Dashboard, Products, etc.).
- `src/services/`: API service layer using Axios.
- `src/store/`: Context API for global state.
- `src/styles/`: Theme tokens and global styles.
