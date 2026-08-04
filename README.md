# BanKLED — Backend Ledger System

BanKLED is a backend banking ledger system built with **Node.js, Express.js, MongoDB, and Mongoose**.

The project focuses on backend fundamentals such as authentication, account management, ledger-based transactions, transaction consistency, idempotency, pagination, filtering, and password recovery with OTP verification.

## Features

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- JWT accepted through cookies or the `Authorization` header
- Token blacklist on logout
- Separate system-user authorization for initial-fund operations
- Password hashing with bcrypt

### Account Management
- Create an account for an authenticated user
- Retrieve account details
- Retrieve the current account balance
- Account statuses: `ACTIVE`, `FROZEN`, `CLOSED`
- Account balance calculated from immutable ledger entries

### Transactions
- Transfer funds between accounts
- Transaction statuses:
  - `PENDING`
  - `COMPLETED`
  - `FAILED`
  - `REVERSED`
- Idempotency keys to prevent duplicate transaction processing
- MongoDB sessions/transactions for atomic transaction processing
- Debit and credit ledger entries
- System-user initial funding

### Transaction History
- Retrieve transactions belonging to the authenticated user's account
- Pagination
- Status filtering
- Minimum amount filtering
- Maximum amount filtering
- Total transaction count and total pages in the response

### Forgot Password
- Generate a secure six-digit OTP
- Store OTP with an expiration time
- Invalidate previous OTP records when a new OTP is requested
- OTP verification
- Verified OTP state
- Password reset after successful OTP verification
- OTP record removed after a successful password reset
- Email service integration using Nodemailer

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Nodemailer | Email delivery |
| cookie-parser | Reading authentication cookies |
| dotenv | Environment variable management |

## Project Architecture

The application follows a controller–service–model style structure:

```text
Client
  ↓
Express Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Models / Services
  ↓
MongoDB
```

### Project Structure

```text
BACKEND LEDGER V1/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controller/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   │
│   ├── middleware/
│   │   └── auth.middlewars.js
│   │
│   ├── models/
│   │   ├── account.models.js
│   │   ├── blackList.model.js
│   │   ├── ledger.model.js
│   │   ├── otp.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   │
│   ├── routes/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   │
│   ├── services/
│   │   └── email.service.js
│   │
│   └── app.js
│
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

## Authentication Flow

During login, the server verifies the user's password and generates a JWT.

```text
Login Request
     ↓
Find User
     ↓
Compare Password with bcrypt
     ↓
Generate JWT
     ↓
Set JWT Cookie
     ↓
Return Authentication Response
```

Protected routes use authentication middleware to:

1. Extract the token from the cookie or `Authorization` header.
2. Check whether the token has been blacklisted.
3. Verify the JWT.
4. Find the associated user.
5. Attach the user to `req.user`.

## Token Blacklisting

When a user logs out, the current JWT is stored in a blacklist collection and the authentication cookie is cleared.

The blacklist collection has a TTL index so blacklist records automatically expire after the JWT's three-day lifetime.

```text
Logout
  ↓
Get JWT
  ↓
Store JWT in blacklist
  ↓
Clear authentication cookie
```

## Ledger-Based Transaction System

The project separates the **transaction record** from the **ledger entries**.

A transaction records the overall operation:

```text
Transaction
├── fromAccount
├── toAccount
├── amount
├── status
└── idempotencyKey
```

Ledger entries record the actual accounting effect:

```text
Ledger Entry
├── account
├── amount
├── transaction
└── type (CREDIT / DEBIT)
```

An account's balance is calculated from its ledger:

```text
Balance = Total Credits - Total Debits
```

Ledger entries are protected from modification and deletion through Mongoose middleware.

## Transaction Processing

A transfer follows this general flow:

```text
Validate Request
      ↓
Validate Idempotency Key
      ↓
Find Sender / Receiver
      ↓
Check Account Status
      ↓
Check Sender Balance
      ↓
Create PENDING Transaction
      ↓
Create DEBIT Ledger Entry
      ↓
Create CREDIT Ledger Entry
      ↓
Mark Transaction COMPLETED
      ↓
