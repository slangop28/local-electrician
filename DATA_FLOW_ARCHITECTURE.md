# 🔄 Complete Data Flow & Architecture Diagram

---

## 📊 SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LOCAL ELECTRICIAN SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend Layer (Next.js React Components)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Electrician Dashboard    Customer Home    Booking Status Page  │   │
│  │  ├─ Profile              ├─ Book Service   ├─ Status Monitor   │   │
│  │  ├─ Requests List        ├─ History        ├─ Electrician Info │   │
│  │  ├─ Accept/Reject        └─ Account        └─ Real-time Updates│   │
│  │  └─ Service Details                                             │   │
│  │                                                                   │   │
│  │       ↓ AuthContext (Session Persistent)                        │   │
│  │  ├─ Stores in localStorage                                     │   │
│  │  ├─ Validates every hour                                        │   │
│  │  └─ Manages isElectrician flag                                 │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              ↓ API Calls                               │
│                                                                         │
│  Backend Layer (Next.js API Routes)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │  Firebase Auth     Request API      Electrician API             │   │
│  │  ├─ send-otp      ├─ /request/create    ├─ /register            │   │
│  │  ├─ verify-otp    ├─ /request/get       ├─ /update-request      │   │
│  │  ├─ validate      └─ /request/update    ├─ /profile/update      │   │
│  │  └─ logout                              └─ /available-requests  │   │
│  │                                                                   │   │
│  │  Database Integration                                           │   │
│  │  ├─ Validates inputs                                            │   │
│  │  ├─ Calls Supabase APIs                                         │   │
│  │  ├─ Logs to Google Sheets (backup)                              │   │
│  │  └─ Returns JSON responses                                      │   │
│  │                                                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                   ↓ Database Calls      ↓ Authentication                │
│                                                                         │
│  External Services Layer                                              │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │  Supabase (PostgreSQL)                                          │   │
│  │  ├─ service_requests table     │  Firebase Auth    │  Google Sheets
│  │  │  ├─ request_id             │  ├─ Users        │  ├─ Electricians
│  │  │  ├─ customer_name          │  ├─ Profiles     │  ├─ Customers
│  │  │  ├─ customer_phone         │  ├─ Phone Auth   │  └─ Requests
│  │  │  ├─ electrician_name       │  └─ Social Auth  │
│  │  │  ├─ electrician_phone      │                  │
│  │  │  ├─ electrician_city       │                  │
│  │  │  ├─ status                 │                  │
│  │  │  └─ timestamps             │                  │
│  │  │                             │                  │
│  │  ├─ Real-time Subscriptions   │                  │
│  │  │  ├─ WebSocket active       │                  │
│  │  │  ├─ Broadcasts on UPDATE   │                  │
│  │  │  └─ Sends to all listeners │                  │
│  │  │                             │                  │
│  │  └─ Service Role Client       │                  │
│  │     (Admin operations)         │                  │
│  │                                │                  │
│  └──────────────────┘             └──────────────────┘
│                                                         └──────────────────┘
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 MAIN DATA FLOW: BOOKING → ACCEPTANCE → UPDATE

### Phase 1: CUSTOMER BOOKING
```
Customer (Incognito Window)
    │
    ├─ Logs in via Google OAuth
    │  └─ Firebase authentication
    │
    ├─ Fills booking form
    │  ├─ Service type, date, time
    │  ├─ Description, address, city
    │  └─ **SELECTS ELECTRICIAN**
    │
    └─ Clicks "Request Service"
       │
       ▼
    POST /api/request/create/
       │
       ├─ Backend validates all inputs
       │
       ├─ **CAPTURES:**
       │  ├─ customer_name (from logged-in profile)
       │  ├─ customer_phone (from logged-in profile)
       │  ├─ service_type (from form)
       │  ├─ description (from form)
       │  └─ electrician_id (from selected electrician)
       │
       ├─ Generates Request ID: REQ-20260212-XXXX
       │
       ├─ **INSERT into Supabase service_requests:**
       │  {
       │    request_id: "REQ-...",
       │    customer_id: "CUST-...",
       │    customer_name: "John Doe",        ✅ STORED
       │    customer_phone: "9876543210",     ✅ STORED
       │    electrician_id: "ELEC-...",
       │    service_type: "Installation",
       │    description: "Install ceiling fan",
       │    status: "NEW",
       │    created_at: "2026-02-12T10:00:00"
       │  }
       │
       └─ Returns: { success: true, requestId: "REQ-..." }
          │
          ▼
       Customer receives Request ID
       ├─ Can view booking status
       ├─ URL: /service-request/[requestId]
       └─ Page subscribes to real-time updates
          (Waiting for electrician to accept...)
```

