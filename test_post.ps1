try {
    $body = @{
        serviceType = "Test Fix"
        urgency = "High"
        preferredDate = "2025-01-01"
        preferredSlot = "Morning"
        issueDetail = "Testing column mapping"
        customerName = "Test User"
        customerPhone = "9998889999"
        address = "Test Address"
        city = "TestCity"
        pincode = "123456"
        lat = 10
        lng = 10
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/request/create-broadcast' -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop
    $response.Content
} catch {
    write-host "Error Caught"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
    } else {
        $_
    }
}
