# Scheme System Architecture

This document provides a comprehensive explanation of how the "Schemes" section works in the JC Gold Admin application, covering both the frontend interface and the backend logic.

## 1. Overview
The Schemes module allows users to:
1.  **Explore**: View available gold savings schemes defined by the platform.
2.  **Enroll**: Sign up for a scheme with a custom monthly installment amount.
3.  **Track**: Monitor their active schemes, paid installments, and maturity progress.
4.  **Pay**: Make monthly installment payments via online methods (Razorpay).

---

## 2. Backend Architecture

### Data Models
The system relies on two primary Mongoose models:

#### A. `Scheme` (The Plan Definition)
Defines the template for a savings plan.
-   **Fields**: `name`, `description`, `durationMonths`, `minMonthlyAmount`, `benefitPercentage`, `isActive`.
-   **Purpose**: Stores the rules of the scheme (e.g., "11-month plan with 5% bonus").

#### B. `UserScheme` (The User's Enrollment)
Represents a specific user's participation in a scheme.
-   **Fields**:
    -   `user`: Link to the buyer.
    -   `scheme`: Link to the parent `Scheme`.
    -   `monthlyInstallment`: The amount the user agreed to pay monthly.
    -   `totalInstallments`: derived from `scheme.durationMonths`.
    -   `paidInstallments`: Counter of successful payments.
    -   `totalAmountPaid`: Sum of all payments.
    -   `benefitsEarned`: Accumulated bonus value.
    -   `status`: `ACTIVE`, `COMPLETED`, `LAPSED`, etc.
    -   `maturityDate`: Calculated at enrollment (`startDate` + `durationMonths`).

### API Endpoints & Logic
Located in `src/controllers/buyer/scheme.controller.js`.

| Action | Endpoint | Logic Highlights |
| :--- | :--- | :--- |
| **List Available** | `GET /api/v1/buyer/schemes` | Fetches all schemes where `isActive: true`. Sorted by name. |
| **List My Plans** | `GET /api/v1/buyer/my-schemes` | Fetches `UserScheme` records for the logged-in user, populating the parent `Scheme` details. |
| **Enroll** | `POST .../:id/enroll` | 1. Validates `monthlyInstallment` >= `minMonthlyAmount`.<br>2. Checks if user is *already* active in this scheme (prevents duplicates).<br>3. Calculates `maturityDate`.<br>4. Creates a new `UserScheme` record.<br>5. Sets status to `ACTIVE`. |
| **Pay Installment** | `POST .../installment` | 1. Verifies user ownership and that scheme is `ACTIVE`.<br>2. Creates a `Payment` record (transaction log).<br>3. Creates an `Installment` record (schedule tracking).<br>4. Updates `UserScheme`: increments `paidInstallments`, adds to `totalAmountPaid`, calculates `benefitsEarned`.<br>5. **Auto-Completion**: If `paidInstallments` >= `totalInstallments`, sets status to `COMPLETED`. |

---

## 3. Frontend Architecture
Located in `app/schemes.tsx`.

### State Management
The screen uses a `useState` driven tab system:
-   **Explore Tab**: Shows `availableSchemes` fetched from the backend.
-   **Vault (My) Tab**: Shows `mySchemes` (user's enrollments).
-   **Logic**: If `mySchemes` is empty on load, it automatically switches to the "Explore" tab to encourage enrollment.

### Key Features

#### 1. Enrollment Flow
-   **Trigger**: User taps a scheme in "Explore" tab.
-   **UI**: Opens `showEnrollModal` displaying scheme details and input for "Monthly Deposit".
-   **Validation**: Prevents submission if the entered amount is less than the scheme's `minMonthlyAmount`.
-   **Action**: Calls `handleEnroll`, which hits the **Enroll API**. On success, toasts "Successfully enrolled!" and refreshes data.

#### 2. Payment Flow
-   **Trigger**: "Pay Installment" button on an active scheme card.
-   **Integration**: Uses **Razorpay**.
-   **Step 1 (Order Creation)**: Calls `handlePayInstallment`. This hits the backend `BUYER_RAZORPAY_ORDER` endpoint to create an order ID.
-   **Step 2 (User Interaction)**: Opens `RazorpayModal`. User completes payment.
-   **Step 3 (Verification)**: `verifyPayment` sends the payment signature to the backend `BUYER_RAZORPAY_VERIFY`.
-   **Result**: Backend confirms payment -> updates `UserScheme` -> Frontend refreshes data to show progress bar update.

#### 3. Visuals & UX
-   **Progress Bars**: Visual representation of `paidInstallments` / `totalInstallments`.
-   **Status Badges**: Green specific badges for 'ACTIVE' status.
-   **Skeletons**: Loading states while fetching data.
-   **Pull-to-Refresh**: Allows users to manually sync their data.

## Summary of Data Flow
1.  **Admin** creates a `Scheme` (e.g., "Gold Plus").
2.  **User** sees "Gold Plus" in App -> Enters ₹5000/month -> Backend creates `UserScheme`.
3.  **User** pays ₹5000 -> Backend records `Payment` & `Installment` -> Updates `UserScheme` progress.
4.  **Frontend** updates progress bar to show "1/11 Paid".