### Phase 2: ELECTRICIAN VIEWS REQUESTS
```
Electrician (Main Window)
    │
    ├─ Already logged in (session persisted)
    │  ├─ localStorage has userProfile
    │  ├─ Auto-redirected to dashboard
    │  └─ isElectrician: true
    │
    ├─ Clicks "Requests" tab
    │  └─ GET /api/electrician/available-requests/
    │
    └─ GET ↓
       │
       ├─ Backend queries Supabase:
       │  SELECT * FROM service_requests
       │  WHERE electrician_id = 'ELEC-...'
       │  AND status = 'NEW'
       │
       └─ Returns list of available requests
          │
          ▼
       Electrician sees in list:
       ├─ Customer Name: "John Doe"       (✅ from customer_name field)
       ├─ Service Type: "Installation"
       ├─ Status: "NEW"
       ├─ Preferred Date/Time
       └─ "Accept" button
```

### Phase 3: ELECTRICIAN ACCEPTS REQUEST ⭐
```
Electrician clicks "Accept"
    │
    ├─ Frontend collects electrician details:
    │  ├─ electricianName: from AuthContext (userProfile.name)
    │  ├─ electricianPhone: from AuthContext (userProfile.phone)
    │  └─ electricianCity: from AuthContext (userProfile.city)
    │
    └─ POST /api/electrician/update-request/
       │
       ├─ Request body:
       │  {
       │    requestId: "REQ-...",
       │    action: "accept",
       │    electricianName: "Test Electrician",    ✅ NEW
       │    electricianPhone: "9876543210",         ✅ NEW
       │    electricianCity: "Delhi"                ✅ NEW
       │  }
       │
       ├─ Backend validates request
       │
       └─ **UPDATE Supabase service_requests:**
          │
          ├─ if (action === 'accept'):
          │  UPDATE service_requests SET
          │    status = 'ACCEPTED',                  ✅ SET
          │    electrician_name = 'Test Electrician', ✅ SET
          │    electrician_phone = '9876543210',      ✅ SET
          │    electrician_city = 'Delhi',            ✅ SET
          │    accepted_at = '2026-02-12T10:05:00'
          │  WHERE request_id = 'REQ-...'
          │
          └─ **Supabase triggers REALTIME broadcast** ⚡
             │
             └─ Sends UPDATE event to all subscribed clients
```

### Phase 4: CUSTOMER PAGE AUTO-UPDATES (REAL-TIME!) ⭐⭐⭐
```
Booking Status Page (still open from Phase 1)
    │
    ├─ Has active Supabase subscription:
    │  supabase
    │    .on('postgres_changes', 
    │        { event: 'UPDATE', schema: 'public', 
    │          table: 'service_requests' },
    │        (payload) => updateUI(payload))
    │    .subscribe()
    │
    └─ WebSocket listens for changes
       │
       ▼ (Supabase broadcasts UPDATE event)
       │
       ├─ Component receives change notification:
       │  {
       │    event: 'UPDATE',
       │    data: {
       │      status: 'ACCEPTED',
       │      electrician_name: 'Test Electrician',  ✅ RECEIVED
       │      electrician_phone: '9876543210',       ✅ RECEIVED
       │      electrician_city: 'Delhi'              ✅ RECEIVED
       │    }
       │  }
       │
       ├─ React state updates: setServiceRequest(newData)
       │
       └─ **PAGE RE-RENDERS AUTOMATICALLY** ⚡⚡⚡
          │
          ├─ Status changes:
          │  FROM: 🔍 Finding Electrician
          │  TO:   ✅ Request Accepted
          │
          └─ **NEW SECTION** appears:
             │
             ├─ "Your Electrician" ✅
             │  ├─ Name: Test Electrician  (from electrician_name)
             │  ├─ Phone: +91 98765 43210  (from electrician_phone)
             │  ├─ City: 📍 Delhi          (from electrician_city)
             │  └─ Message: "They will call you shortly!" 💡
             │
             └─ **NO PAGE REFRESH NEEDED!** ⚡
                (Same technology as live chat notifications)
```

### Phase 5: SESSION PERSISTENCE CHECK
```
Test: Close Electrician Browser Completely
    │
    ├─ All tabs closed
    ├─ Browser memory cleared
    └─ Wait 30 seconds
       │
       ▼ (New Browser Session)
       │
    Open new tab: http://localhost:3000/
    │
    ├─ Frontend initializes
    │
    ├─ AuthContext.tsx useEffect runs:
    │  ├─ Reads localStorage.getItem('userProfile')
    │  ├─ JSON.parse() the stored data
    │  └─ setUserProfile(saved data)
    │
    ├─ Home page (src/app/page.tsx) checks:
    │  if (userProfile?.isElectrician === true) {
    │    router.push('/electrician-dashboard')
    │  }
    │
    └─ **AUTO-REDIRECT TO DASHBOARD** ✅
       │
       ├─ Does NOT show login modal
       ├─ Does NOT show registration form
       ├─ Does NOT require login again
       │
       └─ Electrician sees dashboard directly:
          ├─ Profile information
          ├─ Accepted job request
          ├─ Service details
          └─ Ready to work!
             
       **SESSION PERSISTENCE SUCCESS!** ⭐⭐⭐
```

