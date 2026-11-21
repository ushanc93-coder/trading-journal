$tz = [System.TimeZoneInfo]::FindSystemTimeZoneById("Eastern Standard Time")
$ny = [System.TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $tz)
Write-Output ("NY Time: " + $ny.ToString("hh:mm:ss tt"))
