#!/bin/bash
# Script to detect current user name
# Returns "אופיר ברנס" if this is Ofir's computer, otherwise "מתוקו מסגנאו"

COMPUTERNAME=$(hostname)
USERNAME=$(whoami)

# Check if this is Ofir's computer
# Ofir's computer name or username contains "ofir" or "OFIR"
if [[ "$COMPUTERNAME" == *"OFIR"* ]] || [[ "$USERNAME" == *"ofir"* ]] || [[ "$USERNAME" == *"OFIR"* ]]; then
    echo "אופיר ברנס"
else
    echo "מתוקו מסגנאו"
fi