---

## 📊 FIELD POPULATION TIMELINE

```
Timeline of which fields get populated at each step:

┌─────────────────────────────────────────────────────────────────────────┐
│ Step 1: Customer Creates Booking                                        │
├──────────────────────┬──────────────────────────────────────────────────┤
│ DB Field             │ Value After This Step                            │
├──────────────────────┼──────────────────────────────────────────────────┤
│ request_id           │ REQ-20260212-1234              ✅ SET             │
│ customer_id          │ CUST-20260212-5678             ✅ SET             │
│ customer_name        │ "John Doe"                     ✅ SET **NEW**      │
│ customer_phone       │ "9876543210"                   ✅ SET **NEW**      │
│ electrician_id       │ ELEC-20260211-9999             ✅ SET             │
│ electrician_name     │ NULL                           ❌ NOT SET YET     │
│ electrician_phone    │ NULL                           ❌ NOT SET YET     │
│ electrician_city     │ NULL                           ❌ NOT SET YET     │
│ service_type         │ "Installation"                 ✅ SET             │
│ status               │ "NEW"                          ✅ SET             │
│ created_at           │ "2026-02-12T10:00:00Z"         ✅ SET             │
└──────────────────────┴──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Step 2: Electrician Accepts Request                                     │
├──────────────────────┬──────────────────────────────────────────────────┤
│ DB Field             │ Value After This Step                            │
├──────────────────────┼──────────────────────────────────────────────────┤
│ request_id           │ REQ-20260212-1234              ✅ UNCHANGED        │
│ customer_id          │ CUST-20260212-5678             ✅ UNCHANGED        │
│ customer_name        │ "John Doe"                     ✅ UNCHANGED        │
│ customer_phone       │ "9876543210"                   ✅ UNCHANGED        │
│ electrician_id       │ ELEC-20260211-9999             ✅ UNCHANGED        │
│ electrician_name     │ "Test Electrician"             ✅ SET **NEW** ⭐    │
│ electrician_phone    │ "9876543210"                   ✅ SET **NEW** ⭐    │
│ electrician_city     │ "Delhi"                        ✅ SET **NEW** ⭐    │
│ service_type         │ "Installation"                 ✅ UNCHANGED        │
│ status               │ "ACCEPTED"                     ✅ UPDATED ⭐        │
│ created_at           │ "2026-02-12T10:00:00Z"         ✅ UNCHANGED        │
│ accepted_at          │ "2026-02-12T10:05:00Z"         ✅ SET ⭐            │
└──────────────────────┴──────────────────────────────────────────────────┘

Legend:
✅ SET = Field populated with value
✅ UNCHANGED = Field already has value, not changed
✅ UPDATED = Field changed to new value
❌ NOT SET YET = Field is NULL
⭐ NEW = New field in this version
```

---

## 🌐 REAL-TIME TECHNOLOGY STACK

```
How Real-Time Updates Work:

1. SUPABASE REALTIME ENGINE
   ├─ PostgreSQL LISTEN/NOTIFY
   ├─ WebSocket connection pool
   └─ Broadcast to subscribed clients

2. FRONTEND SUBSCRIPTION
   ├─ Create subscription in React useEffect
   ├─ Keep connection open
   └─ Listen for 'postgres_changes' events

3. TRIGGER CHAIN
   ├─ API updates Supabase row
   ├─ PostgreSQL detects change
   ├─ NOTIFY listeners of change
   ├─ Supabase routes to WebSocket
   ├─ Sends payload to all subscribers
   └─ React component re-renders

4. RESULT
   └─ Customer sees electrician details INSTANTLY ⚡
      WITHOUT manual page refresh
      WITHOUT polling
      WITHOUT delays
```

---

## 👤 USER SESSION FLOW

