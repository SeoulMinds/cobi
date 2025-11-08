#!/bin/bash

# Secure Password Generator
# Generates a cryptographically secure password using multiple entropy sources

# Parse command line arguments
PASSWORD_TYPE="standard"
PASSWORD_LENGTH=32

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            PASSWORD_TYPE="$2"
            shift 2
            ;;
        -l|--length)
            PASSWORD_LENGTH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS] [LENGTH]"
            echo "Options:"
            echo "  -t, --type TYPE     Password type: standard, database, hex, alphanumeric"
            echo "  -l, --length NUM    Password length (default: 32, min: 12)"
            echo "  -h, --help          Show this help"
            echo ""
            echo "Password Types:"
            echo "  standard      Full character set (letters, numbers, symbols)"
            echo "  database      Database-safe characters (no quotes, backslashes)"
            echo "  hex           Hexadecimal characters only (0-9, a-f)"
            echo "  alphanumeric  Letters and numbers only"
            exit 0
            ;;
        *)
            # If it's a number, treat as length for backward compatibility
            if [[ $1 =~ ^[0-9]+$ ]]; then
                PASSWORD_LENGTH=$1
            fi
            shift
            ;;
    esac
done

# Minimum password length for security
MIN_LENGTH=12

# Check if password length is valid
if [ "$PASSWORD_LENGTH" -lt "$MIN_LENGTH" ]; then
    echo "Error: Password length must be at least $MIN_LENGTH characters"
    exit 1
fi

# Character sets for different password types
LOWERCASE="abcdefghijklmnopqrstuvwxyz"
UPPERCASE="ABCDEFGHIJKLMNOPQRSTUVWXYZ"
NUMBERS="0123456789"
SPECIAL_FULL="!@#$%^&*()_+-=[]{}|;:,.<>?"
SPECIAL_DB_SAFE="!@#$%^&*()_+-=[]{}|;:,."  # Removed quotes, backslashes, angle brackets
HEX_CHARS="0123456789abcdef"

# Set character sets based on password type
case $PASSWORD_TYPE in
    "standard")
        CHARSET="${LOWERCASE}${UPPERCASE}${NUMBERS}${SPECIAL_FULL}"
        REQUIRED_SETS=("$LOWERCASE" "$UPPERCASE" "$NUMBERS" "$SPECIAL_FULL")
        DESCRIPTION="Full character set (letters, numbers, symbols)"
        ;;
    "database")
        CHARSET="${LOWERCASE}${UPPERCASE}${NUMBERS}${SPECIAL_DB_SAFE}"
        REQUIRED_SETS=("$LOWERCASE" "$UPPERCASE" "$NUMBERS" "$SPECIAL_DB_SAFE")
        DESCRIPTION="Database-safe characters (no quotes, backslashes)"
        ;;
    "hex")
        CHARSET="$HEX_CHARS"
        REQUIRED_SETS=("$HEX_CHARS")
        DESCRIPTION="Hexadecimal characters only"
        MIN_LENGTH=16  # Hex needs more length for same security
        ;;
    "alphanumeric")
        CHARSET="${LOWERCASE}${UPPERCASE}${NUMBERS}"
        REQUIRED_SETS=("$LOWERCASE" "$UPPERCASE" "$NUMBERS")
        DESCRIPTION="Letters and numbers only"
        ;;
    *)
        echo "Error: Invalid password type '$PASSWORD_TYPE'"
        echo "Valid types: standard, database, hex, alphanumeric"
        exit 1
        ;;
esac

# Function to generate secure random password
generate_secure_password() {
    local length=$1
    local password=""
    
    # Different generation logic based on password type
    if [ "$PASSWORD_TYPE" = "hex" ]; then
        # For hex passwords, use standard method
        for ((i=0; i<length; i++)); do
            password+=$(echo -n "$CHARSET" | fold -w1 | shuf -n1 --random-source=/dev/urandom)
        done
    else
        # For other types, ensure character diversity
        if [ ${#REQUIRED_SETS[@]} -gt 1 ]; then
            # Ensure at least one character from each required set
            for set in "${REQUIRED_SETS[@]}"; do
                password+=$(echo -n "$set" | fold -w1 | shuf -n1 --random-source=/dev/urandom)
            done
            
            # Fill remaining length with random characters from full charset
            local remaining=$((length - ${#REQUIRED_SETS[@]}))
            for ((i=0; i<remaining; i++)); do
                password+=$(echo -n "$CHARSET" | fold -w1 | shuf -n1 --random-source=/dev/urandom)
            done
            
            # Shuffle the password to randomize character positions
            password=$(echo -n "$password" | fold -w1 | shuf --random-source=/dev/urandom | tr -d '\n')
        else
            # Single character set (hex)
            for ((i=0; i<length; i++)); do
                password+=$(echo -n "$CHARSET" | fold -w1 | shuf -n1 --random-source=/dev/urandom)
            done
        fi
    fi
    
    echo -n "$password"
}

# Function to calculate password entropy
calculate_entropy() {
    local length=$1
    local charset_size=${#CHARSET}
    local entropy=$(echo "scale=2; $length * l($charset_size) / l(2)" | bc -l)
    echo "$entropy"
}

# Generate the password
echo "Generating secure password..."
echo "Type: $PASSWORD_TYPE ($DESCRIPTION)"
echo "Length: $PASSWORD_LENGTH characters"

PASSWORD=$(generate_secure_password "$PASSWORD_LENGTH")

# Display the password
echo ""
echo "Generated Password:"
echo "==================="
echo "$PASSWORD"
echo "==================="
echo ""

# Display security information
ENTROPY=$(calculate_entropy "$PASSWORD_LENGTH")
echo "Security Information:"
echo "- Password Type: $PASSWORD_TYPE"
echo "- Password Length: $PASSWORD_LENGTH characters"
echo "- Character Set Size: ${#CHARSET} characters"
echo "- Estimated Entropy: $ENTROPY bits"
case $PASSWORD_TYPE in
    "standard")
        echo "- Contains: Lowercase, Uppercase, Numbers, Special characters"
        ;;
    "database")
        echo "- Contains: Lowercase, Uppercase, Numbers, DB-safe symbols"
        ;;
    "hex")
        echo "- Contains: Hexadecimal characters (0-9, a-f)"
        ;;
    "alphanumeric")
        echo "- Contains: Lowercase, Uppercase, Numbers"
        ;;
esac
echo ""
echo "Warning: Store this password securely and never share it!"