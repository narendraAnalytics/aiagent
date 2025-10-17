# Clerk Authentication Integration Guide

**Complete Documentation for .**

Last Updated: 2025-10-15
Project: Personal Research Assistant
Tech Stack: Next.js 15, FastAPI, PostgreSQL (Neon), Clerk Authentication

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Analysis](#problem-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Authentication Flow](#authentication-flow)
5. [Technical Implementation](#technical-implementation)
6. [File Structure](#file-structure)
7. [Setup Instructions](#setup-instructions)
8. [Environment Variables](#environment-variables)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Best Practices](#best-practices)
13. [Quick Reference](#quick-reference)

---

## Executive Summary

This guide documents the complete integration of Clerk authentication with a Next.js frontend and FastAPI backend, syncing user data to a Neon PostgreSQL database.

### What This System Does:
1. Users sign in via Clerk (OAuth, Email, etc.)
2. Frontend generates JWT session token
3. Backend verifies JWT using Clerk's JWKS (JSON Web Key Set)
4. Backend fetches full user details from Clerk API
5. User data syncs to Neon database automatically
6. Subsequent requests use cached user data

### Key Components:
- **Frontend**: Next.js 15 + Clerk SDK (authentication UI)
- **Backend**: FastAPI + PyJWT + cryptography (JWT verification)
- **Database**: Neon PostgreSQL (user data persistence)
- **Auth Provider**: Clerk (identity management)

---

## Problem Analysis

### Initial Problem: 401 "Invalid or expired Clerk token"

**Error Message:**
```
Status: 401 "Unauthorized"
Response: {"detail":"Invalid or expired Clerk token"}
```

**Root Cause:**
The backend was incorrectly trying to verify the user's JWT session token by calling Clerk's API endpoint `/v1/users/me` with the user token as authentication:

```python
# ❌ WRONG APPROACH (Original Code)
async def verify_clerk_token(token: str) -> dict:
    response = await client.get(
        "https://api.clerk.com/v1/users/me",
        headers={"Authorization": f"Bearer {token}"}  # User token used incorrectly
    )
```

**Why This Failed:**
- Clerk's API endpoints expect the **Clerk Secret Key** for authentication
- User session tokens are meant for **JWT verification**, not API calls
- This is like trying to unlock a door with a key from a different building

**The Solution:**
Use proper JWT verification with Clerk's public keys (JWKS):

```python
# ✅ CORRECT APPROACH
async def verify_clerk_token(token: str) -> str:
    jwks_client = PyJWKClient("https://bold-bass-35.clerk.accounts.dev/.well-known/jwks.json")
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    payload = jwt.decode(token, signing_key.key, algorithms=["RS256"])
    return payload.get("sub")  # Returns user ID
```

---

### Second Problem: 400 "email is required"

**Error Message:**
```
Status: 400 "Bad Request"
Response: {"detail":"Invalid user data: email is required"}
```

**Root Cause:**
After fixing JWT verification, we could extract the user ID from the token, but Clerk's JWT tokens don't include email and other user details by default.

**The Solution:**
After verifying the JWT (to authenticate the request), fetch the complete user data from Clerk's API using the **Clerk Secret Key**:

```python
# Step 1: Verify JWT to get user ID
user_id = await verify_clerk_token(token)

# Step 2: Fetch full user details using Secret Key
async with httpx.AsyncClient() as client:
    response = await client.get(
        f"https://api.clerk.com/v1/users/{user_id}",
        headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
    )
    user_data = response.json()  # Contains email, name, etc.
```

---

## Architecture Overview

### System Components Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (localhost:3000)                          │  │
│  │  - Clerk Provider (ClerkProvider)                           │  │
│  │  - Sign In Page (Clerk UI Components)                       │  │
│  │  - Dashboard (Protected Route)                              │  │
│  │  - UserSync Component (Auto-sync on login)                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              ↓↑                                     │
│                    JWT Token Exchange                               │
│                              ↓↑                                     │
└──────────────────────────────┼┼─────────────────────────────────────┘
                               ↓↑
                               ↓↑ HTTP POST /api/auth/sync-user
                               ↓↑ Header: Authorization: Bearer <JWT>
                               ↓↑
┌──────────────────────────────┼┼─────────────────────────────────────┐
│                              ↓↑                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  FastAPI Backend (localhost:8000)                           │  │
│  │                                                              │  │
│  │  1. Receive JWT Token                                       │  │
│  │     ↓                                                        │  │
│  │  2. Verify JWT with JWKS (Clerk Public Keys)                │  │
│  │     ├─ Extract User ID from "sub" claim                     │  │
│  │     └─ Verify signature, expiration, issuer                 │  │
│  │     ↓                                                        │  │
│  │  3. Fetch User Details from Clerk API                       │  │
│  │     └─ Use Clerk Secret Key for authentication              │  │
│  │     ↓                                                        │  │
│  │  4. Sync User to Database                                   │  │
│  │     └─ Create or update user_preferences record             │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              ↓↑                                     │
│                    FastAPI Backend                                  │
└──────────────────────────────┼┼─────────────────────────────────────┘
                               ↓↑
                   SQL Queries (asyncpg)
                               ↓↑
┌──────────────────────────────┼┼─────────────────────────────────────┐
│                              ↓↑                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Neon PostgreSQL Database                                   │  │
│  │                                                              │  │
│  │  Tables:                                                     │  │
│  │  ├─ user_preferences (Clerk user data)                      │  │
│  │  ├─ research_memory (AI chat history)                       │  │
│  │  └─ conversation_history (Chat sessions)                    │  │
│  │                                                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                    Neon Database (Cloud)                            │
└─────────────────────────────────────────────────────────────────────┘

External Services:
┌──────────────────────────────────────────────┐
│  Clerk API (api.clerk.com)                   │
│  ├─ JWKS Endpoint (Public Keys)              │
│  └─ User API (User Details - Secret Key)     │
└──────────────────────────────────────────────┘
```

### Authentication Flow Sequence

```
User                Frontend              Backend               Clerk API           Database
 │                     │                     │                      │                  │
 │─── Visit /dashboard│                     │                      │                  │
 │                     │                     │                      │                  │
 │◄──── Redirect to   │                     │                      │                  │
 │      /sign-in       │                     │                      │                  │
 │                     │                     │                      │                  │
 │─── Enter Email ────►│                     │                      │                  │
 │                     │                     │                      │                  │
 │                     │──── Auth Request ───────────────────────►│                  │
 │                     │                     │                      │                  │
 │◄──────────────────────── Session Cookie ────────────────────────│                  │
 │                     │                     │                      │                  │
 │─── Navigate to ────►│                     │                      │                  │
 │    /dashboard       │                     │                      │                  │
 │                     │                     │                      │                  │
 │                     │ (UserSync component mounts)                │                  │
 │                     │                     │                      │                  │
 │                     │─ getToken() ────────────────────────────►│                  │
 │                     │                     │                      │                  │
 │                     │◄─── JWT Token ──────────────────────────┤                  │
 │                     │                     │                      │                  │
 │                     │─ POST /api/auth/sync-user ──►│            │                  │
 │                     │   Bearer: <JWT>     │                      │                  │
 │                     │                     │                      │                  │
 │                     │                     │─ Verify JWT ────────►│                  │
 │                     │                     │  (JWKS endpoint)     │                  │
 │                     │                     │                      │                  │
 │                     │                     │◄─ Valid (User ID) ───│                  │
 │                     │                     │                      │                  │
 │                     │                     │─ GET /v1/users/{id} ─►│                 │
 │                     │                     │  Bearer: <Secret>    │                  │
 │                     │                     │                      │                  │
 │                     │                     │◄─ User Details ──────│                  │
 │                     │                     │  (email, name, etc)  │                  │
 │                     │                     │                      │                  │
 │                     │                     │── INSERT/UPDATE ────────────────────────►│
 │                     │                     │   user_preferences   │                  │
 │                     │                     │                      │                  │
 │                     │                     │◄─── Success ─────────────────────────────│
 │                     │                     │                      │                  │
 │                     │◄─ 200 OK ───────────│                      │                  │
 │                     │   {user_data}       │                      │                  │
 │                     │                     │                      │                  │
 │◄─── Dashboard      │                     │                      │                  │
 │     Rendered        │                     │                      │                  │
 │                     │                     │                      │                  │
```

---

## Authentication Flow

### Detailed Step-by-Step Process

#### Phase 1: User Authentication (Frontend)

**Step 1: User Visits Protected Route**
- User navigates to `/dashboard`
- Next.js middleware (`middleware.ts`) checks authentication
- If not signed in → redirect to `/sign-in`

**File**: `frontend/src/middleware.ts:6-10`
```typescript
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()  // Redirects if not authenticated
  }
})
```

**Step 2: User Signs In**
- User enters credentials on `/sign-in` page
- Clerk handles authentication (OAuth, email, passkey, etc.)
- Clerk sets session cookie in browser

**File**: `frontend/src/app/sign-in/[[...sign-in]]/page.tsx:4-8`
```typescript
export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />  {/* Clerk pre-built sign-in component */}
    </div>
  )
}
```

---

#### Phase 2: User Sync to Database (Frontend → Backend)

**Step 3: Dashboard Loads with UserSync Component**
- Dashboard page renders
- `UserSync` component automatically mounts
- Component initiates sync process

**File**: `frontend/src/app/dashboard/page.tsx:19-20`
```typescript
return (
  <div>
    <UserSync />  {/* Auto-syncs user to database */}
    {/* Rest of dashboard */}
  </div>
)
```

**Step 4: Frontend Gets JWT Token**
- UserSync calls Clerk's `getToken()` method
- Clerk generates a fresh JWT session token
- Token is valid for a short period (default: 1 minute)

**File**: `frontend/src/components/UserSync.tsx:48`
```typescript
const token = await getToken()
```

**JWT Token Structure** (example):
```json
{
  "header": {
    "alg": "RS256",
    "kid": "ins_2abc123",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_2abc123xyz",          // User ID
    "iss": "https://clerk.example.com",
    "iat": 1234567890,
    "exp": 1234567950,
    "sid": "sess_abc123"
  },
  "signature": "..."
}
```

**Step 5: Frontend Sends Sync Request**
- POST request to backend `/api/auth/sync-user`
- JWT token included in Authorization header
- 10-second timeout with retry logic (max 3 attempts)

**File**: `frontend/src/components/UserSync.tsx:88-95`
```typescript
const response = await fetch(`${apiUrl}/api/auth/sync-user`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  signal: AbortSignal.timeout(10000)
})
```

---

#### Phase 3: JWT Verification (Backend)

**Step 6: Backend Receives Request**
- FastAPI route receives POST request
- Depends on `get_current_user()` for authentication
- HTTPBearer extracts token from Authorization header

**File**: `backend/app/api/routes/auth.py:30-32`
```python
@router.post("/sync-user", response_model=UserSyncResponse)
async def sync_user(
    current_user: ClerkUserData = Depends(get_current_user),
):
```

**Step 7: Extract JWT Token**
- FastAPI dependency injection system activates
- HTTPBearer security scheme extracts token

**File**: `backend/app/middleware/auth.py:180-189`
```python
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> ClerkUserData:
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
```

**Step 8: Verify JWT Signature with JWKS**
- Get Clerk's public keys from JWKS endpoint
- Extract signing key matching JWT's `kid` (key ID)
- Verify JWT signature using RSA public key
- Check expiration, issued-at time, and issuer

**File**: `backend/app/middleware/auth.py:70-106`
```python
async def verify_clerk_token(token: str) -> str:
    # Get JWKS client (cached)
    jwks_client = get_jwks_client()

    # Get the signing key from JWT's kid header
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    # Verify and decode JWT
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        options={
            "verify_signature": True,
            "verify_exp": True,
            "verify_iat": True,
        }
    )

    # Extract user ID from "sub" claim
    user_id = payload.get("sub")
    return user_id  # e.g., "user_2abc123xyz"
