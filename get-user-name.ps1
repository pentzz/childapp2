# Script to detect current user name
# Returns "אופיר ברנס" if this is Ofir's computer, otherwise "מתוקו מסגנאו"

$computerName = $env:COMPUTERNAME
$username = $env:USERNAME

# Check if this is Ofir's computer
# Ofir's computer name or username contains "ofir" or "OFIR"
if ($computerName -like "*OFIR*" -or $username -like "*ofir*" -or $username -like "*OFIR*") {
    Write-Output "אופיר ברנס"
} else {
    Write-Output "מתוקו מסגנאו"
}

