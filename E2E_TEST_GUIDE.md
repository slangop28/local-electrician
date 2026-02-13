# Local Electrician - Comprehensive End-to-End Test Guide

## Overview
This guide provides a complete workflow to test the Local Electrician platform end-to-end, covering:
- Customer registration and booking
- Real-time booking status tracking
- Electrician dashboard and request acceptance
- Real-time data synchronization across customer and electrician views

---

## Pre-Test Setup

### 1. Reset All Data
```bash
curl -X POST http://localhost:3000/api/debug/reset-all-data
```

Expected response:
```json
{
  "success": true,
  "message": "All service request data has been cleared successfully",
  "note": "Electricians and Customers data remain intact"
}
```

### 2. Verify Dev Server is Running
- Open [http://localhost:3000](http://localhost:3000)
- You should see the Local Electrician homepage

---

## Test Flow

### **PART 1: Electrician Setup**

#### Step 1.1: Register Electrician
1. Go to [http://localhost:3000](http://localhost:3000)
2. Click "Login"
3. Choose "Electrician" user type
4. Click "Continue with Google" (use test email: electrician@example.com)
5. System will redirect to `/electrician` registration page
6. Fill in the registration form:
   - **Name:** Test Electrician
   - **Email:** electrician@example.com
   - **Phone Primary:** 9876543210
   - **Phone Secondary:** 9876543211
   - **House No:** 123
   - **Area:** Electrical District
   - **City:** Delhi
   - **State:** Delhi
   - **Pincode:** 110001
   - **Bank Details (Optional):** Leave blank for now
7. Complete registration
8. Note your **Electrician ID** (should be in format: ELEC-YYYYMMDD-XXXX)

#### Step 1.2: Access Electrician Dashboard
1. After registration, you should be redirected to `/electrician-dashboard`
2. Verify you see:
   - Electrician profile card (name, city, referral code)
   - "Available Requests" section (currently empty)
   - Requests tab showing no requests yet

---

### **PART 2: Customer Booking**

#### Step 2.1: Setup Browser for Customer (New Incognito Window)
1. Open a new **Incognito/Private window**
2. Go to [http://localhost:3000](http://localhost:3000)
3. Click "Login"
4. Choose "Customer" user type
5. Click "Continue with Google" (use test email: customer@example.com)

#### Step 2.2: Customer Creates Service Request
1. You should now be on the customer homepage
2. Look for a "Request Service" button or card
3. Fill in service request form:
   - **Service Type:** Electrical Installation
   - **Urgency:** High
   - **Preferred Date:** 2026-02-14 (tomorrow)
   - **Preferred Time Slot:** 10:00 AM - 2:00 PM
   - **Issue Description:** Need help installing a new ceiling fan
   - **Address:** 456 Customer Lane
   - **City:** Delhi
   - **Pincode:** 110002
4. Select the **electrician you created in Part 1** from available electricians
5. Click "Book Service"
6. You should see confirmation: "Service request created successfully"
7. Note your **Request ID** (format: REQ-YYYYMMDD-XXXX)

#### Step 2.3: Verify Booking Status Page
1. In the same customer session, go to: `http://localhost:3000/booking-status?requestId=<YOUR-REQUEST-ID>`
2. Replace `<YOUR-REQUEST-ID>` with the ID from Step 2.2
3. You should see:
   - Status: "🔍 Finding Electrician"
   - Service details (type: Electrical Installation, date, time)
   - Your customer details

**Keep this page open in a tab** - we'll watch it update in real-time!

---

### **PART 3: Electrician Accepts Request**

#### Step 3.1: Electrician Views Available Requests
1. Switch back to the **electrician browser tab** (from Part 1)
2. Go to **"Requests"** tab in the electrician dashboard
3. You should see your newly created service request:
   - **Customer Name:** (from booking form)
   - **Customer Phone:** (from booking form)
   - **Service Type:** Electrical Installation
   - **Status:** NEW
   - **Preferred Date/Time:** 2026-02-14, 10:00 AM - 2:00 PM

#### Step 3.2: Accept the Request
1. Click the **"Accept"** button on the request card
2. You should see a success toast: "Request accepted! Redirecting to job details..."
3. The tab should switch to "Service Details"
4. You should now see the accepted request with full details

#### Step 3.3: Verify Data Sync to Supabase
**Check in Supabase Dashboard:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Navigate to your Local Electrician project
3. Go to "SQL Editor" or "Table Editor"
4. Check `service_requests` table
5. Find the request you just created (should have status = 'ACCEPTED')
6. Verify these fields are populated:
   - ✅ `request_id`: REQ-YYYYMMDD-XXXX
   - ✅ `customer_name`: (customer name)
   - ✅ `customer_phone`: (customer phone)
   - ✅ `electrician_id`: ELEC-YYYYMMDD-XXXX
   - ✅ `electrician_name`: Test Electrician
   - ✅ `electrician_phone`: 9876543210
   - ✅ `electrician_city`: Delhi
   - ✅ `status`: ACCEPTED
   - ✅ `service_type`: Electrical Installation

---

### **PART 4: Real-Time Update Verification**

#### Step 4.1: Watch Customer Booking Status Update in Real-Time
1. Switch to the **customer booking status tab** (kept open from Part 2.3)
2. **Refresh the page** (press F5)
3. The status should now show: "✅ Request Accepted"
4. You should see a new section: **"Your Electrician"** with:
   - **Name:** Test Electrician
   - **Phone:** 9876543210
   - **City:** 📍 Delhi
   - Message: "💡 They will call you shortly!"

#### Step 4.2: Verify Real-Time Subscription
1. Go back to **Supabase Dashboard**
2. Update the service request status to 'SUCCESS':
   ```sql
   UPDATE service_requests 
   SET status = 'SUCCESS', completed_at = NOW() 
   WHERE request_id = '<YOUR-REQUEST-ID>';
   ```
3. **Without refreshing**, the customer booking status page should **automatically update** to show:
   - Status: "🎉 Service Completed"
   - Thank you message
   - "Rate Your Experience ⭐" button

---

### **PART 5: Test Verification Checklist**

✅ **Customer Flow:**
- [ ] Customer can login with Google
- [ ] Customer can create service request
- [ ] Service request includes customer_name and customer_phone
- [ ] Booking status page loads with request ID
- [ ] Real-time updates reflect electrician acceptance
- [ ] Electrician details visible to customer

✅ **Electrician Flow:**
- [ ] Electrician can login with Google
- [ ] Electrician can see available requests
- [ ] Request shows customer name and phone
- [ ] Electrician can accept request
- [ ] Acceptance stores electrician details

✅ **Data Synchronization:**
- [ ] Supabase `service_requests` table updated correctly
- [ ] All 6 new fields populated:
  - customer_name ✅
  - customer_phone ✅
  - electrician_name ✅
  - electrician_phone ✅
  - electrician_city ✅
  - status ✅
- [ ] Real-time subscription works (Supabase changes reflect in UI)

✅ **System Integrity:**
- [ ] No console errors
- [ ] All API calls successful (200 responses)
- [ ] Data persists across page refreshes
- [ ] Bidirectional updates (customer ↔ electrician)

---

## Troubleshooting

### Issue: "Service request created successfully" but booking status page shows "Booking Not Found"
**Solution:** Make sure you're using the exact `requestId` from the API response in the URL query parameter.

### Issue: Electrician doesn't see available requests
**Solution:** 
1. Refresh the page
2. Check that the service request was created with the correct `electrician_id`

### Issue: Real-time updates not showing
**Solution:**
1. Check Supabase subscription is active
2. Verify browser console for errors
3. Check network tab for WebSocket connections

### Issue: Electrician details not showing to customer
**Solution:**
1. Make sure electrician accepted (not declined) the request
2. Verify Supabase `service_requests` table has `electrician_name` populated
3. Check booking status page code - should display when status === 'ACCEPTED'

---

## Test Data Summary

After completing this test, you should have:

| Component | Value |
|-----------|-------|
| Electrician ID | ELEC-YYYYMMDD-XXXX |
| Electrician Name | Test Electrician |
| Electrician Phone | 9876543210 |
| Electrician City | Delhi |
| Customer Email | customer@example.com |
| Request ID | REQ-YYYYMMDD-XXXX |
| Service Type | Electrical Installation |
| Request Status | ACCEPTED |

---

## Next Steps After Testing

1. **If all tests pass:** ✅ System is production-ready
2. **If issues found:** 
   - Check console errors
   - Review Supabase logs
   - Verify API responses
   - Test with different test data

3. **Data Cleanup:**
   ```bash
   curl -X POST http://localhost:3000/api/debug/reset-all-data
   ```

---

## Key Implementation Details

### New Supabase Fields Added:
- `customer_name` - Populated during booking creation
- `customer_phone` - Populated during booking creation
- `electrician_name` - Populated when electrician accepts
- `electrician_phone` - Populated when electrician accepts
- `electrician_city` - Populated when electrician accepts

### APIs Modified:
- `POST /api/electrician/update-request` - Now accepts electrician details
- `GET /booking-status` - Real-time subscription to service_requests changes

### Pages Updated:
- `/booking-status` - Shows electrician details when accepted
- `/electrician-dashboard` - Sends electrician details on accept action

---

Last Updated: February 12, 2026