```
Electrician Session Cycle:

DAY 1:
  Morning
  ├─ Open browser
  ├─ Click "Login"
  ├─ Google OAuth
  ├─ Go through 3-step registration
  ├─ AuthContext.login() saves to localStorage
  └─ Redirected to dashboard ✅
       │
  Later (browser still open)
  ├─ Works on jobs
  ├─ Accepts requests
  └─ Still logged in ✅
       │
  Evening
  ├─ Close ALL browser tabs
  ├─ Close browser completely
  └─ Go home

DAY 2:
  Morning
  ├─ Open browser
  ├─ Navigate to http://localhost:3000
  ├─ AuthContext reads localStorage
  ├─ Home page checks isElectrician flag
  └─ AUTO-REDIRECT to dashboard ✅
       │
  ├─ NO login required
  ├─ NO registration required
  ├─ NO form filling required
  ├─ Profile data already populated
  └─ Ready to work immediately ⚡⚡⚡

Session expires when:
  ├─ User clicks logout
  ├─ localStorage is manually cleared
  └─ OR (future) 30 days pass without activity
```

---

## 🎯 VERIFICATION CHECKLIST

### After Phase 1 (Customer Booking):
```
Supabase service_requests table should have:
Request found by ID:
✅ request_id = REQ-...
✅ customer_name = "John Doe"          (NEW FEATURE)
✅ customer_phone = "9876543210"        (NEW FEATURE)
✅ electrician_id = ELEC-...
✅ service_type = "Installation"
✅ status = "NEW"
❌ electrician_name = NULL (not yet)
❌ electrician_phone = NULL (not yet)
❌ electrician_city = NULL (not yet)
```

### After Phase 3 (Electrician Accepts):
```
Same request row should now show:
✅ request_id = REQ-... (unchanged)
✅ customer_name = "John Doe"
✅ customer_phone = "9876543210"
✅ electrician_id = ELEC-...
✅ electrician_name = "Test Electrician"  (NEW!)
✅ electrician_phone = "9876543210"       (NEW!)
✅ electrician_city = "Delhi"             (NEW!)
✅ status = "ACCEPTED"
```

### After Phase 4 (Real-Time Update):
```
Customer page should display:
✅ Status: ✅ Request Accepted
✅ "Your Electrician" section visible
✅ Electrician Name: Test Electrician
✅ Electrician Phone: +91 98765 43210
✅ Electrician City: 📍  Delhi
✅ Message: "They will call you shortly! 💡"
```

### After Phase 5 (Session Persistence):
```
Browser behavior should be:
✅ Close and reopen browser
✅ Navigate to http://localhost:3000
✅ AUTO-REDIRECT to /electrician-dashboard
✅ Show profile information
✅ NO login modal
✅ NO registration form required
```

---

## 🔐 SECURITY & VALIDATION

```
Data Flow Validation Points:

1. Customer Booking
   ├─ Validate customer is logged in
   ├─ Validate service_type is valid
   ├─ Validate address format
   ├─ Validate electrician_id exists
   └─ INSERT only if all valid

2. Electrician Acceptance
   ├─ Validate electrician is logged in
   ├─ Validate request exists
   ├─ Validate request not already accepted
   ├─ Validate electrician_id matches
   └─ UPDATE only if all valid

3. Real-Time Broadcast
   ├─ Only authenticated subscribers receive updates
   ├─ Only service_requests table changes sent
   ├─ Payload encrypted over WebSocket
   └─ Customer only sees their own requests
```

---

## 📱 BROWSER BEHAVIOR OVER TIME

```
Timeline for Electrician Across Multiple Sessions:

T=0: First Launch
  Browser → AuthContext → localStorage empty
  → Show login modal
  → Google OAuth flow
  → Register electrician
  → Store in DB
  → Save to localStorage: { isElectrician: true, ... }
  → Redirect to dashboard

T=1: Still Same Session
  User works on jobs
  localStorage still has userProfile
  isAuthenticated = true
  Dashboard remains visible

T=2: Browser Close
  User closes browser tab
  Browser session ends
  localStorage preserved on disk

T=3: Browser Reopen (Same Day)
  User opens browser
  New page load
  AuthContext useEffect runs
  Reads localStorage (still has data!)
  Re-populates userProfile
  Home page checks isElectrician
  Auto-redirects to dashboard
  User sees dashboard immediately

T=4: Hours Later (Background Validation)
  Every page load after 1 hour
  Calls /api/auth/validate-session
  Backend verifies user still valid in DB
  Updates session if needed
  Re-confirms isElectrician flag

T=5: Days Later
  User closes browser again
  localStorage has persisted
  Even after computer restart
  New browser session
  Same login persisted
  Auto-redirects to dashboard again

T=6: Manual Logout
  User clicks "Logout" button
  AuthContext.logout() called
  localStorage cleared
  isAuthenticated = false
  Redirected to home (login required)
  Next login required

T=7: New Login
  Cycle repeats from T=0
```

---

**This diagram covers the complete data flow for the Local Electrician testing phase.**

**Next step:** Follow TEST_EXECUTION_REPORT.md and verify each phase works as shown here!
