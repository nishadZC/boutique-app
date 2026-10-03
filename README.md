# Lux Atelier – Boutique Microservices App

An online shop for **men's formal wear** (shirts, trousers, shoes, blazers, suits and coats), built
as a set of **microservices** and deployed on **Azure Kubernetes Service (AKS)**.

## About the project

Customers can browse the catalogue, add items to a cart or wishlist, pay online, and track their
orders. The store owner gets an admin area to manage orders, products, stock and customers.

The standout feature is the **Style Advisor**: the customer uploads a selfie, a Python
computer-vision service detects their skin tone, and the shop suggests colours and complete outfits
(shirt + trousers + shoes) that are in stock.

**Main features**

- Product catalogue with search, filters and sorting
- Cart, checkout and online payment (Razorpay)
- Order history, cancellations, returns and refunds
- Sign-in with email/password or Google
- Wishlist and customer profile (address can be filled from your current location)
- Invoice PDF, generated in the browser
- Style Advisor: skin-tone detection and outfit recommendations
- Admin area: orders, refunds, products, stock, customers and KPIs

**How it is built**

- Each business area is its own service with its **own database**, so services can be built,
  deployed and scaled independently.
- The browser talks to a single **API gateway**, which routes each request to the right service.
- Services that need data from each other ask over HTTP; they never read each other's tables.

The project is split into three repositories:

| Repository | Contains |
|---|---|
| `boutique-app` (this one) | Website, microservices, database schema, local setup, CI pipeline |
| `boutique-gitops` | Helm chart that deploys the app to Kubernetes |
| `boutique-infra` | Terraform for the Azure infrastructure |

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Material UI 7, React Router 7, Axios, jsPDF |
| **Backend services** | Node.js 26, Express, TypeScript |
| **AI service** | Python 3.12, FastAPI, OpenCV, scikit-learn (K-Means) |
| **Database** | PostgreSQL 16 (Azure Database for PostgreSQL) |
| **Authentication** | JWT (access and refresh tokens), bcrypt, Google Sign-In |
| **External services** | Razorpay (payments), Cloudinary (product images), Azure Maps (address lookup) |
| **Containers** | Docker, nginx (serves the website) |
| **Cloud and deployment** | Azure Kubernetes Service, Azure Container Registry, Azure Key Vault, Application Gateway, Helm |
| **Infrastructure as code** | Terraform |
| **CI/CD** | Azure DevOps Pipelines, SonarCloud (code quality), Trivy (image scanning) |
| **Monitoring** | Prometheus, Grafana, Alertmanager, PagerDuty |
| **Testing** | Vitest |

## Architecture

The browser loads the React app and sends every API call to `/api`. The **API gateway** forwards
each call to the right service. Every service checks the user's login token itself and works only
with its own database. Solid arrows are requests and database access; dotted arrows are internal
calls between services.

```mermaid
flowchart LR
    browser(["Browser"])

    subgraph frontend["Frontend"]
        spa["React app<br/>served by nginx :8080<br/>(Vite :3000 in development)"]
    end

    subgraph backend["Backend services"]
        gateway["API gateway :3001"]
        auth["auth :3002"]
        user["user :3004"]
        product["product :3003"]
        orders["orders :3005"]
        payment["payment :3006"]
        wishlist["wishlist :3007"]
        skintone["skin-tone (Python) :5001"]
    end

    subgraph databases["PostgreSQL"]
        authdb[("auth_db")]
        usersdb[("users_db")]
        productsdb[("products_db")]
        ordersdb[("orders_db")]
        wishlistdb[("wishlist_db")]
    end

    subgraph external["External services"]
        google["Google Sign-In"]
        maps["Azure Maps"]
        cloudinary["Cloudinary"]
        razorpay["Razorpay"]
    end

    browser --> spa
    spa -- "/api" --> gateway
    gateway --> auth & user & product & orders & payment & wishlist

    auth <-. "create profile / roles" .-> user
    product -. "outfit colours" .-> skintone
    product -. "review check" .-> orders
    product -. "reviewer name" .-> user
    orders -. "price, stock" .-> product
    payment -. "order total, mark paid" .-> orders

    auth --> authdb
    user --> usersdb
    product --> productsdb
    orders --> ordersdb
    wishlist --> wishlistdb

    auth --> google
    user --> maps
    product --> cloudinary
    payment --> razorpay
```

## Database schema

One PostgreSQL server holds **five databases, one per service**. Solid lines are real foreign keys
inside a database. Dotted lines link records across databases by id only; the services resolve
those links over HTTP.

| Database | Owned by | Tables |
|---|---|---|
| `auth_db` | auth | `users` (email, password hash, role) |
| `users_db` | user | `profiles` (name, phone, address) |
| `products_db` | product | `categories`, `products`, `product_images`, `inventory_adjustments`, `product_reviews` |
| `orders_db` | orders | `orders`, `order_items`, `order_events`, `order_requests` |
| `wishlist_db` | wishlist | `wishlist_items` |

```mermaid
erDiagram
    %% auth_db (auth service)
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role "customer or admin"
        boolean must_change_password
    }

    %% users_db (user service)
    PROFILES {
        uuid user_id PK "= users.id"
        string email
        string first_name
        string last_name
        string phone
        text address
    }

    %% products_db (product service)
    CATEGORIES {
        uuid id PK
        string name
        string image_url
    }
    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string name
        string brand
        decimal price
        int inventory_quantity
        string base_colour
        text[] skin_tone_tags
        boolean made_to_measure
    }
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        string image_url
        boolean is_primary
    }
    INVENTORY_ADJUSTMENTS {
        uuid id PK
        uuid product_id FK
        int delta
        int resulting_quantity
        string reason
    }
    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id
        uuid order_id
        int rating
        text comment
    }

    %% orders_db (orders service)
    ORDERS {
        uuid id PK
        uuid user_id
        decimal total_amount
        string status
        string payment_status
        string razorpay_order_id
        text shipping_address
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id
        int quantity
        decimal price
        string size
    }
    ORDER_EVENTS {
        uuid id PK
        uuid order_id FK
        string type
        string from_value
        string to_value
    }
    ORDER_REQUESTS {
        uuid id PK
        uuid order_id FK
        string type "cancel, return or refund"
        string status
        string refund_id
    }

    %% wishlist_db (wishlist service)
    WISHLIST_ITEMS {
        uuid user_id PK
        uuid product_id PK
    }

    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ INVENTORY_ADJUSTMENTS : "stock history"
    PRODUCTS ||--o{ PRODUCT_REVIEWS : has
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o{ ORDER_EVENTS : history
    ORDERS ||--o{ ORDER_REQUESTS : has

    USERS ||..|| PROFILES : "same id"
    USERS ||..o{ ORDERS : places
    USERS ||..o{ WISHLIST_ITEMS : saves
    PRODUCTS ||..o{ ORDER_ITEMS : "ordered as"
    PRODUCTS ||..o{ WISHLIST_ITEMS : "saved as"
```

The full schema is in [database/init/20-init-schema.sql](database/init/20-init-schema.sql).
