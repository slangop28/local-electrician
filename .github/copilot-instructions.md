# AI Coding Agent Instructions - Local Electrician

## Project Overview
**Local Electrician** is a Next.js 16 platform connecting customers with KYC-verified electricians in India. The architecture uses a hybrid data persistence model: **Google Sheets** for authentication/user management, **Supabase** for real-time service requests and live tracking, and **Firebase** for social authentication.

## Architecture & Data Flow

### Core Systems
1. **Authentication (Google Sheets + Firebase)**
   - Hybrid: Firebase handles phone/social auth, Google Sheets stores user profiles
   - OTP flow: `/api/auth/send-otp` → Fast2SMS → hash validation → `/api/auth/verify-otp` → user lookup/creation
   - Session validation via `AuthContext.tsx` - validates once per hour, stores profile in localStorage
   - `UserProfile` interface in `AuthContext.tsx` defines user data structure across the app

2. **Service Requests (Supabase)**
   - Real-time updates via Supabase listeners
   - Tables: `service_requests`, `service_request_logs`, `electricians`, `customers`
   - Deterministic IDs: `generateId()` produces `PREFIX-YYYYMMDD-XXXX` format (see `src/lib/utils.ts`)
   - Two request types: Direct requests (to specific electrician) and Broadcast requests (to nearby electricians)

3. **File Storage**
   - Documents (KYC, bank details): Cloudinary (`src/lib/cloudinary.ts`)
   - Location data: Google Drive (`src/lib/google-drive.ts`)
   - Spreadsheet access: Google Sheets service account (see `src/lib/google-sheets.ts`)

### Provider Hierarchy (see `src/app/layout.tsx`)
```
<AuthProvider>           // Auth state + user profile
  <ToastProvider>        // Toast notifications
    <GoogleMapsProvider> // Google Maps API
      <children />
    </GoogleMapsProvider>
  </ToastProvider>
</AuthProvider>
```

## Critical Patterns & Conventions

### API Route Conventions
- **Location**: `src/app/api/[domain]/[action]/route.ts` (Next.js App Router)
- **Domains**: `auth/`, `electrician/`, `customer/`, `request/`, `admin/`, `debug/`
- **Pattern**: POST requests return `{ success: boolean, error?: string, data?: unknown }`
- **Authentication**: No built-in auth middleware - validate user context in route handlers
- **Database access**: Use `supabaseAdmin` (service role) for server-side DB writes, bypassing RLS

### Component & Client Patterns
- **Client Components**: Mark with `'use client'` (all interactive components must have this)
- **Context Hook**: `useAuth()` from `AuthContext.tsx` provides `{ user, userProfile, isAuthenticated, logout }`
- **State Management**: React hooks only - no Redux/Zustand
- **Maps**: Use `<GoogleMapsProvider>` wrapper, then access via React context

### Google Sheets Structure (Database)
Source: `src/lib/google-sheets.ts` defines `SHEET_TABS`:
- **Electricians**: ElectricianID, Name, Phone, Email, Status (PENDING/VERIFIED/REJECTED), Skills, Rating
- **Customers**: CustomerID, Name, Phone, Email, Address, PinCode
- **ServiceRequests**: RequestID, CustomerID, ElectricianID, Status, CreatedAt, UpdatedAt
- **Referrals**: ReferralCode, PhoneNumber, ReferralsCount

**Critical**: Sheet tab names must match `SHEET_TABS` object exactly (case-sensitive).

### Utility Functions (src/lib/utils.ts)
- `generateId(prefix)` → `'ELEC-20260211-7429'` (not timestamps - deterministic format)
- `validatePhone(phone)` → validates 10-digit Indian numbers (must start with 6-9)
- `validatePincode(pincode)` → validates 6-digit format
- `formatPhone(phone)` → formats as `+91 12345 67890`
- `generateReferralCode()` → 6-char alphanumeric
- `getTimestamp()` → IST timezone (Asia/Kolkata)

