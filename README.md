# R.P. Enterprises — Disposable & Raw Material Online Ordering Platform

Production-quality full-stack web application built for **R.P. Enterprises**, a real manufacturing business producing disposable products (Dona, Disposable Thali, Disposable Bowls, Silver/Baffer items) and industrial manufacturing raw materials (Paper rolls, PE reels, Foil stock).

---

## 🚀 Technology Stack

### Backend
- **Python 3.14+**
- **Django 6.1+** & **Django REST Framework**
- **SQLite** (Development Database)
- **Django ORM**
- **Simple JWT** (JSON Web Token Authentication)
- **Pillow** (Image processing for product media uploads)

### Frontend
- **React 19** with **Vite**
- **Tailwind CSS v4**
- **Lucide React Icons**
- **React Router DOM v7**

---

## 🌟 Key Features

### Customer Shopping Experience
- **Public Product Browsing**: Anyone can browse disposable products, raw materials, filter by category, search, and inspect product quality variants without logging in.
- **Mobile-Number Based Authentication**: Simple customer signup & login using primary mobile number & password.
- **Cart Management**: Add items to cart (requires authentication), adjust quantities, and view subtotal calculations.
- **Atomic Checkout & Invoicing**: Place wholesale orders with delivery details saved as immutable snapshot invoice fields (`customer_name`, `customer_address`, `product_name`, `price` at purchase time).
- **Order Tracking & Cancellation**: View order status history (`Pending` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered`) and cancel orders with automatic stock restoration.
- **Real-Time Notifications**: In-app 🔔 notification badge & drawer for order status updates.

### Admin & Factory Management System (`/admin/dashboard`)
- **Executive Analytics Dashboard**: Summary cards for Total Revenue, Orders, Products, Customers, 7-Day Sales SVG chart, and Order Status distribution.
- **Order Fulfillment Hub**: Searchable and filterable table with inline order status dropdown transitions.
- **Warehouse Inventory & Stock Control**: View variant stock levels, update stock manually, and view `StockHistory` audit logs.
- **Client Directory**: Customer directory listing total orders and total revenue spent (passwords never exposed).
- **Meta WhatsApp Business Integration**: Diagnostic API utilities and signup notifications (automatic order notifications disabled).

---

## 🛠️ Project Setup & Installation

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Run master automated test suite (Executes Steps 1-9 tests)
python test_all.py

# Start Django development server
python manage.py runserver 8000
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle
npm run build
```

---

## 🔑 Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env` and update credentials for production:

```ini
SECRET_KEY=your_production_django_secret_key
DEBUG=False
ALLOWED_HOSTS=rpenterprises.com,127.0.0.1
CORS_ALLOWED_ORIGINS=https://rpenterprises.com

# WhatsApp Business Cloud API (Optional - fail-safe enabled)
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ADMIN_NUMBER=919876543210
```

---

## 📄 License & Ownership

Designed and developed for **R.P. Enterprises**. All rights reserved.
