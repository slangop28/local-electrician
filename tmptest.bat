@echo off
echo Testing booking flow...
echo. 
echo 1. Creating broadcast request...
curl -X POST http://localhost:3000/api/request/create-broadcast -H "Content-Type: application/json" -d "{\"serviceType\":\"Fan Repair\",\"urgency\":\"IMMEDIATE\",\"customerName\":\"Test User\",\"customerPhone\":\"9999999999\",\"address\":\"123 Test St\",\"city\":\"Test City\",\"pincode\":\"123456\"}"
echo.
echo.
echo 2. Checking available requests for electrician in Test City...
curl "http://localhost:3000/api/electrician/available-requests?city=Test%20City"
echo.
echo.
echo Done.