### Environment Variables
Required (check `.env.local`):
- Firebase: `NEXT_PUBLIC_FIREBASE_*` (public keys)
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Google: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_ID`, `GOOGLE_DRIVE_FOLDER_ID`
- External APIs: `FAST2SMS_API_KEY`, `CLOUDINARY_*`
- OTP: `OTP_SECRET` (for HMAC signing)

## Development Workflows

### Building & Running
```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Next.js build (requires env vars)
npm run start    # Production server
npm run lint     # Run ESLint
```

### Debugging Features
- **OTP Bypass (dev mode)**: OTP always logged to console in `send-otp` route
- **Debug endpoints**: `/api/debug/reset`, `/api/debug/reset-data`, `/api/debug/electrician`
- **Test routes**: `/test`, `/api/test-connections`, `/api/test-cloudinary`, `/api/test-drive-upload`

### Testing Data
- Use deterministic IDs for reproducible test scenarios
- Phone number format: any 10-digit number starting with 6-9
- PinCode format: 6 digits (e.g., 110001)
- All timestamps use `getTimestamp()` for IST consistency

## Common Coding Tasks

### Adding a New API Endpoint
1. Create `src/app/api/[domain]/[action]/route.ts`
2. Export `POST` (or `GET`/`PUT`/`DELETE`) function
3. Use `supabaseAdmin` for DB operations
4. Return `NextResponse.json({ success, error?, data? })`
5. Add domain folder to `/api` directory if new

### Modifying User Data Structure
1. Update `UserProfile` interface in `src/lib/AuthContext.tsx`
2. Update corresponding Google Sheets tab columns
3. Update `getOrCreateUser()` logic in relevant API routes (e.g., `verify-otp`)
4. Update localStorage serialization in AuthContext hooks

### Adding New Service Request Feature
1. Add column/table to Supabase if new data needed
2. Create API route for CRUD operations
3. Add Google Sheets logging via `appendRow(SHEET_TABS.SERVICE_REQUESTS, [...])`
4. Listen for real-time updates using Supabase client in components

### Geocoding & Geolocation
- API: `/api/geocode` (address → lat/lng) and `/api/reverse-geocode` (lat/lng → address)
- Library: `src/lib/geocoding.ts` uses Google Maps Geocoding API
- Always validate coordinates before database writes

## Anti-Patterns to Avoid
- ❌ Hardcoding sheet names - use `SHEET_TABS` constants
- ❌ Storing sensitive data in localStorage (use secure session validation)
- ❌ Bypassing `supabaseAdmin` - use service role for server operations
- ❌ Direct Firebase writes from components - route through API endpoints
- ❌ Timestamps without timezone conversion - use `getTimestamp()`
- ❌ Phone number formats without validation - use `validatePhone()`
- ❌ Mixing Supabase and Google Sheets as dual sources of truth (choose primary)

## Key Files by Category

**Authentication & Context**: `src/lib/AuthContext.tsx`, `src/lib/firebase.ts`, `src/app/api/auth/*`
**Database Layers**: `src/lib/google-sheets.ts`, `src/lib/supabase.ts`
**Utilities**: `src/lib/utils.ts`, `src/lib/geocoding.ts`, `src/lib/cloudinary.ts`, `src/lib/google-drive.ts`
**Core Pages**: `src/app/page.tsx` (home), `src/app/electrician/page.tsx`, `src/app/customer/page.tsx`
**UI Components**: `src/components/ui/*` (Button, Card, Modal, Input, etc.)
**Maps & Tracking**: `src/components/GoogleMapsProvider.tsx`, `src/components/LiveTrackingMap.tsx`

## Notes for Agents
- This is a live service app with real SMS and payment integrations - test thoroughly
- Database choices (Sheets + Supabase) were likely made for cost/simplicity - avoid adding heavy dependencies
- Google Sheets latency may impact real-time features; Supabase is preferred for frequent updates
- Phone numbers are the primary unique identifier across the system