```

**How JWKS Works:**
1. Clerk publishes public keys at `https://<your-domain>/.well-known/jwks.json`
2. Backend downloads and caches these keys
3. Each JWT has a `kid` (key ID) in its header
4. Backend finds the matching public key
5. Uses public key to verify JWT signature
6. If signature is valid → token is authentic and unmodified

**JWKS URL Construction:**
- Extracted from publishable key: `pk_test_Ym9sZC1iYXNzLTM1LmNsZXJrLmFjY291bnRzLmRldiQ`
- Base64 decode → `bold-bass-35.clerk.accounts.dev`
- JWKS URL → `https://bold-bass-35.clerk.accounts.dev/.well-known/jwks.json`

**File**: `backend/app/middleware/auth.py:34-67`

---

#### Phase 4: Fetch User Details (Backend → Clerk API)

**Step 9: Fetch Full User Data from Clerk**
- JWT verification gave us the user ID, but not email or other details
- Call Clerk's Users API with **Clerk Secret Key** for authentication
- Get complete user profile

**File**: `backend/app/middleware/auth.py:128-177`
```python
async def fetch_clerk_user_details(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={
                "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
                "Content-Type": "application/json",
            },
        )

        if response.status_code == 200:
            return response.json()
        # ... error handling
```

**Clerk API Response** (example):
```json
{
  "id": "user_2abc123xyz",
  "email_addresses": [
    {
      "id": "email_abc",
      "email_address": "user@example.com",
      "primary": true
    }
  ],
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "created_at": 1234567890,
  "updated_at": 1234567890
}
```

**Step 10: Extract Primary Email**
- Find the email marked as primary
- Fallback to first email if no primary

**File**: `backend/app/middleware/auth.py:197-207`
```python
primary_email = None
email_addresses = user_data.get("email_addresses", [])
for email_obj in email_addresses:
    if email_obj.get("id") == user_data.get("primary_email_address_id"):
        primary_email = email_obj.get("email_address")
        break

if not primary_email and email_addresses:
    primary_email = email_addresses[0].get("email_address")
```

---

#### Phase 5: Database Sync (Backend → Neon)

**Step 11: Get or Create User in Database**
- Check if user exists by `clerk_user_id`
- If exists → update user data
- If not exists → create new user record

