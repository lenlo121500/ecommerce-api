# E-commerce Backend API with Node.js, Express.js, MongoDB & TypeScript

## Table of Contents

- [System Design Overview](#system-design-overview)
- [Database Schema Design](#database-schema-design)
- [Project Setup](#project-setup)
- [Security Features](#security-features)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Validation Rules](#validation-rules)
- [Error Handling](#error-handling)
- [Performance Features](#performance-features)
- [Development Workflow](#development-workflow)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Future Improvements](#future-improvements)

## System Design Overview

### Architecture Pattern

- **MVC (Model-View-Controller)** with service layer for separation of concerns
- **RESTful API** design with proper HTTP methods and status codes
- **Microservices-ready** structure for easy scaling
- **JWT-based authentication** with role-based authorization
- **Event-driven architecture** for analytics and notifications

### Core Components

```
├── src/
│   ├── controllers/     # Request handlers and HTTP logic
│   ├── models/         # Database schemas and data models
│   ├── services/       # Business logic and data processing
│   ├── routes/         # API route definitions
│   ├── middleware/     # Custom middleware (auth, validation, logging)
│   ├── utils/          # Helper functions and utilities
│   ├── types/          # TypeScript interfaces and type definitions
│   ├── validators/     # Input validation schemas
│   ├── config/         # Configuration files and constants
│   └── tests/          # Unit and integration tests
```

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware ecosystem
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Cloudinary for image management
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston with Morgan for HTTP request logging
- **Testing**: Jest with Supertest (planned)
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks

## Database Schema Design

### Database Relationships

- Users → Orders (One-to-Many)
- Users → Cart (One-to-One active cart)
- Products → Orders (Many-to-Many via OrderItems)
- Categories → Products (One-to-Many)
- Users(Sellers) → Products (One-to-Many)
- Products → Reviews (One-to-Many)

#### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  firstName: string,
  lastName: string,
  role: 'customer' | 'admin' | 'seller',
  addresses: Address[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection

```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  price: number,
  category: ObjectId,
  stock: number,
  images: string[],
  seller: ObjectId,
  ratings: { average: number, count: number },
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders Collection

```typescript
{
  _id: ObjectId,
  user: ObjectId,
  items: OrderItem[],
  totalAmount: number,
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
  shippingAddress: Address,
  paymentMethod: string,
  paymentStatus: 'pending' | 'completed' | 'failed',
  createdAt: Date,
  updatedAt: Date
}
```

#### Cart Collection

```typescript
{
  user: Types.ObjectId | string;
  items: ICartItem[];
  totalAmount: number;
  totalItems: number;
  isActive: boolean;
  expiresAt: Date;
}
```

#### Analytics Collection

```typescript
interface IAnalytics {
  _id: ObjectId;
  date: Date;
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  newUsers: number;
  topProducts: IProductStat[];
  categoryBreakdown: ICategoryStat[];
  userActivity: IUserActivityStat;
  createdAt: Date;
}

interface IProductStat {
  productId: ObjectId;
  name: string;
  salesCount: number;
  revenue: number;
}

interface ICategoryStat {
  categoryId: ObjectId;
  name: string;
  salesCount: number;
  revenue: number;
}
```

## Project Setup

### 1. Initialize Project

```bash
mkdir ecommerce-backend
cd ecommerce-backend
npm init -y
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install express mongoose cors helmet morgan dotenv
npm install bcryptjs jsonwebtoken express-rate-limit
npm install joi express-validator multer cloudinary
npm install winston compression cookie-parser

# TypeScript dependencies
npm install -D typescript @types/node @types/express
npm install -D @types/bcryptjs @types/jsonwebtoken @types/cors
npm install -D @types/morgan @types/multer @types/cookie-parser
npm install -D nodemon ts-node

# Development tools
npm install -D eslint @typescript-eslint/eslint-plugin
npm install -D @typescript-eslint/parser prettier
npm install -D husky lint-staged
npm install -D jest @types/jest supertest @types/supertest
```

### 3. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 4. Package.json Scripts

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "prepare": "husky install"
  }
}
```

### 5. ESLint Configuration

```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": "warn"
  }
}
```

## Security Features

### Helmet Middleware Configuration

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### Security Measures

- **HTTPS Enforcement**: Strict-Transport-Security headers
- **XSS Protection**: Content Security Policy and XSS filtering
- **Clickjacking Prevention**: X-Frame-Options headers
- **MIME Sniffing Protection**: X-Content-Type-Options
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Comprehensive request validation
- **Password Security**: Bcrypt hashing with salt rounds (10)
- **JWT Security**: Token-based authentication with expiration
- **CORS**: Configured cross-origin resource sharing

## Authentication & Authorization

### Authentication Flow

1. **Registration**: User creates account → Email verification → JWT token issued
2. **Login**: Credentials validated → JWT token issued → Stored in HTTP-only cookie
3. **Protected Routes**: JWT validated via middleware → User context attached
4. **Token Refresh**: Automatic token refresh for active sessions
5. **Logout**: Token invalidated and removed from client

### Role-Based Access Control

- **User**: Product browsing, cart management, order placement
- **Seller**: Product management, order fulfillment, sales analytics
- **Admin**: User management, system analytics, platform configuration

## API Endpoints

### Authentication Routes

| Method | Endpoint                | Auth Required | Description       | Request Body                                    | Response        |
| ------ | ----------------------- | ------------- | ----------------- | ----------------------------------------------- | --------------- |
| POST   | `/api/auth/v1/register` | No            | Register new user | `{email, password, firstName, lastName, role?}` | `{user, token}` |
| POST   | `/api/auth/v1/login`    | No            | Login user        | `{email, password}`                             | `{user, token}` |
| POST   | `/api/auth/v1/logout`   | Yes           | Logout user       | -                                               | `{message}`     |

### Product Routes

| Method | Endpoint               | Auth Required | Description            | Query Params                                          | Response                            |
| ------ | ---------------------- | ------------- | ---------------------- | ----------------------------------------------------- | ----------------------------------- |
| GET    | `/api/v1/products`     | No            | Get paginated products | `category, page, limit, sort, search`                 | `{products[], pagination, filters}` |
| GET    | `/api/v1/products/:id` | No            | Get single product     | -                                                     | `{product}`                         |
| POST   | `/api/v1/products`     | Yes (Seller)  | Create new product     | `{name, description, price, category, stock, images}` | `{product}`                         |
| PUT    | `/api/v1/products/:id` | Yes (Seller)  | Update product         | `{name?, description?, price?, stock?, images?}`      | `{product}`                         |
| DELETE | `/api/v1/products/:id` | Yes (Seller)  | Delete product         | -                                                     | `{message}`                         |

### Cart Routes

| Method | Endpoint                        | Auth Required | Description      | Request Body            | Response    |
| ------ | ------------------------------- | ------------- | ---------------- | ----------------------- | ----------- |
| GET    | `/api/v1/cart`                  | Yes           | Get user's cart  | -                       | `{cart}`    |
| POST   | `/api/v1/cart/items`            | Yes           | Add item to cart | `{productId, quantity}` | `{cart}`    |
| PUT    | `/api/v1/cart/items/:productId` | Yes           | Update cart item | `{quantity}`            | `{cart}`    |
| DELETE | `/api/v1/cart/items/:productId` | Yes           | Remove cart item | -                       | `{cart}`    |
| DELETE | `/api/v1/cart`                  | Yes           | Clear cart       | -                       | `{message}` |

### Order Routes

| Method | Endpoint                    | Auth Required | Description         | Request Body                               | Response                 |
| ------ | --------------------------- | ------------- | ------------------- | ------------------------------------------ | ------------------------ |
| POST   | `/api/v1/orders`            | Yes           | Place new order     | `{shippingAddress, paymentMethod, items?}` | `{order}`                |
| GET    | `/api/v1/orders`            | Yes           | Get user's orders   | `page, limit, status`                      | `{orders[], pagination}` |
| GET    | `/api/v1/orders/history`    | Yes           | Get order history   | -                                          | `{orders[], pagination}` |
| PUT    | `/api/v1/orders/:id/cancel` | Yes           | Cancel order        | -                                          | `{order}`                |
| PUT    | `/api/v1/orders/:id/status` | Yes (Seller)  | Update order status | `{status}`                                 | `{order}`                |

### Analytics Routes

| Method | Endpoint                               | Auth Required | Description                           | Query Params         | Response            |
| ------ | -------------------------------------- | ------------- | ------------------------------------- | -------------------- | ------------------- |
| GET    | `/api/v1/analytics/dashboard`          | Yes (Admin)   | Get admin dashboard                   | `startDate, endDate` | `{metrics, charts}` |
| GET    | `/api/v1/analytics/product/:productId` | Yes (Admin)   | Get product analytics                 | `productId`          | `{products[]}`      |
| POST   | `/api/v1/analytics/track/session`      | Yes (Admin)   | Track user session                    | -                    | `{metrics, charts}` |
| POST   | `/api/v1/analytics/track/page-view`    | Yes (Admin)   | Track page view                       | -                    | `{metrics, chart}`  |
| POST   | `/api/v1/analytics/track/product-view` | Yes (Admin)   | Track product view                    | -                    | `{metrics, chart}`  |
| POST   | `/api/v1/analytics/track/event`        | Yes (Admin)   | Track a custom event                  | -                    | `{metrics, chart}`  |
| POST   | `/api/v1/analytics/generate/daily`     | Yes (Admin)   | Generate daily analytics              | `startDate, endDate` | `{metrics, chart}`  |
| POST   | `/api/v1/analytics/generate/batch`     | Yes (Admin)   | Generate analytics for a range of day | `startDate, endDate` | `{metrics, chart}`  |

### User Management Routes

| Method | Endpoint                        | Auth Required | Description      | Request Body                                  | Response                |
| ------ | ------------------------------- | ------------- | ---------------- | --------------------------------------------- | ----------------------- |
| GET    | `/api/v1/users/profile`         | Yes           | Get user profile | -                                             | `{user}`                |
| PUT    | `/api/v1/users/profile`         | Yes           | Update profile   | `{firstName?, lastName?, phone?, addresses?}` | `{user}`                |
| POST   | `/api/v1/users/change-password` | Yes           | Change password  | `{currentPassword, newPassword}`              | `{message}`             |
| GET    | `/api/v1/users`                 | Yes (Admin)   | Get all users    | `page, limit, role`                           | `{users[], pagination}` |

### Health Check Routes

| Method | Endpoint         | Auth Required | Description     | Response                      |
| ------ | ---------------- | ------------- | --------------- | ----------------------------- |
| GET    | `/api/health`    | No            | Health check    | `{status, timestamp, uptime}` |
| GET    | `/api/health/db` | No            | Database health | `{status, connection}`        |

## Validation Rules

### User Registration

- **Email**: Valid email format, unique in database
- **Password**: Minimum 8 characters
- **Name**: 2-50 characters, alphabetic only

### Product Validation

- **Name**: 3-200 characters, required
- **Price**: Positive number, maximum 2 decimal places, required
- **Stock**: Non-negative integer, required
- **Images**: Maximum 10 images, supported formats: jpg, png, webp
- **Category**: Valid ObjectId reference, required

### Order Validation

- **Items**: At least 1 item, valid product references
- **Quantities**: Positive integers, stock availability check
- **Address**: All required fields present and valid
- **Payment Method**: Must be from allowed list

### Query Parameter Validation

- **Pagination**: Page ≥ 1, Limit ≤ 100
- **Sorting**: Allowed fields only (price, name, createdAt, rating)
- **Filters**: Valid enum values for status, category, etc.

## Error Handling

### Global Error Handler

```typescript
const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error =
    err instanceof APIError
      ? err
      : new APIError(500, "Internal Server Error", err.stack);

  logger.error(error);

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};
```

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### Error Categories

- **Validation Errors**: Input validation failures
- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Insufficient permissions
- **Business Logic Errors**: Stock unavailable, order cannot be cancelled
- **Database Errors**: Connection issues, constraint violations
- **External Service Errors**: Payment gateway, file upload failures

## Performance Features

### Database Optimization

- **Indexing Strategy**: Compound indexes on frequently queried fields
- **Query Optimization**: Efficient MongoDB queries with proper projections
- **Connection Pooling**: Mongoose connection pool management
- **Aggregation Pipelines**: Complex analytics queries optimization

### Caching Strategy (Planned)

- **Redis Cache**: Product listings, user sessions, cart data
- **Cache Invalidation**: Smart cache invalidation on data updates
- **CDN Integration**: Static asset delivery via Cloudinary

### API Performance

- **Pagination**: Limit large result sets (max 100 items per page)
- **Compression**: Gzip compression for API responses
- **Rate Limiting**:
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
  - File uploads: 10 requests per hour

### Image Optimization

- **Cloudinary**: Automatic image optimization and format conversion
- **Responsive Images**: Multiple image sizes for different devices
- **Lazy Loading**: Progressive image loading support

## Development Workflow

### Setup Instructions

1. **Clone Repository**: `git clone https://github.com/lenlo121500/ecommerce-api`
2. **Install Dependencies**: `npm install`
3. **Environment Setup**: Copy `.env.example` to `.env` and configure
4. **Database Setup**: Start MongoDB locally or configure Atlas connection
5. **Start Development**: `npm run dev`

### Development Guidelines

- **Code Style**: ESLint + Prettier enforced via pre-commit hooks
- **Commit Convention**: Conventional commits format
- **Branch Strategy**: Feature branches with descriptive names
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update API documentation for endpoint changes

### Pre-commit Hooks

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run test
```

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] API documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is considered

## Environment Configuration

```bash
# Server Configuration
PORT=5000                              # Server port number
NODE_ENV=development                   # Environment (development/production/test)
API_VERSION=v1                         # API version

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ecommerce  # MongoDB connection string
MONGODB_TEST_URI=mongodb://localhost:27017/ecommerce_test  # Test database

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_chars  # JWT signing secret
JWT_EXPIRES_IN=7d                      # JWT token expiration time
JWT_REFRESH_EXPIRES_IN=30d             # Refresh token expiration
BCRYPT_SALT_ROUNDS=12                  # Bcrypt salt rounds

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000            # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window
AUTH_RATE_LIMIT_MAX=5                  # Max auth requests per window

# File Upload & Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name  # Cloudinary cloud name
CLOUDINARY_API_KEY=your_api_key        # Cloudinary API key
CLOUDINARY_API_SECRET=your_api_secret  # Cloudinary API secret
MAX_FILE_SIZE=5242880                  # Max file size in bytes (5MB)
ALLOWED_FILE_TYPES=jpg,jpeg,png,webp   # Allowed image formats

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com               # SMTP server host
SMTP_PORT=587                          # SMTP server port
SMTP_USER=your_email@gmail.com         # SMTP username
SMTP_PASS=your_app_password            # SMTP password
FROM_EMAIL=noreply@yourapp.com         # From email address
FROM_NAME=Your App Name                # From name

# Payment Integration (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Stripe publishable key
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Stripe webhook secret

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379       # Redis connection URL
REDIS_PASSWORD=your_redis_password     # Redis password (if required)

# Logging
LOG_LEVEL=info                         # Logging level (error, warn, info, debug)
LOG_FILE=logs/app.log                  # Log file path

# CORS Configuration
CORS_ORIGIN=http://localhost:3000      # Allowed origins (comma-separated)
CORS_CREDENTIALS=true                  # Allow credentials in CORS
```

## Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS final
COPY --from=build /app/dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ecommerce
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6.0
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  mongo_data:
  redis_data:
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring (New Relic/DataDog)

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        # Add deployment steps here
```

## Future Improvements

### Immediate Priorities (Next 2-4 weeks)

- ✅ **Complete Authentication System**: Email verification, password reset functionality
- ✅ **File Upload Implementation**: Complete Multer & Cloudinary integration
- ✅ **Comprehensive Testing**: Unit tests with Jest + Supertest
- ✅ **API Documentation**: Swagger/OpenAPI 3.0 documentation
- ✅ **Input Validation**: Complete Joi validation schemas

### Short-term Goals (1-3 months)

- ✅ **Payment Integration**: Stripe payment processing
- ✅ **Email Notifications**: Transactional emails for orders, verification
- ✅ **Advanced Search**: Elasticsearch integration for product search
- ✅ **Caching Layer**: Redis implementation for performance
- ✅ **Image Optimization**: Advanced Cloudinary features

### Medium-term Goals (3-6 months)

- ✅ **Real-time Features**: WebSocket integration for order updates
- ✅ **Advanced Analytics**: Detailed business intelligence dashboard
- ✅ **Inventory Management**: Stock tracking, low stock alerts
- ✅ **Review System**: Product ratings and reviews
- ✅ **Wishlist Feature**: User product wishlists

### Long-term Vision (6+ months)

- ✅ **Microservices Architecture**: Service decomposition
- ✅ **Mobile API**: React Native/Flutter optimized endpoints
- ✅ **AI Integration**: Recommendation engine, chatbot support
- ✅ **Multi-vendor Platform**: Complete marketplace functionality
- ✅ **International Support**: Multi-currency, multi-language

### Technical Debt & Maintenance

- **Performance Monitoring**: APM implementation
- **Security Audits**: Regular security assessments
- **Database Optimization**: Query performance analysis
- **Code Refactoring**: Continuous code quality improvements
- **Dependency Updates**: Regular security updates

## Contributing

### Contribution Guidelines

1. **Fork the repository** and create a feature branch
2. **Follow coding standards** (ESLint + Prettier)
3. **Write comprehensive tests** for new features
4. **Update documentation** for API changes
5. **Submit a pull request** with detailed description

### Development Setup for Contributors

```bash
# Fork and clone the repository
git clone https://github.com/lenlo121500/ecommerce-api
cd ecommerce-backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your environment variables

# Start development server
npm run dev

# Run tests
npm test
```

### Code of Conduct

- Be respectful and inclusive
- Follow established coding patterns
- Provide constructive feedback
- Help maintain code quality standards

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or contributions:

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check the API documentation
- **Email**: raulc8808@gmail.com
