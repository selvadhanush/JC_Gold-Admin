# 🛡️ JC Gold Super Admin Manual

Welcome to the **Command Centre**. This document outlines the administrative architecture and capabilities implemented for the Super Admin role.

## 🚀 Unified Access
The Super Admin uses the same login interface as regular admins and buyers. The system automatically detects your clearance level and redirects you to the **highest authority dashboard**.

*   **Endpoint:** `/Superadmin`
*   **Security:** Fully authorized with JWT protection and role-gating.

---

## 🏗️ Core Modules

### 1. Command Centre (Dashboard)
The primary overview of the system's live pulse.
- **Live Network Pulse:** Real-time metrics for Total Administrators, Active Buyers, and Security Logs.
- **System Architecture:** Direct link to the **Module Console** (Product/Order management).
- **Authority Banner:** Confirmation of authorized personnel status.

### 2. Personnel (Admin Management)
The master registry of system officials.
- **Commissioning:** Create new administrator accounts with specialized roles.
- **Clearance Levels:** Assign roles like `PRODUCT_ADMIN`, `ORDER_ADMIN`, or `FINANCE_ADMIN`.
- **Access Control:** Suspend or Terminate administrative access instantly.

### 3. Buyer Registry (User Management)
Full visibility into the customer ecosystem.
- **Verified Identities:** Search and filter through the master buyer index.
- **Dossiers:** View deep-dive details of a customer, including their acquisition history and active schemes.
- **Security:** Ability to block/active customer accounts.

### 4. Forensics (Audit Trail)
A tamper-proof ledger of all administrative activity.
- **Trace Logs:** Every action taken by any administrator is recorded (e.g., "Updated Product", "Deleted Order").
- **Forensic Data:** Captures the Admin Identity, Module affected, Action taken, IP Address, and Precise Timestamp.
- **Security Audits:** Review logs to ensure system integrity and accountability.

---

## 🎨 Design Philosophy
The Super Admin UI follows a **"State-of-the-Art"** aesthetic:
- **Glassmorphism:** Using `BlurView` for premium, transparent navigation elements.
- **Typography:** Deep black, heavy-weight fonts for authority and tracking-heavy uppercase for secondary labels.
- **Color Palette:** Professional Indigo (`#6366f1`) for authority, Emerald for health, and Slate for structure.
- **Bottom Navigation:** Fixed floating navigation bar for rapid switching between governance modules.

---

## 🔐 Security Protocols
- **Credential Storage:** Tokens are secured in `expo-secure-store`.
- **API Gating:** Backend routes for `admin-management`, `users`, and `audit` are strictly locked to `SUPER_ADMIN` role only.
- **Seeder:** The system includes an automatic seeder (`backend/seeder.js`) to ensure a master account (`adminEmail@gmail.com`) is always available.
