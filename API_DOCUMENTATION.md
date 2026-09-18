# R.P. Enterprises — REST API Documentation

This document provides complete documentation for the REST API endpoints of **R.P. Enterprises**.

---

## 🔑 1. Authentication APIs (`/api/auth/`)

### 1.1 Customer Registration
- **URL**: `/api/auth/register/`
- **Method**: `POST`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "name": "Rahul Sharma",
    "mobile_number": "9876543210",
    "address": "Block B, Industrial Area, Kanpur",
    "password": "Password123",
    "confirm_password": "Password123"
  }
  ```
- **Response** (`201 Created`): Returns JWT access & refresh tokens and user profile.

### 1.2 Customer Login
- **URL**: `/api/auth/login/`
- **Method**: `POST`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "mobile_number": "9876543210",
    "password": "Password123"
  }
  ```
- **Response** (`200 OK`): Returns JWT access & refresh tokens.

### 1.3 Token Refresh
- **URL**: `/api/auth/token/refresh/`
- **Method**: `POST`
- **Auth**: None (Public)
- **Request Body**: `{"refresh": "<refresh_token>"}`
- **Response** (`200 OK`): Returns new access token.

### 1.4 Profile View & Update
- **URL**: `/api/auth/profile/`
- **Method**: `GET`, `PUT`
- **Auth**: Required (`IsAuthenticated`)
- **Response** (`200 OK`): Customer profile details.

---

## 🏷️ 2. Category APIs (`/api/categories/`)

### 2.1 List Categories
- **URL**: `/api/categories/`
- **Method**: `GET`
- **Auth**: Public (`IsAdminOrReadOnly`)
- **Response** (`200 OK`): Array of active categories.

### 2.2 Create Category (Admin Only)
- **URL**: `/api/categories/`
- **Method**: `POST`
- **Auth**: Staff Only (`IsAdminUser`)
- **Request Body**: `{"name": "Disposable Plates", "category_type": "DISPOSABLE", "description": "Finished plates"}`

---

## 📦 3. Product APIs (`/api/products/`)

### 3.1 List Products
- **URL**: `/api/products/`
- **Method**: `GET`
- **Query Params**: `?category_type=DISPOSABLE` or `?category_type=RAW_MATERIAL`
- **Auth**: Public (`IsAdminOrReadOnly`)

### 3.2 Product Detail
- **URL**: `/api/products/<id>/`
- **Method**: `GET`
- **Auth**: Public

### 3.3 Create Product (Admin Only)
- **URL**: `/api/products/`
- **Method**: `POST`
- **Auth**: Staff Only (`IsAdminUser`)
- **Content-Type**: `multipart/form-data` or `application/json`

---

## 🛒 4. Customer Cart APIs (`/api/cart/`)

### 4.1 Get Cart
- **URL**: `/api/cart/`
- **Method**: `GET`
- **Auth**: Required (`IsAuthenticated`)

### 4.2 Add Item to Cart
- **URL**: `/api/cart/items/`
- **Method**: `POST`
- **Auth**: Required (`IsAuthenticated`)
- **Request Body**: `{"product_id": 1, "variant_id": 2, "quantity": 5}`

### 4.3 Update Cart Quantity
- **URL**: `/api/cart/items/<id>/`
- **Method**: `PATCH`
- **Auth**: Required (`IsAuthenticated`)
- **Request Body**: `{"quantity": 10}`

### 4.4 Remove Cart Item
- **URL**: `/api/cart/items/<id>/delete/`
- **Method**: `DELETE`
- **Auth**: Required (`IsAuthenticated`)

---

## 📜 5. Order & Checkout APIs (`/api/orders/`)

### 5.1 Place Order
- **URL**: `/api/orders/`
- **Method**: `POST`
- **Auth**: Required (`IsAuthenticated`)
- **Request Body**: `{"customer_name": "Rahul", "customer_mobile": "9876543210", "customer_address": "Kanpur Area"}`
- **Behavior**: Executes `@transaction.atomic`, verifies variant stock, creates snapshot `OrderItems`, deducts stock, creates internal admin notifications, and clears cart.

### 5.2 List Customer Orders
- **URL**: `/api/orders/`
- **Method**: `GET`
- **Auth**: Required (`IsAuthenticated`)

### 5.3 Cancel Order
- **URL**: `/api/orders/<id>/cancel/`
- **Method**: `POST`
- **Auth**: Required (`IsAuthenticated`)
- **Behavior**: Restores variant stock safely inside `@transaction.atomic` for `PENDING` or `CONFIRMED` orders.

---

## ⚙️ 6. Admin Management APIs (`/api/admin/`)

### 6.1 Admin Dashboard Analytics
- **URL**: `/api/admin/dashboard/`
- **Method**: `GET`
- **Auth**: Staff Only (`IsAdminUser`)
- **Response**: Aggregated summary cards, 7-day sales chart timeline, status distribution counts, low-stock variants, and recent orders.

### 6.2 Admin Order Fulfillment List
- **URL**: `/api/admin/orders/`
- **Method**: `GET`
- **Query Params**: `?status=PENDING` or `?search=RP-2026`
- **Auth**: Staff Only (`IsAdminUser`)

### 6.3 Update Order Status
- **URL**: `/api/admin/orders/<id>/status/`
- **Method**: `PATCH`
- **Auth**: Staff Only (`IsAdminUser`)
- **Request Body**: `{"status": "SHIPPED"}`

### 6.4 Inventory & Stock Audit List
- **URL**: `/api/admin/stock/`
- **Method**: `GET`
- **Auth**: Staff Only (`IsAdminUser`)

### 6.5 Manual Stock Adjustment
- **URL**: `/api/admin/stock/update/`
- **Method**: `POST`
- **Auth**: Staff Only (`IsAdminUser`)
- **Request Body**: `{"variant_id": 1, "new_stock": 50, "reason": "NEW_STOCK"}`

### 6.6 Customer Directory
- **URL**: `/api/admin/customers/`
- **Method**: `GET`
- **Auth**: Staff Only (`IsAdminUser`)

### 6.7 WhatsApp API Status & Test Endpoint
- **URL**: `/api/admin/test-whatsapp/`
- **Method**: `GET`, `POST`
- **Auth**: Staff Only (`IsAdminUser`)
- **GET Response**: Returns configuration status (`Configured` / `Not Configured`) and masked recipient (`91******6979`).
- **POST Response**: Dispatches test WhatsApp message to recipient (`919305616979`). Secrets are NEVER returned.

---

## 🔔 7. Notification APIs (`/api/notifications/`)

### 7.1 List Notifications
- **URL**: `/api/notifications/`
- **Method**: `GET`
- **Query Params**: `?admin=true` (for admin staff)
- **Auth**: Required (`IsAuthenticated`)

### 7.2 Unread Count Badge
- **URL**: `/api/notifications/unread-count/`
- **Method**: `GET`
- **Auth**: Required (`IsAuthenticated`)

### 7.3 Mark Notification Read
- **URL**: `/api/notifications/<id>/read/`
- **Method**: `PATCH`
- **Auth**: Required (`IsAuthenticated`)

### 7.4 Mark All Read
- **URL**: `/api/notifications/read-all/`
- **Method**: `PATCH`
- **Auth**: Required (`IsAuthenticated`)