Commit MongoDB Transaction
```

If processing fails, the MongoDB transaction is aborted and the transaction is marked as failed.

MongoDB sessions are used so the transaction and its ledger entries can be processed atomically.

## Idempotency

Every transaction requires an `idempotencyKey`.

The key is unique and indexed in MongoDB.

This helps prevent the same transaction request from being processed multiple times when a client retries a request.

```text
Request #1
idempotencyKey = ABC123
        ↓
Transaction created

Request #2
idempotencyKey = ABC123
        ↓
Duplicate request detected
```

## Transaction History

Authenticated users can retrieve their transaction history using:

```http
GET /api/transaction/history
```

Supported query parameters:

| Parameter | Description | Default |
|---|---|---|
| `page` | Page number | `1` |
| `limit` | Number of transactions per page | `10` |
| `status` | Filter by transaction status | — |
| `minAmount` | Minimum transaction amount | — |
| `maxAmount` | Maximum transaction amount | — |

Example:

```http
GET /api/transaction/history?page=1&limit=10&status=COMPLETED&minAmount=100&maxAmount=5000
```

The endpoint returns:

- Matching transactions
- Current page
- Page limit
- Total matching transactions
- Total pages

## Forgot Password Flow

The password recovery system uses a six-digit OTP.

```text
Forgot Password
      ↓
Find User
      ↓
Generate OTP
      ↓
Set 10-minute Expiry
      ↓
Remove Previous OTP
      ↓
Store New OTP
      ↓
Send OTP by Email
      ↓
Verify OTP
      ↓
Set verified = true
      ↓
Reset Password
      ↓
Hash New Password
      ↓
Delete OTP Record
```

The OTP is stored separately from the user document.

The password is hashed through the user model's Mongoose `pre("save")` middleware before being persisted.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout and blacklist the JWT |
| `POST` | `/api/auth/forget-password` | Generate a password-reset OTP |
| `POST` | `/api/auth/verify-otp` | Verify the OTP |
| `POST` | `/api/auth/reset-password` | Reset the password |

### Accounts

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/accounts/` | Create an account |
| `GET` | `/api/accounts/details` | Get the authenticated user's accounts |
| `GET` | `/api/accounts/balance/:accountId` | Get account balance |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/transaction/` | Create a transaction |
| `POST` | `/api/transaction/system/initialfund` | Create initial funds using a system user |
| `GET` | `/api/transaction/history` | Get transaction history with pagination and filters |

## Example Requests

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "name": "Example User",
  "password": "password123"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Transaction History

```http
GET /api/transaction/history?page=1&limit=10
```

With filters:

```http
GET /api/transaction/history?page=1&limit=10&status=COMPLETED&minAmount=100&maxAmount=5000
```

### Forgot Password

```http
POST /api/auth/forget-password
Content-Type: application/json
```

```json
{
  "email": "user@example.com"
}
```

### Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "newPassword": "newPassword123"
}
```

## Environment Variables

Create a `.env` file in the project root.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

GOOGLE_USER=your_email
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

**Never commit the `.env` file or expose credentials in the repository.**

## Installation

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd BACKEND-LEDGER-V1
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file and add the required MongoDB, JWT, and email configuration.

### 4. Start the development server

```bash
npm run dev
```

The server runs on:

```text
http://localhost:3000
```

## Security Considerations

The project includes:

- bcrypt password hashing
- JWT authentication
- JWT blacklist on logout
- Protected account and transaction routes
- System-user authorization
- OTP expiration
- Previous OTP invalidation
- OTP deletion after password reset
- Environment variables for sensitive configuration
- Immutable ledger entries
- Unique idempotency keys

## Future Improvements

Possible future improvements include:

- Automated unit and integration tests
- Request validation and improved error handling
- Rate limiting for authentication and OTP endpoints
- API documentation with Swagger/OpenAPI
- Improved production email handling
- More granular authorization
- Deployment and production configuration
- Better transaction-history sorting and indexing

## Learning Goals

This project was built to practice backend development concepts including:

- REST API design
- Express middleware
- JWT authentication
- MongoDB and Mongoose
- Database schema design
- Ledger-based accounting
- MongoDB transactions and sessions
- Idempotency
- Pagination and filtering
- Password hashing
- OTP-based password recovery
- Email services
- Authentication security

## Author

**Angel Jaiswal**

Backend-focused project built with Node.js, Express.js, and MongoDB.