**File**: `backend/app/services/user_sync.py:61-132`
```python
async def get_or_create_user(session: AsyncSession, clerk_data: dict) -> UserPreferences:
    # Check if user exists
    stmt = select(UserPreferences).where(
        UserPreferences.clerk_user_id == clerk_user_id
    )
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Update existing user
        if existing_user.email != email:
            existing_user.email = email
            updated = True
        # ... update other fields

        if updated:
            await session.commit()
            await session.refresh(existing_user)

        return existing_user

    # Create new user
    new_user = UserPreferences(
        clerk_user_id=clerk_user_id,
        email=email,
        first_name=clerk_data.get("first_name"),
        last_name=clerk_data.get("last_name"),
        username=clerk_data.get("username"),
        preferences={},
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user
```

**Step 12: Return Success Response**
- Return user data to frontend
- Frontend logs success message

**File**: `backend/app/api/routes/auth.py:56-64`
```python
return UserSyncResponse(
    success=True,
    message="User synced successfully",
    clerk_user_id=user.clerk_user_id,
    email=user.email,
    first_name=user.first_name,
    last_name=user.last_name,
    username=user.username,
)
```

---

## Technical Implementation

### Frontend Implementation

#### 1. Clerk Provider Setup

**File**: `frontend/src/app/layout.tsx`

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Purpose**: Wraps entire app to provide Clerk context to all components.

---

#### 2. Route Protection Middleware

**File**: `frontend/src/middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()  // Redirect to sign-in if not authenticated
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Purpose**:
- Protects all routes except `/` and `/sign-in`
- Automatically redirects unauthenticated users
- Runs on every request via Next.js middleware

---

#### 3. UserSync Component

**File**: `frontend/src/components/UserSync.tsx`

**Key Features**:
- Automatically runs when user logs in
- Retries up to 3 times on failure
- Extensive logging for debugging
- Handles network errors and timeouts

**State Management**:
```typescript
const { userId, getToken, isLoaded } = useAuth()
const [synced, setSynced] = useState(false)
const [retryCount, setRetryCount] = useState(0)
```

**Sync Logic**:
```typescript
useEffect(() => {
  const syncUser = async () => {
    // Wait for Clerk to load
    if (!isLoaded || !userId) return

    // Don't sync if already synced
    if (synced) return

    // Max 3 retry attempts
    if (retryCount >= 3) {
      console.error('❌ User sync failed after 3 attempts')
      return
    }

    try {
      // Get JWT token
      const token = await getToken()

      // Send sync request
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setSynced(true)
      } else {
        // Retry after 2 seconds
        setTimeout(() => setRetryCount(prev => prev + 1), 2000)
      }
    } catch (error) {
      console.error('Sync error:', error)
      setTimeout(() => setRetryCount(prev => prev + 1), 2000)
    }
  }

  syncUser()
}, [userId, getToken, isLoaded, synced, retryCount])
```

**Error Handling**:
- Network errors → retry
- 401 Unauthorized → log warning
- 500 Server Error → retry
- Timeout → retry

---

### Backend Implementation

#### 1. JWT Verification with JWKS

**File**: `backend/app/middleware/auth.py`

**Dependencies**:
```python
import jwt
from jwt import PyJWKClient
from functools import lru_cache
import httpx
```

**JWKS Client (Cached)**:
```python
@lru_cache()
def get_jwks_client() -> PyJWKClient:
    """Get cached JWKS client for Clerk public keys"""
    import base64

    publishable_key = settings.CLERK_PUBLISHABLE_KEY

    # Extract base64 domain from pk_test_<base64>
    if publishable_key.startswith("pk_test_"):
        encoded_domain = publishable_key.replace("pk_test_", "")
    elif publishable_key.startswith("pk_live_"):
        encoded_domain = publishable_key.replace("pk_live_", "")
    else:
        raise ValueError("Invalid Clerk publishable key format")

    # Decode domain
    padding = 4 - (len(encoded_domain) % 4)
    if padding != 4:
        encoded_domain += "=" * padding

    domain_bytes = base64.b64decode(encoded_domain)
    clerk_domain = domain_bytes.decode("utf-8").rstrip("$")

    # Construct JWKS URL
    jwks_url = f"https://{clerk_domain}/.well-known/jwks.json"

    return PyJWKClient(jwks_url)
