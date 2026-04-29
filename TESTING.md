# PcD Application - Test Suite Documentation

## Overview

This test suite includes **10 comprehensive tests** (5 backend + 5 frontend) for the PcD PC Builder & Shop application.

---

## Backend Tests (`src/backend/__tests__/express.test.cjs`)

### Test 1: User Registration

- **Validates** new user registration with email, username, and password
- **Checks** for required fields (username, email, password)
- **Tests** email format validation

### Test 2: User Login

- **Verifies** user login with correct credentials
- **Tests** password length requirements (minimum 6 characters)
- **Checks** error handling for invalid login attempts

### Test 3: PC Build Management

- **Tests** saving PC builds with multiple components
- **Validates** component data structure (name, price_huf)
- **Checks** total price calculation accuracy

### Test 4: Order Placement

- **Tests** order creation with item details
- **Validates** order total matches sum of item prices
- **Checks** shipping address and order data integrity

### Test 5: Inventory Management (Admin)

- **Tests** adding new inventory items
- **Validates** price is positive number
- **Checks** complete item data (name, category, brand, specifications)

---

## Frontend Tests (`src/__tests__/components.test.js`)

### Test 1: Navigation Component

- **Displays** all navigation links (Kezdőlap, Bolt, PC építő, Raktárkészlet)
- **Shows** profile dropdown menu when logged in
- **Validates** correct menu items in dropdown

### Test 2: Login Form Validation

- **Tests** email format validation
- **Validates** password field requirements
- **Checks** error message display for invalid credentials

### Test 3: PC Builder Component

- **Calculates** total build price correctly
- **Tests** adding/removing components from build
- **Validates** component compatibility (socket types, etc.)

### Test 4: Shopping Cart Management

- **Tests** adding items to cart
- **Updates** item quantities
- **Calculates** cart totals correctly
- **Tests** removing items from cart
- **Handles** empty cart state

### Test 5: Saved Builds Management

- **Displays** list of user saved builds
- **Formats** dates correctly
- **Tests** build deletion with confirmation
- **Handles** empty builds list
- **Displays** build components in detail view

---

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Only Backend Tests

```bash
npm run test:backend
```

### Run Only Frontend Tests

```bash
npm run test:frontend
```

### Run Tests in Watch Mode (auto-rerun on changes)

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

---

## Test Configuration

- **Framework**: Jest + Vitest
- **Backend Testing**: Jest with Node environment
- **Frontend Testing**: Testing Library for Svelte components
- **Coverage Threshold**: 70% for branches, functions, lines, and statements
- **Setup File**: `jest.setup.js` - Global mocks for localStorage, fetch, etc.

---

## Coverage Goals

The test suite aims for:

- ✅ 70% branch coverage
- ✅ 70% function coverage
- ✅ 70% line coverage
- ✅ 70% statement coverage

---

## Test Scenarios Covered

| Feature             | Tested                         | Exam Points          |
| ------------------- | ------------------------------ | -------------------- |
| User Authentication | ✅ Register, Login             | API & Database       |
| PC Build Management | ✅ Create, Calculate, Delete   | Business Logic       |
| Shopping Cart       | ✅ Add, Remove, Calculate      | State Management     |
| Inventory           | ✅ Admin functions, Validation | Data Validation      |
| Navigation          | ✅ Menu display, Routing       | Frontend Logic       |
| Form Validation     | ✅ Email, Password, Fields     | Input Validation     |
| Saved Builds        | ✅ CRUD operations             | Database Integration |

---

## Expected Output

When running tests, you should see output similar to:

```
PASS  src/backend/__tests__/express.test.cjs
  PcD Backend API Tests
    ✓ User Registration (23ms)
    ✓ User Login (15ms)
    ✓ PC Build Management (10ms)
    ✓ Order Placement (18ms)
    ✓ Inventory Management (12ms)

PASS  src/__tests__/components.test.js
  PcD Frontend Component Tests
    ✓ Navigation Component (5ms)
    ✓ Login Form Validation (8ms)
    ✓ PC Builder Component (12ms)
    ✓ Shopping Cart (10ms)
    ✓ Saved Builds (14ms)

Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
Time:        2.345s
```

---

## Key Features Tested for Exam

1. **Authentication** - Secure user registration and login
2. **Data Validation** - Email format, password requirements, price validation
3. **Business Logic** - Price calculations, compatibility checks
4. **State Management** - Cart state, navigation state, form state
5. **Error Handling** - Invalid credentials, empty lists, network errors
6. **Database Integration** - Saves and retrieves data correctly
7. **Component Rendering** - UI displays correctly based on state
8. **User Interactions** - Form submissions, button clicks, navigation

---

## Notes for Exam

- These tests demonstrate understanding of **testing best practices**
- Tests cover **critical business functions** of the application
- Each test is **independent** and can run in any order
- Tests include **positive and negative scenarios**
- **100% coverage** is not required - focusing on important features shows good judgement
