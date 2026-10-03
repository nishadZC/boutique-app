# Boutique Platform — Architecture & DevOps Overview

Sep 28, 2026 · Vinayak Nishad

## 1. The three repositories

Boutique is an online men's formal-wear shop (brand Lux Atelier) on Azure Kubernetes Service, split into three Azure DevOps repos. Infra builds the ground, app builds the images, gitops deploys them.

![3 repos · what each owns · run order](images/01-repositories.png)

Everything is created by pipelines, never by clicking in the portal. Only dev runs by default; qa, staging and prod are opt-in at queue time.

## 2. Application architecture

The browser only talks to one host. App Gateway sends `/` to the React site and `/api` to the gateway, which proxies to six Node.js services. Each service checks the JWT itself.

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

| Internal call (direct, `x-internal-token`) | Why |
| --- | --- |
| orders → product | price and stock at order time, commit stock |
| payment → orders | order owner and total, mark paid or refunded |
| product → orders | only buyers with a delivered order may review |
| product → user | reviewer display name |
| auth → user | create the profile (name) when an account is created |
| user → auth | roles and admin count for the admin customer list |
| product → skin-tone | Style Advisor: selfie → skin tone → outfit colours |

## 3. Database schema

One PostgreSQL 16 server holds five logical databases, one per domain. A service never reads another service's tables; it asks that service over HTTP.

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

The schema lives in `boutique-app/database/init/20-init-schema.sql`. In AKS, `postgres-init-job` runs the same SQL from a ConfigMap in boutique-gitops, so the two copies must be kept in sync. All primary keys are UUIDs (`gen_random_uuid()`).

## 4. Azure infrastructure

Terraform in `boutique-infra` builds each environment as one resource group. Only App Gateway is public; AKS and PostgreSQL sit in private subnets.

![Azure resources in one environment · Terraform in boutique-infra](images/04-azure-infrastructure.png)

|  | dev | qa | staging | prod |
| --- | --- | --- | --- | --- |
| Prefix | bq-dev | bq-qa | bq-staging | boutique-prod |
| Region | UAE North | Central India | Central India | Central India |
| VNet | 10.1.0.0/16 | 10.3.0.0/16 | 10.4.0.0/16 | 10.2.0.0/16 |
| ACR SKU | Standard | Standard | Standard | Premium |
| Runs by default | yes | opt-in | opt-in | opt-in |

Terraform state lives in storage account `boutiquetfstate2026v2` (container `tfstate`), one blob per environment.

## 5. Identity: OIDC and Workload Identity

No client secret or password is stored anywhere for Azure access. Both flows trade a short-lived signed token for an Entra ID token, and Entra only accepts it if the issuer and subject match a federated credential.

![OIDC for pipelines · workload identity for pods](images/05-identity-oidc-workload-identity.png)

App pods never call Key Vault; they only read the Kubernetes Secret that External Secrets writes.

| Identity | Type | Can do |
| --- | --- | --- |
| Service connection `Azure Resource Group` | federated (OIDC) | Terraform, `az aks get-credentials` |
| `<prefix>-app-identity` | user-assigned, workload identity | External Secrets reads Key Vault (Get, List) |
| `<prefix>-cert-manager-identity` | user-assigned, workload identity | no roles yet (kept for DNS-01) |
| AKS kubelet identity | created by AKS | `AcrPull` on its own environment's ACR |
| AGIC identity | AKS add-on | writes App Gateway routes (Contributor, Reader, Network Contributor) |

## 6. CI/CD pipelines

There are four YAML pipelines and one Release pipeline. A merge to `main` in boutique-app runs CI, and its build artifact triggers the Dev Release automatically.

![all pipelines · stages left to right](images/06-cicd-pipelines.png)

All of them run on Microsoft-hosted `ubuntu-latest` agents and log in with the same OIDC service connection. The Release pipeline is set up in the Azure DevOps UI (Pipelines → Releases), so it is not stored as YAML in any repo. Higher environments get images through `az acr import`: images are promoted, never rebuilt.

## 7. Deployment with boutique-gitops and Releases

boutique-gitops holds the Helm chart and one values file per environment. Nothing watches the repo; a change goes live on the next Release run.

![boutique-gitops chart · Release deploy into AKS](images/07-deployment-release.png)

- **Rollback:** `--rollback-on-failure` undoes an upgrade that is not healthy within 5 minutes; `helm rollback` works by hand.
- **Deployed today:** dev only. QA, staging and prod have Terraform and values files but no Release pipeline yet.
- **Network:** `default-deny-all`, then each service accepts traffic only from its callers (for example orders accepts gateway, payment and product).

## 8. Monitoring and alerting

The platform pipeline installs kube-prometheus-stack; the gitops chart adds the scrape targets, rules and dashboards, so monitoring is all code.

![monitoring · metrics to dashboards and pages](images/08-monitoring.png)

| Alert group | Examples | Severity |
| --- | --- | --- |
| Availability | InstanceDown, ServiceScaledToZero, HighErrorRate | critical |
| Database | PostgresDown | critical |
| Latency | p95 over 1s, skin-tone p95 over 15s | warning |
| Runtime | restart loops, event-loop lag, DB pool exhausted | warning |
| Database health | too many connections, deadlocks, long transactions | warning |
| Business | payment verification rate under 50% | warning |

In this setup the default route is PagerDuty, so warnings page too, not just critical alerts. Dashboards: Microservices RED, Service Runtime, Infrastructure, PostgreSQL, Business KPIs.

## 9. Summary: the story in one line per slide

1. **Repos:** three repos split the work: code, cloud and deployment are changed and reviewed separately.
2. **App:** a React site and 8 services behind one gateway, with prices computed on the server.
3. **Data:** 4 databases, one per domain, linked only by ids and HTTP calls.
4. **Azure:** everything is Terraform; only App Gateway is public, Postgres has no public endpoint.
5. **Identity:** no stored secrets for Azure access; OIDC for pipelines, workload identity for pods.
6. **Pipelines:** plan is saved and applied exactly; approvals sit on Azure DevOps environments; images are scanned with Trivy.
7. **Deploy:** a merge to main builds, pushes and releases to dev automatically, with rollback on failure.
8. **Monitoring:** Prometheus scrapes every service, Grafana dashboards are code, and alerts page PagerDuty against a 99.5% SLO.

Open gaps worth saying out loud: QA, staging and prod have no Release pipeline yet, Trivy and `terraform fmt` never fail a build, and all environments share one set of pipeline variables.
