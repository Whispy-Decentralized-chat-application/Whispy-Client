// criptoService.tsx

// --- GENERAR PAR DE CLAVES ECDH P-256 ---

/**
 * Genera un par de claves ECDH (P-256) y las devuelve en formato JWK (JSON).
 * La pública la puedes guardar en Ceramic y la privada la debes cifrar y guardar en local.
 */
export async function generateKeyPair() {
  // 1. Genera el par de claves
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey", "deriveBits"]
  );

  // 2. Exporta las claves a formato JWK (JSON Web Key)
  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  // 3. Devuelve las claves en JSON string
  return {
    publicKey: JSON.stringify(publicKeyJwk),    // Guarda en Ceramic/user
    privateKey: JSON.stringify(privateKeyJwk)   // Guarda cifrada localmente
  };
}

// --- UTILIDADES PARA CIFRAR/DESCIFRAR LA CLAVE PRIVADA CON CONTRASEÑA ---

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getRandomBytes(length: number): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(length));
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<string> {
  const salt = getRandomBytes(16);
  const iv = getRandomBytes(12);
  const key = await deriveKey(password, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptWithPassword(
  ciphertextBase64: string,
  password: string
): Promise<string> {
  const combined = Uint8Array.from(
    atob(ciphertextBase64),
    c => c.charCodeAt(0)
  );

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKey(password, salt);
  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintextBuffer);
}

// --- IMPORTAR/EXPORTAR CLAVES PARA USAR EN DERIVACIÓN ---

/**
 * Importa una clave privada ECDH (P-256) desde JWK (JSON).
 */
export async function importPrivateKey(jwkJson: string): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(jwkJson),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  );
}

/**
 * Importa una clave pública ECDH (P-256) desde JWK (JSON).
 */
export async function importPublicKey(jwkJson: string): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(jwkJson),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
}

/**
 * Deriva una clave AES-GCM 256 bits compartida para cifrado punto a punto.
 * Usa tu clave privada y la pública del otro usuario.
 */
export async function deriveSharedSecret(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey
    },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