```

**Why Cache?**
- JWKS endpoint doesn't change often
- Reduces latency on every request
- PyJWKClient has built-in key caching

**Token Verification**:
```python
async def verify_clerk_token(token: str) -> str:
    """Verify JWT and return user ID"""
    try:
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
            }
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token: missing user ID")

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")
```

**Security Checks**:
- ✅ Signature verification (prevents tampering)
- ✅ Expiration check (prevents replay attacks)
- ✅ Issued-at time check (prevents future-dated tokens)
- ✅ Algorithm verification (prevents algorithm substitution attacks)

---

#### 2. Fetch User Details from Clerk API

**File**: `backend/app/middleware/auth.py:128-177`

```python
async def fetch_clerk_user_details(user_id: str) -> dict:
    """Fetch full user details using Clerk Secret Key"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise HTTPException(401, "Invalid Clerk Secret Key")
            elif response.status_code == 404:
                raise HTTPException(404, f"User {user_id} not found")
            else:
                raise HTTPException(500, f"Clerk API error: {response.status_code}")

    except httpx.TimeoutException:
        raise HTTPException(503, "Clerk API timeout")
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch user: {str(e)}")
```

**Why Use Secret Key Here?**
- Clerk API endpoints require server-side authentication
- Secret key proves the request is from our backend
- User tokens are only for JWT verification, not API calls

---

#### 3. Database User Sync Service

**File**: `backend/app/services/user_sync.py`

**Get or Create User**:
```python
async def get_or_create_user(
    session: AsyncSession,
    clerk_data: dict
) -> UserPreferences:
    """Sync user to database"""

    clerk_user_id = clerk_data.get("clerk_user_id")
    email = clerk_data.get("email")

    # Validation
    if not clerk_user_id:
        raise ValueError("clerk_user_id is required")
    if not email:
        raise ValueError("email is required")

    # Check if exists
    stmt = select(UserPreferences).where(
        UserPreferences.clerk_user_id == clerk_user_id
    )
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        # Update if changed
        updated = False

        if existing_user.email != email:
            existing_user.email = email
            updated = True

        if existing_user.first_name != clerk_data.get("first_name"):
            existing_user.first_name = clerk_data.get("first_name")
            updated = True

        # ... update other fields

        if updated:
            await session.commit()
            await session.refresh(existing_user)

        return existing_user

    # Create new user
    new_user = UserPreferences(
        clerk_user_id=clerk_user_id,
        email=email,
        first_name=clerk_data.get("first_name"),
        last_name=clerk_data.get("last_name"),
        username=clerk_data.get("username"),
        preferences={},
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user
```

**Why Update Existing Users?**
- Users can change their email in Clerk
- Names can be updated
- Keeps database in sync with Clerk

---

## File Structure

### Frontend Files

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Clerk Provider setup
│   │   ├── page.tsx                      # Home page (sign-in link)
│   │   ├── middleware.ts                 # Route protection
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Protected dashboard (uses UserSync)
│   │   └── sign-in/
│   │       └── [[...sign-in]]/
│   │           └── page.tsx              # Sign-in page (Clerk UI)
│   └── components/
│       └── UserSync.tsx                  # Auto-sync component
├── .env.local                            # Environment variables
└── package.json                          # Dependencies
```

### Backend Files

```
backend/
├── app/
│   ├── main.py                           # FastAPI app entry point
│   ├── config.py                         # Settings & env vars
│   ├── middleware/
│   │   └── auth.py                       # JWT verification & user fetching
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py                   # Auth endpoints (/sync-user, /me)
│   │       └── agent.py                  # AI agent endpoints
│   ├── database/
│   │   ├── connection.py                 # Database setup
│   │   └── models.py                     # SQLAlchemy models
│   └── services/
│       └── user_sync.py                  # User sync logic
├── .env                                  # Environment variables
└── pyproject.toml                        # Dependencies (uv)
```

### Key Files Explained

| File | Purpose | Key Functions |
|------|---------|---------------|
| `frontend/src/components/UserSync.tsx` | Auto-syncs user to database on login | `syncUser()` |
| `backend/app/middleware/auth.py` | JWT verification and user authentication | `verify_clerk_token()`, `fetch_clerk_user_details()`, `get_current_user()` |
| `backend/app/api/routes/auth.py` | Auth API endpoints | `sync_user()`, `get_current_user_info()` |
| `backend/app/services/user_sync.py` | Database user operations | `get_or_create_user()` |
| `backend/app/database/models.py` | Database schema definitions | `UserPreferences`, `ResearchMemory` |

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and **npm** or **pnpm**
- **Python** 3.13+
- **uv** (Python package manager)
- **PostgreSQL** database (Neon or local)
- **Clerk** account

### Step 1: Create Clerk Application

1. Go to [clerk.com](https://clerk.com) and create account
2. Create new application
3. Choose authentication methods (Email, Google, GitHub, etc.)
4. Copy these keys from Dashboard:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

### Step 2: Setup Neon Database

1. Go to [neon.tech](https://neon.tech) and create account
2. Create new project
3. Copy connection string: `postgresql://user:pass@host/db?ssl=require`

### Step 3: Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies with uv
uv sync

# Create .env file
cat > .env << EOF
# Application
ENVIRONMENT=development

# Clerk
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Database
DATABASE_URL=postgresql://user:pass@host/db?ssl=require

# AI (optional)
GEMINI_API_KEY=your_gemini_key

# CORS
ALLOWED_ORIGINS=http://localhost:3000
EOF

# Run database migrations (creates tables)
# Tables are auto-created on first run via SQLAlchemy

# Start backend
uv run python -m app.main
# Or with uvicorn:
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend should now be running on `http://localhost:8000`

### Step 4: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
# or
pnpm install

# Create .env.local file
cat > .env.local << EOF
# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Start development server
npm run dev
# or
pnpm dev
```

Frontend should now be running on `http://localhost:3000`

### Step 5: Test the Integration

1. **Open browser**: Go to `http://localhost:3000`
2. **Click "Sign In"**: Creates Clerk account
3. **Complete sign-in**: Enter email and verify
4. **Redirected to Dashboard**: UserSync component runs automatically
5. **Check console**: Should see "✅ SUCCESS! User synced to database!"
6. **Verify database**: Check Neon dashboard for new user record in `user_preferences` table

### Step 6: Verify Database

**Option 1: Neon Dashboard**
- Go to Neon console
- Navigate to Tables → `user_preferences`
- Should see your user record

**Option 2: SQL Query**
```sql
SELECT * FROM user_preferences;
```

**Expected Result**:
| id | clerk_user_id | email | first_name | last_name | username | created_at |
|----|---------------|-------|------------|-----------|----------|------------|
| 1  | user_2abc... | test@example.com | John | Doe | johndoe | 2025-01-15... |

---

## Environment Variables

### Frontend `.env.local`

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Ym9sZC1iYXNzLTM1LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_VAXAbDatNY53IYUnNQUyjSk2H2VrbyWxoXWlPEEgHT

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production Example:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Backend `.env`

```bash
# Application Settings
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_Ym9sZC1iYXNzLTM1LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_VAXAbDatNY53IYUnNQUyjSk2H2VrbyWxoXWlPEEgHT

# Database - Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:password@ep-host.neon.tech/neondb?ssl=require

# AI - Google Gemini
GEMINI_API_KEY=AIzaSyDESNAAaLYcjbA88TIPn0Ms2SczGbfN8ec
GEMINI_MODEL=gemini-2.5-flash

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Required vs Optional

| Variable | Required | Purpose |
|----------|----------|---------|
| `CLERK_PUBLISHABLE_KEY` | ✅ Yes | JWKS URL construction |
| `CLERK_SECRET_KEY` | ✅ Yes | Fetch user details from Clerk API |
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL connection |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Frontend Clerk initialization |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API endpoint |
| `GEMINI_API_KEY` | ⚠️ Optional | Only needed for AI features |
| `ALLOWED_ORIGINS` | ✅ Yes | CORS security |

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/sync-user`

**Purpose**: Sync authenticated user to database

**Authentication**: Required (JWT Bearer token)

**Request**:
```http
POST /api/auth/sync-user HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Response** (Success):
```json
{
  "success": true,
  "message": "User synced successfully",
  "clerk_user_id": "user_2abc123xyz",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe"
}
```

**Response** (Error - No Auth):
```json
{
  "detail": "Authentication required. Please provide a valid Bearer token."
}
```

**Response** (Error - Invalid Token):
```json
{
  "detail": "Invalid token: Signature verification failed"
}
```

**Response** (Error - Missing Email):
```json
{
  "detail": "Invalid user data: email is required"
}
```

---

#### `GET /api/auth/me`

**Purpose**: Get current authenticated user info

**Authentication**: Required (JWT Bearer token)

**Request**:
```http
GET /api/auth/me HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "clerk_user_id": "user_2abc123xyz",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe"
}
```

---

### Health Endpoints

#### `GET /health`

**Purpose**: Check backend health

**Authentication**: Not required

**Response**:
```json
{
  "status": "healthy"
}
```

---

#### `GET /`

**Purpose**: API info

**Response**:
```json
{
  "message": "Personal Research Assistant API",
  "version": "0.1.0",
  "docs": "/docs"
}
```

---

## Database Schema

### Table: `user_preferences`

**Purpose**: Store Clerk user data and preferences

```sql
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    username VARCHAR UNIQUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clerk_user_id ON user_preferences(clerk_user_id);
CREATE INDEX idx_email ON user_preferences(email);
CREATE INDEX idx_username ON user_preferences(username);
```

**Columns**:
| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | No | Auto-increment primary key |
| `clerk_user_id` | VARCHAR | No | Clerk user ID (e.g., `user_2abc123xyz`) |
| `email` | VARCHAR | No | User's primary email |
| `first_name` | VARCHAR | Yes | User's first name |
| `last_name` | VARCHAR | Yes | User's last name |
| `username` | VARCHAR | Yes | User's username |
| `preferences` | JSONB | No | User settings (default: `{}`) |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

**Indexes**:
- Primary key on `id`
- Unique index on `clerk_user_id` (fast lookups)
- Unique index on `email` (prevent duplicates)
- Unique index on `username` (prevent duplicates)

---

### Table: `research_memory`

**Purpose**: Store AI research queries and responses

```sql
CREATE TABLE research_memory (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_id ON research_memory(user_id);
```

---

### Table: `conversation_history`

**Purpose**: Store chat conversation history

```sql
CREATE TABLE conversation_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    session_id VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    extra_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_session ON conversation_history(user_id, session_id);
```

---

## Troubleshooting Guide

### Error: 401 "Invalid or expired Clerk token"

**Symptom**:
```
Status: 401 "Unauthorized"
Response: {"detail":"Invalid or expired Clerk token"}
```

**Possible Causes**:

1. **Wrong JWKS URL**
   - Check `CLERK_PUBLISHABLE_KEY` in backend `.env`
   - Should match frontend key
   - Verify JWKS URL is accessible

   **Test**:
   ```bash
   # Extract domain from publishable key
   echo "pk_test_Ym9sZC1iYXNzLTM1LmNsZXJrLmFjY291bnRzLmRldiQ" | \
     base64 -d
   # Should output: bold-bass-35.clerk.accounts.dev$

   # Test JWKS endpoint
   curl https://bold-bass-35.clerk.accounts.dev/.well-known/jwks.json
   # Should return JSON with public keys
   ```

2. **Token Expired**
   - Clerk tokens expire quickly (default: 1 minute)
   - Frontend should request fresh token on each request

   **Fix**: Use `await getToken()` right before API call

3. **Clock Skew**
   - Server time mismatch can cause exp/iat validation failures

   **Fix**: Sync server time with NTP

4. **Wrong Algorithm**
   - Ensure JWT uses RS256 (RSA + SHA256)

   **Check**: Decode JWT header and verify `"alg": "RS256"`

---

### Error: 400 "email is required"

**Symptom**:
```
Status: 400 "Bad Request"
Response: {"detail":"Invalid user data: email is required"}
```

**Possible Causes**:

1. **Clerk API Not Called**
   - Backend is not fetching user details from Clerk
   - Only have user ID from JWT, not email

   **Fix**: Ensure `fetch_clerk_user_details()` is called in `get_current_user()`

2. **Invalid Clerk Secret Key**
   - Clerk API returns 401 when secret key is wrong
   - Email fetch fails

   **Test**:
   ```bash
   curl -H "Authorization: Bearer sk_test_YOUR_SECRET" \
        https://api.clerk.com/v1/users/user_2abc123xyz
   # Should return user data
   ```

3. **User Has No Email**
   - User signed up without email (e.g., OAuth only)

   **Fix**: Make email optional or require email in Clerk settings

---

### Error: 503 "Clerk API timeout"

**Symptom**:
```
Status: 503 "Service Unavailable"
Response: {"detail":"Clerk API timeout. Please try again."}
```

**Possible Causes**:

1. **Network Issues**
   - Backend can't reach Clerk API

   **Test**:
   ```bash
   curl -I https://api.clerk.com/v1/users
   # Should get response (even if 401)
   ```

2. **Timeout Too Short**
   - Default: 10 seconds
   - Increase if Clerk API is slow

   **Fix**: Change timeout in `fetch_clerk_user_details()`:
   ```python
   async with httpx.AsyncClient(timeout=30.0) as client:
   ```

---

### Error: CORS Policy Blocked

**Symptom**:
```
Access to fetch at 'http://localhost:8000/api/auth/sync-user' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Fix**:

1. Check backend `.env`:
   ```bash
   ALLOWED_ORIGINS=http://localhost:3000
   ```

2. Restart backend after changing `.env`

3. For multiple origins:
   ```bash
   ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
   ```

---

### Error: Cannot Connect to Database

**Symptom**:
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Possible Causes**:

1. **Wrong Database URL**
   - Check `DATABASE_URL` format
   - Should include `?ssl=require` for Neon

   **Correct Format**:
   ```
   postgresql://user:pass@host.neon.tech/dbname?ssl=require
   ```

2. **Neon Database Suspended**
   - Free tier suspends after inactivity

   **Fix**: Wake database in Neon dashboard

3. **Firewall Blocking**
   - Check if port 5432 is open

   **Test**:
   ```bash
   nc -zv ep-host.neon.tech 5432
   ```

---

### Debug Checklist

When authentication fails, check these in order:

- [ ] **Frontend can reach backend**
  ```bash
  curl http://localhost:8000/health
  # Should return {"status":"healthy"}
  ```

- [ ] **Clerk is configured**
  - Frontend: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set
  - Backend: `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` set
  - Keys match between frontend and backend

- [ ] **JWKS URL is accessible**
  ```bash
  # Extract domain from publishable key and test
  curl https://YOUR_CLERK_DOMAIN/.well-known/jwks.json
  ```

- [ ] **Token is being sent**
  - Check browser Network tab
  - Look for `Authorization: Bearer ...` header

- [ ] **Database is reachable**
  ```bash
  # From backend container/server
  psql "postgresql://user:pass@host/db?ssl=require"
  ```

- [ ] **Tables exist**
  ```sql
  \dt  -- List tables
  -- Should see: user_preferences, research_memory, conversation_history
  ```

- [ ] **Backend logs**
  - Check for error messages
  - Look for JWT verification failures

- [ ] **Frontend console**
  - Check UserSync component logs
  - Look for network errors

---

## Best Practices

### Security

1. **Never Expose Secret Keys**
   - ❌ Don't commit `.env` files
   - ✅ Use `.env.local` (gitignored)
   - ✅ Use environment variables in production

2. **Use HTTPS in Production**
   - ❌ Don't use `http://` for production API
   - ✅ Always use `https://` for production

3. **Validate JWT Claims**
   - ✅ Always verify signature
   - ✅ Check expiration (exp)
   - ✅ Check issued-at (iat)
   - ✅ Verify issuer (iss)

4. **Rate Limiting**
   - Add rate limiting to `/api/auth/sync-user`
   - Prevent abuse and DDoS

5. **CORS Configuration**
   - Only allow specific origins
   - Don't use `*` in production

### Performance

1. **Cache JWKS Keys**
   - ✅ Use `@lru_cache()` for `get_jwks_client()`
   - Reduces latency on every request

2. **Database Connection Pooling**
   - SQLAlchemy has built-in pooling
   - Adjust pool size for production:
     ```python
     engine = create_async_engine(
         DATABASE_URL,
         pool_size=20,
         max_overflow=10
     )
     ```

3. **Async/Await**
   - ✅ Use async database queries
   - ✅ Use async HTTP requests
   - Improves concurrency

4. **Index Database Queries**
   - ✅ Index `clerk_user_id`, `email`, `username`
   - Fast lookups for user sync

### Code Organization

1. **Separate Concerns**
   - ✅ JWT verification in `middleware/auth.py`
   - ✅ User sync logic in `services/user_sync.py`
   - ✅ API routes in `api/routes/`

2. **Error Handling**
   - ✅ Use specific HTTP status codes
   - ✅ Provide helpful error messages
   - ✅ Log errors for debugging

3. **Type Hints**
   - ✅ Use Pydantic models for request/response
   - ✅ Use type hints in Python functions
   - ✅ Use TypeScript in frontend

### Testing

1. **Unit Tests**
   ```python
   # Test JWT verification
   def test_verify_token():
       token = "valid_jwt_token"
       user_id = await verify_clerk_token(token)
       assert user_id == "user_2abc123xyz"
   ```

2. **Integration Tests**
   ```python
   # Test user sync endpoint
   async def test_sync_user():
       response = client.post(
           "/api/auth/sync-user",
           headers={"Authorization": f"Bearer {token}"}
       )
       assert response.status_code == 200
       assert response.json()["success"] == True
   ```

3. **Frontend Tests**
   ```typescript
   // Test UserSync component
   test('UserSync syncs user on mount', async () => {
       render(<UserSync />)
       await waitFor(() => {
           expect(fetch).toHaveBeenCalledWith(
               '/api/auth/sync-user',
               expect.objectContaining({
                   headers: expect.objectContaining({
                       'Authorization': expect.stringContaining('Bearer')
                   })
               })
           )
       })
   })
   ```

---

## Quick Reference

### Common Commands

```bash
# Backend
cd backend
uv sync                          # Install dependencies
uv run python -m app.main        # Start backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install                      # Install dependencies
npm run dev                      # Start dev server
npm run build                    # Build for production

# Database
psql "postgresql://..."          # Connect to database
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **JWT** | JSON Web Token - cryptographically signed user session token |
| **JWKS** | JSON Web Key Set - Clerk's public keys for JWT verification |
| **RS256** | RSA + SHA256 - asymmetric signing algorithm |
| **Bearer Token** | HTTP authentication scheme using JWT |
| **Clerk Secret Key** | Server-side API key for Clerk API calls |
| **User ID** | Clerk's unique identifier (e.g., `user_2abc123xyz`) |

### Authentication Summary

```
User Signs In
    ↓
Clerk Issues Session Cookie
    ↓
Frontend Calls getToken()
    ↓
Clerk Returns JWT (1-min expiry)
    ↓
Frontend Sends JWT to Backend
    ↓
Backend Verifies JWT with JWKS
    ↓
Backend Extracts User ID
    ↓
Backend Fetches User Details (Clerk API + Secret Key)
    ↓
Backend Syncs User to Database
    ↓
Return Success Response
```

### File Locations Quick Reference

| What | Where |
|------|-------|
| JWT Verification | `backend/app/middleware/auth.py:70` |
| User Data Fetch | `backend/app/middleware/auth.py:128` |
| Database Sync | `backend/app/services/user_sync.py:61` |
| Sync Endpoint | `backend/app/api/routes/auth.py:30` |
| UserSync Component | `frontend/src/components/UserSync.tsx:12` |
| Route Protection | `frontend/src/middleware.ts:6` |

---

## Conclusion

This authentication system provides:

✅ **Secure**: JWT verification with public key cryptography
✅ **Scalable**: Async/await for high concurrency
✅ **Maintainable**: Clear separation of concerns
✅ **Debuggable**: Extensive logging and error messages
✅ **Production-Ready**: Best practices for security and performance

### What We Solved

1. **Problem**: Backend incorrectly verifying user tokens
   - **Solution**: JWT verification with JWKS

2. **Problem**: Email not in JWT token
   - **Solution**: Fetch full user details from Clerk API

3. **Problem**: Users not syncing to database
   - **Solution**: Automatic UserSync component on dashboard

### Next Steps

- [ ] Add refresh token rotation
- [ ] Implement rate limiting
- [ ] Add user profile update endpoint
- [ ] Create webhook for Clerk events (user.updated, user.deleted)
- [ ] Add user preferences management
- [ ] Implement user deletion (GDPR compliance)

---

## Complete .env Configuration Guide

This section provides comprehensive, copy-paste ready .env file templates and step-by-step instructions for obtaining all required keys.

### Frontend Environment Variables (`.env.local`)

**Location**: `frontend/.env.local`

**Important**: This file should be in the `frontend/` directory root, NOT committed to git.

#### Complete Template (Copy-Paste Ready)

```bash
# ============================================
# CLERK AUTHENTICATION
# ============================================
# Get these from: https://dashboard.clerk.com/
# Navigate to: Your App → API Keys

# Publishable Key (Safe to expose in browser)
# Format: pk_test_... (development) or pk_live_... (production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Secret Key (NEVER expose in browser, only for server-side Next.js)
# Format: sk_test_... (development) or sk_live_... (production)
CLERK_SECRET_KEY=

# ============================================
# BACKEND API CONFIGURATION
# ============================================

# Development: Local backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production: Your deployed backend
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# ============================================
# OPTIONAL: DEVELOPMENT SETTINGS
# ============================================

# Enable debug logging (optional)
# NEXT_PUBLIC_DEBUG=true

# API timeout in milliseconds (optional, default: 10000)
# NEXT_PUBLIC_API_TIMEOUT=10000
```

#### Variable Explanations

| Variable | Required | Exposed to Browser? | Purpose |
|----------|----------|---------------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | ✅ Yes | Initializes Clerk SDK in browser. Used for authentication UI and session management. |
| `CLERK_SECRET_KEY` | ✅ Yes | ❌ No | Server-side only. Used in Next.js API routes or server components (not used in this project, but recommended to have). |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | ✅ Yes | Backend API base URL. UserSync component uses this to call `/api/auth/sync-user`. |

**Important Notes**:
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Variables without the prefix are only available server-side
- `CLERK_SECRET_KEY` in frontend is only for Next.js API routes (server-side)
- The publishable key can be safely exposed in browser JavaScript

---

### Backend Environment Variables (`.env`)

**Location**: `backend/.env`

**Important**: This file should be in the `backend/` directory root, NOT committed to git.

#### Complete Template (Copy-Paste Ready)

```bash
# ============================================
# APPLICATION SETTINGS
# ============================================

# Environment: development, staging, production
ENVIRONMENT=development

# Server host (0.0.0.0 allows external connections)
HOST=0.0.0.0

# Server port
PORT=8000

# ============================================
# CLERK AUTHENTICATION
# ============================================
# Get these from: https://dashboard.clerk.com/
# Navigate to: Your App → API Keys

# Publishable Key (used to construct JWKS URL)
# Format: pk_test_... (development) or pk_live_... (production)
# MUST match the frontend publishable key
CLERK_PUBLISHABLE_KEY=

# Secret Key (used to fetch user details from Clerk API)
# Format: sk_test_... (development) or sk_live_... (production)
# MUST be kept secret, never expose in client code
CLERK_SECRET_KEY=

# ============================================
# DATABASE - NEON POSTGRESQL
# ============================================
# Get this from: https://console.neon.tech/
# Navigate to: Your Project → Connection Details

# Connection String Format:
# postgresql://[user]:[password]@[host]/[database]?ssl=require
#
# Example:
# postgresql://neondb_owner:npg_ABC123xyz@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?ssl=require
#
# IMPORTANT: Must include "?ssl=require" at the end for Neon
DATABASE_URL=

# ============================================
# AI - GOOGLE GEMINI (OPTIONAL)
# ============================================
# Get this from: https://aistudio.google.com/app/apikey
# Only required if using AI research features

# Gemini API Key
GEMINI_API_KEY=AIzaSyDESNAAaLYcjbA88TIPn0Ms2SczGbfN8ec

# Model to use (gemini-2.5-flash, gemini-pro, etc.)
GEMINI_MODEL=gemini-2.5-flash

# ============================================
# CORS CONFIGURATION
# ============================================
# Comma-separated list of allowed origins
# Development: Include localhost:3000
# Production: Include your production frontend domain

# Development
ALLOWED_ORIGINS=http://localhost:3000

# Production (example)
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Multiple origins (development + production)
# ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# ============================================
# OPTIONAL: ADVANCED SETTINGS
# ============================================

# Database connection pool size (optional, default: 5)
# DB_POOL_SIZE=20

# Database max overflow (optional, default: 10)
# DB_MAX_OVERFLOW=20

# Log level: DEBUG, INFO, WARNING, ERROR (optional, default: INFO)
# LOG_LEVEL=DEBUG

# Enable SQL query logging (optional, default: false in production)
# SQL_ECHO=true
```

#### Variable Explanations

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `ENVIRONMENT` | ⚠️ Optional | Controls debug features, SQL logging. Use `development` locally, `production` on server. | Set manually |
| `HOST` | ⚠️ Optional | Server bind address. `0.0.0.0` = all interfaces, `127.0.0.1` = localhost only. | Set manually |
| `PORT` | ⚠️ Optional | Server port. Default: 8000. | Set manually |
| `CLERK_PUBLISHABLE_KEY` | ✅ Yes | Constructs JWKS URL for JWT verification. MUST match frontend key. | [Clerk Dashboard](https://dashboard.clerk.com/) → API Keys |
| `CLERK_SECRET_KEY` | ✅ Yes | Authenticates backend requests to Clerk API to fetch user details. | [Clerk Dashboard](https://dashboard.clerk.com/) → API Keys |
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string. MUST include `?ssl=require` for Neon. | [Neon Console](https://console.neon.tech/) → Connection Details |
| `GEMINI_API_KEY` | ⚠️ Optional | Google Gemini API access. Only needed for AI features. | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | ⚠️ Optional | Which Gemini model to use. | See [Google AI Models](https://ai.google.dev/models) |
| `ALLOWED_ORIGINS` | ✅ Yes | CORS whitelist. Prevents unauthorized domains from calling your API. | Set to your frontend URL(s) |

---

### Step-by-Step: How to Get Each Key

#### 1. Get Clerk Keys (Publishable & Secret)

**Step 1**: Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)

**Step 2**: Sign in or create account

**Step 3**: Create a new application (or select existing)
- Click "Add Application"
- Enter application name (e.g., "Personal Research Assistant")
- Choose authentication methods:
  - ✅ Email
  - ✅ Google
  - ✅ GitHub
  - (Select what you want to support)
- Click "Create Application"

**Step 4**: Copy API Keys
- After creation, you'll see the "API Keys" page
- Copy **Publishable Key**: `pk_test_...`
- Copy **Secret Key**: `sk_test_...` (click "Reveal" to see it)

**Step 5**: Paste into .env files
- **Frontend** `.env.local`: Paste publishable key into `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Frontend** `.env.local`: Paste secret key into `CLERK_SECRET_KEY` (for Next.js API routes)
- **Backend** `.env`: Paste publishable key into `CLERK_PUBLISHABLE_KEY`
- **Backend** `.env`: Paste secret key into `CLERK_SECRET_KEY`

**Important**: The publishable key MUST be the same in both frontend and backend!

**Visual Guide**:
```
Clerk Dashboard → [Your App] → "API Keys" tab
├─ Publishable Key: pk_test_ABC123...
│  ├─ Frontend: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
│  └─ Backend:  CLERK_PUBLISHABLE_KEY
│
└─ Secret Key: sk_test_XYZ789...
   ├─ Frontend: CLERK_SECRET_KEY (optional, for Next.js API routes)
   └─ Backend:  CLERK_SECRET_KEY (required, for user data fetch)
```

---

#### 2. Get Neon Database URL

**Step 1**: Go to [https://neon.tech/](https://neon.tech/)

**Step 2**: Sign in or create account (free tier available)

**Step 3**: Create a new project
- Click "Create Project"
- Enter project name (e.g., "research-assistant-db")
- Choose region (closest to your users)
- Choose PostgreSQL version (14+ recommended)
- Click "Create Project"

**Step 4**: Get connection string
- After creation, go to project dashboard
- Click "Connection Details" or "Connect"
- Copy the connection string

**Step 5**: Format check
- Connection string should look like:
  ```
  postgresql://username:password@host.region.aws.neon.tech/dbname?ssl=require
  ```
- **MUST** end with `?ssl=require` for Neon
- If missing, add it manually

**Step 6**: Paste into backend `.env`
```bash
DATABASE_URL=postgresql://neondb_owner:npg_ABC@ep-cool-123.us-east-1.aws.neon.tech/neondb?ssl=require
```

**Common Connection String Formats**:

✅ **Correct** (Pooled connection):
```
postgresql://user:pass@ep-name-123456-pooler.us-east-1.aws.neon.tech/neondb?ssl=require
```

✅ **Correct** (Direct connection):
```
postgresql://user:pass@ep-name-123456.us-east-1.aws.neon.tech/neondb?ssl=require
```

❌ **Wrong** (Missing SSL):
```
postgresql://user:pass@ep-name-123456.us-east-1.aws.neon.tech/neondb
```

❌ **Wrong** (Wrong protocol):
```
postgres://user:pass@ep-name-123456.us-east-1.aws.neon.tech/neondb?ssl=require
```
Should be `postgresql://` not `postgres://` for asyncpg

**Tip**: Use the "Pooled connection" string for better performance in production.

---

#### 3. Get Google Gemini API Key (Optional)

**Step 1**: Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

**Step 2**: Sign in with Google account

**Step 3**: Create API key
- Click "Create API Key"
- Select project or create new one
- Click "Create API Key in new/existing project"
- Copy the generated key (starts with `AIzaSy...`)

**Step 4**: Paste into backend `.env`
```bash
GEMINI_API_KEY=AIzaSyDESNAAaLYcjbA88TIPn0Ms2SczGbfN8ec
```

**Step 5**: (Optional) Choose model
```bash
GEMINI_MODEL=gemini-2.5-flash
```

**Available Models**:
- `gemini-2.5-flash` - Fast, cost-effective (recommended)
- `gemini-2.0-flash-exp` - Experimental, latest features
- `gemini-1.5-pro` - More capable, higher cost
- See [Google AI Models](https://ai.google.dev/models) for full list

**Pricing**: Check [Google AI Pricing](https://ai.google.dev/pricing) for current rates. Free tier available.

---

### Common Mistakes & How to Fix Them

#### ❌ Mistake 1: Wrong Variable Names

**Error**:
```bash
# Frontend .env.local
CLERK_PUBLISHABLE_KEY=pk_test_...  # ❌ WRONG
```

**Fix**:
```bash
# Frontend .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # ✅ CORRECT
```

**Why**: Next.js only exposes variables prefixed with `NEXT_PUBLIC_` to the browser.

---

#### ❌ Mistake 2: Publishable Keys Don't Match

**Error**:
```bash
# Frontend .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ABC123...

# Backend .env
CLERK_PUBLISHABLE_KEY=pk_test_XYZ789...  # ❌ Different key!
```

**Fix**: Use the SAME publishable key in both files:
```bash
# Frontend .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ABC123...

# Backend .env
CLERK_PUBLISHABLE_KEY=pk_test_ABC123...  # ✅ Same key
```

**Why**: The JWKS URL is derived from the publishable key. If they don't match, JWT verification will fail.

---

#### ❌ Mistake 3: Missing SSL Parameter in Database URL

**Error**:
```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/db  # ❌ No SSL
```

**Fix**:
```bash
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?ssl=require  # ✅ SSL added
```

**Why**: Neon requires SSL connections. Without it, you'll get connection errors.

---

#### ❌ Mistake 4: Wrong CORS Origins

**Error**:
```bash
# Backend .env
ALLOWED_ORIGINS=localhost:3000  # ❌ Missing protocol
```

**Fix**:
```bash
# Backend .env
ALLOWED_ORIGINS=http://localhost:3000  # ✅ With protocol
```

**Why**: CORS checks the full origin including protocol. `localhost:3000` ≠ `http://localhost:3000`

---

#### ❌ Mistake 5: Exposing Secret Keys in Frontend

**Error**:
```bash
# Frontend .env.local
NEXT_PUBLIC_CLERK_SECRET_KEY=sk_test_...  # ❌ DANGEROUS!
```

**Fix**: Never use `NEXT_PUBLIC_` prefix for secret keys:
```bash
# Frontend .env.local
CLERK_SECRET_KEY=sk_test_...  # ✅ Server-side only
```

**Why**: `NEXT_PUBLIC_` makes the variable accessible in browser JavaScript, exposing your secret key to anyone who views your site's source code.

---

#### ❌ Mistake 6: Forgetting to Restart Server After .env Changes

**Error**: Changed `.env` but backend still uses old values

**Fix**: Always restart the server after editing `.env`:
```bash
# Stop server (Ctrl+C)
# Then restart:
uv run python -m app.main
```

**Why**: Environment variables are loaded once at startup. Changes don't apply until restart.

---

### Environment-Specific Configurations

#### Development Environment

**Frontend** `.env.local`:
```bash
# Clerk - Development Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend - Local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Debug
NEXT_PUBLIC_DEBUG=true
```

**Backend** `.env`:
```bash
# Application
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000

# Clerk - Development Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database - Development
DATABASE_URL=postgresql://user:pass@localhost/devdb?ssl=require

# CORS - Allow localhost
ALLOWED_ORIGINS=http://localhost:3000
```

---

#### Production Environment

**Frontend** `.env.production.local`:
```bash
# Clerk - Production Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Backend - Production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Debug - OFF
NEXT_PUBLIC_DEBUG=false
```

**Backend** `.env` (production):
```bash
# Application
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000

# Clerk - Production Keys
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database - Production
DATABASE_URL=postgresql://user:pass@host.neon.tech/proddb?ssl=require

# CORS - Production domains only
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Performance tuning
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
```

**Important Production Changes**:
1. Use `pk_live_` and `sk_live_` keys (not `pk_test_`)
2. Use HTTPS URLs (not HTTP)
3. Restrict CORS to specific domains (not localhost)
4. Set `ENVIRONMENT=production`
5. Disable debug logging

---

### Security Checklist

#### ✅ Do This:

- [x] Add `.env` and `.env.local` to `.gitignore`
- [x] Use different keys for development and production
- [x] Rotate secret keys periodically (every 90 days)
- [x] Use environment variables in CI/CD (GitHub Secrets, Vercel env vars, etc.)
- [x] Restrict CORS to specific domains in production
- [x] Use HTTPS in production (not HTTP)
- [x] Keep secret keys in password manager

#### ❌ Never Do This:

- [ ] Commit `.env` files to git
- [ ] Share secret keys via email or Slack
- [ ] Use production keys in development
- [ ] Expose `CLERK_SECRET_KEY` with `NEXT_PUBLIC_` prefix
- [ ] Use `ALLOWED_ORIGINS=*` in production
- [ ] Hardcode API keys in source code
- [ ] Use the same database for development and production

---

### .gitignore Configuration

Make sure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Backend
backend/.env
backend/.env.*

# Frontend
frontend/.env.local
frontend/.env.development.local
frontend/.env.production.local

# Never commit these
*.key
*.pem
secrets/
```

---

### Quick Setup Script

For fast setup, create these files:

**Frontend** `.env.local`:
```bash
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
```

**Backend** `.env`:
```bash
cat > backend/.env << 'EOF'
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
DATABASE_URL=your_database_url_here
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:3000
EOF
```

Then edit the files and replace `your_*_here` with actual values.

---

### Verification Checklist

After setting up `.env` files, verify:

**Frontend**:
```bash
cd frontend

# Check if .env.local exists
ls -la .env.local

# Verify variables are loaded (in Next.js app)
# Add this to any component temporarily:
console.log('Clerk Key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

**Backend**:
```bash
cd backend

# Check if .env exists
ls -la .env

# Test environment loading
uv run python -c "from app.config import get_settings; s = get_settings(); print('Clerk Key:', s.CLERK_PUBLISHABLE_KEY); print('Database:', s.DATABASE_URL)"
```

**Expected Output**:
```
Clerk Key: pk_test_Ym9sZC1iYXNzLTM1LmNsZXJrLmFjY291bnRzLmRldiQ
Database: postgresql://neondb_owner:***@ep-host.neon.tech/neondb?ssl=require
```

If you see the actual values (not "None" or errors), your .env is configured correctly!

---

### Troubleshooting .env Issues

#### Problem: Variables Not Loading

**Symptoms**:
- `process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` returns `undefined`
- Python raises `ValidationError: CLERK_SECRET_KEY field required`

**Solutions**:

1. **Check file location**:
   ```bash
   # Frontend .env.local should be in frontend/ root
   ls frontend/.env.local

   # Backend .env should be in backend/ root
   ls backend/.env
   ```

2. **Check file naming**:
   - Frontend: Must be `.env.local` (not `.env` or `env.local`)
   - Backend: Must be `.env` (not `.env.local`)

3. **Check syntax**:
   ```bash
   # ✅ Correct
   CLERK_SECRET_KEY=sk_test_ABC123

   # ❌ Wrong (spaces around =)
   CLERK_SECRET_KEY = sk_test_ABC123

   # ❌ Wrong (quotes not needed)
   CLERK_SECRET_KEY="sk_test_ABC123"
   ```

4. **Restart development servers**:
   ```bash
   # Stop both servers (Ctrl+C)
   # Then restart:
   cd backend && uv run python -m app.main &
   cd frontend && npm run dev
   ```

5. **Check .gitignore** (make sure .env files aren't ignored when you need them):
   ```bash
   # Should NOT ignore .env.example (template files)
   # Should ignore .env and .env.local (actual secrets)
   cat .gitignore | grep env
   ```

---

### Template Files for Teams

Create template files that CAN be committed to git:

**Frontend** `.env.example`:
```bash
# Copy this file to .env.local and fill in your values
# cp .env.example .env.local

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** `.env.example`:
```bash
# Copy this file to .env and fill in your values
# cp .env.example .env

ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000

CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

DATABASE_URL=postgresql://user:pass@host.neon.tech/db?ssl=require

GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash

ALLOWED_ORIGINS=http://localhost:3000
```

**Usage**:
```bash
# New team member setup:
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Then edit and add real values
```

---

**For Questions or Issues**: Check troubleshooting section or review error logs

**Last Updated**: 2025-10-15
**Version**: 1.0.0
