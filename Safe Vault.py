import json
import os
import getpass
from base64 import urlsafe_b64encode, b64decode
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# --- Configuration Constants ---
VAULT_FILE = "vault_data.json"
# Key Derivation Function (KDF) parameters
KDF_ITERATIONS = 480000  # Highly recommended minimum for PBKDF2
KDF_ALGORITHM = hashes.SHA256()

class VaultError(Exception):
    """Custom exception for Vault errors."""
    pass

class SafeVault:
    def __init__(self, password):
        """Initializes the vault, loading existing data or setting up new state."""
        self.password = password.encode('utf-8')
        self.data = {}
        self.salt = None
        self.fernet = None

        if os.path.exists(VAULT_FILE):
            print("Loading existing vault...")
            self._load_vault()
        else:
            print("No vault file found. Creating new vault...")
            self._setup_new_vault()

    def _setup_new_vault(self):
        """Generates a new salt and key for a fresh vault."""
        # Generate a fresh salt
        self.salt = os.urandom(16)
        # Derive the key and initialize Fernet
        self._derive_key_and_fernet()

    def _derive_key_and_fernet(self):
        """Derives the encryption key from the master password and salt."""
        if not self.salt:
            raise VaultError("Salt is missing. Cannot derive key.")

        kdf = PBKDF2HMAC(
            algorithm=KDF_ALGORITHM,
            length=32,
            salt=self.salt,
            iterations=KDF_ITERATIONS,
        )
        # Derive 32-byte key
        key_bytes = kdf.derive(self.password)
        # Fernet requires a 32 urlsafe base64-encoded key
        key_fernet = urlsafe_b64encode(key_bytes)
        self.fernet = Fernet(key_fernet)
        # For security, zero out password from memory variable after use (best effort)
        del self.password

    def _load_vault(self):
        """Loads and attempts to decrypt the vault data."""
        with open(VAULT_FILE, 'r') as f:
            content = json.load(f)

        try:
            # 1. Load salt and KDF iterations (for compatibility, though iterations is fixed here)
            self.salt = b64decode(content['salt'])

            # 2. Derive key and initialize Fernet
            self._derive_key_and_fernet()

            # 3. Decrypt the encrypted content
            encrypted_data = content['data'].encode('utf-8')
            decrypted_json_bytes = self.fernet.decrypt(encrypted_data)

            # 4. Load the decrypted data (which is a JSON string)
            self.data = json.loads(decrypted_json_bytes.decode('utf-8'))
            print("Vault decrypted successfully!")

        except (KeyError, InvalidToken):
            # InvalidToken means the password was wrong, or the file was corrupted
            raise VaultError("Authentication failed. Invalid password or corrupted vault file.")
        except Exception as e:
            raise VaultError(f"Error loading vault: {e}")

    def save_vault(self):
        """Encrypts and saves the current data to the vault file."""
        # 1. Serialize the current data dictionary to a JSON string
        json_data = json.dumps(self.data).encode('utf-8')

        # 2. Encrypt the JSON bytes
        encrypted_data = self.fernet.encrypt(json_data).decode('utf-8')

        # 3. Prepare the final structure (salt is stored unencrypted)
        vault_content = {
            'salt': urlsafe_b64encode(self.salt).decode('utf-8'),
            'iterations': KDF_ITERATIONS, # Store for potential future compatibility checks
            'data': encrypted_data
        }

        # 4. Write to file
        with open(VAULT_FILE, 'w') as f:
            json.dump(vault_content, f, indent=4)
        print("\nVault saved successfully.")

    def add_entry(self, key, value):
        """Adds or updates an entry in the vault."""
        if not key or not value:
            print("Key and value cannot be empty.")
            return

        self.data[key] = value
        print(f"Entry '{key}' added/updated.")

    def get_entry(self, key):
        """Retrieves an entry from the vault."""
        return self.data.get(key)

    def delete_entry(self, key):
        """Deletes an entry from the vault."""
        if key in self.data:
            del self.data[key]
            print(f"Entry '{key}' deleted.")
            return True
        print(f"Entry '{key}' not found.")
        return False

    def list_keys(self):
        """Lists all stored keys in the vault."""
        if not self.data:
            print("The vault is empty.")
            return
        print("\n--- Stored Keys ---")
        for key in self.data.keys():
            print(f"- {key}")
        print("-------------------")


def get_master_password(prompt="Master Password: "):
    """Safely prompts for the master password using getpass."""
    while True:
        try:
            password = getpass.getpass(prompt=prompt)
            if password:
                return password
            print("Password cannot be empty. Try again.")
        except EOFError:
            # Handle Ctrl+D/Ctrl+Z case in non-interactive environment
            print("\nInput cancelled.")
            return None

def main_menu():
    """Displays the main menu options."""
    print("\n--- Vault Menu ---")
    print("1. Add/Update Entry (e.g., website login, secret note)")
    print("2. Retrieve Entry")
    print("3. List All Keys")
    print("4. Delete Entry")
    print("5. Save & Exit")
    print("6. Exit without Saving (DANGEROUS: changes will be lost!)")
    choice = input("Enter choice (1-6): ").strip()
    return choice

def main():
    """Main execution loop for the Vault application."""
    print("🚀 Secure Data Vault Initializing...")
    vault = None

    try:
        # 1. Authentication
        while not vault:
            master_password = get_master_password()
            if not master_password:
                print("Exiting.")
                return

            try:
                # Attempt to initialize/load the vault
                vault = SafeVault(master_password)
            except VaultError as e:
                print(f"Authentication Error: {e}")
                print("Please try the correct password again.")
            except Exception as e:
                print(f"An unexpected error occurred: {e}")
                return

        # 2. Main Loop
        while True:
            choice = main_menu()

            if choice == '1':
                key = input("Enter Key/Title for the entry: ").strip()
                value = getpass.getpass("Enter Secret Value/Note: ")
                vault.add_entry(key, value)

            elif choice == '2':
                key = input("Enter Key/Title to retrieve: ").strip()
                value = vault.get_entry(key)
                if value:
                    print(f"\nKey: {key}\nValue: {value}")
                else:
                    print(f"Entry '{key}' not found.")

            elif choice == '3':
                vault.list_keys()

            elif choice == '4':
                key = input("Enter Key/Title to delete: ").strip()
                vault.delete_entry(key)

            elif choice == '5':
                vault.save_vault()
                print("Vault closed. Goodbye!")
                break

            elif choice == '6':
                print("Exiting without saving. Changes are discarded.")
                break

            else:
                print("Invalid choice. Please enter a number between 1 and 6.")

    except KeyboardInterrupt:
        print("\nOperation interrupted. Exiting.")
    except Exception as e:
        print(f"\nCRITICAL ERROR: {e}")

if __name__ == "__main__":
    # Check for required library before starting
    try:
        import cryptography
    except ImportError:
        print("ERROR: The 'cryptography' library is required.")
        print("Please install it using: pip install cryptography")
    else:
        main()# Security-Project-
