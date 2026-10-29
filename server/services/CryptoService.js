/* global process, Buffer */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyFilePath = path.resolve(__dirname, '../.encryption_key');

let cachedKeyBuffer = null;

function getKeyBuffer() {
  if (cachedKeyBuffer) return cachedKeyBuffer;

  let rawKey = process.env.ENCRYPTION_KEY || process.env.SECRET_KEY;

  if (!rawKey) {
    if (fs.existsSync(keyFilePath)) {
      try {
        rawKey = fs.readFileSync(keyFilePath, 'utf-8').trim();
      } catch (err) {
        console.warn('[CryptoService] Erro ao ler .encryption_key:', err.message);
      }
    }

    if (!rawKey) {
      // Gera uma chave aleatória segura de 256 bits (64 hex chars)
      rawKey = crypto.randomBytes(32).toString('hex');
      try {
        fs.writeFileSync(keyFilePath, rawKey, { mode: 0o600, encoding: 'utf-8' });
      } catch (err) {
        console.warn('[CryptoService] Não foi possível persistir .encryption_key em disco:', err.message);
      }
    }
  }

  // Garante um buffer exato de 32 bytes (256 bits) usando SHA-256
  cachedKeyBuffer = crypto.createHash('sha256').update(rawKey).digest();
  return cachedKeyBuffer;
}

export class CryptoService {
  /**
   * Criptografa um valor (número ou texto) usando AES-256-GCM.
   * Retorna uma string no formato: enc:gcm:<iv_hex>:<tag_hex>:<cipher_hex>
   */
  static encrypt(val) {
    if (val === null || val === undefined || val === '') return null;
    const str = String(val).trim();
    if (!str) return null;

    try {
      const key = getKeyBuffer();
      const iv = crypto.randomBytes(12); // IV recomendado para GCM é 12 bytes
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

      let ciphertext = cipher.update(str, 'utf8', 'hex');
      ciphertext += cipher.final('hex');
      const tag = cipher.getAuthTag().toString('hex');

      return `enc:gcm:${iv.toString('hex')}:${tag}:${ciphertext}`;
    } catch (err) {
      console.error('[CryptoService] Erro ao criptografar valor:', err.message);
      return str;
    }
  }

  /**
   * Descriptografa um token criptografado ou retorna o valor se já for numérico/texto puro.
   */
  static decrypt(token) {
    if (token === null || token === undefined || token === '') return null;
    if (typeof token === 'number') return token;

    const str = String(token).trim();
    if (!str) return null;

    if (!str.startsWith('enc:gcm:')) {
      // Se não está no formato encriptado, é um valor legado em texto puro
      return str;
    }

    try {
      const parts = str.split(':');
      if (parts.length !== 5) return str;

      const iv = Buffer.from(parts[2], 'hex');
      const tag = Buffer.from(parts[3], 'hex');
      const cipherHex = parts[4];

      const key = getKeyBuffer();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[CryptoService] Erro ao descriptografar token:', err.message);
      return str;
    }
  }

  /**
   * Descriptografa e converte diretamente para número (float).
   */
  static decryptNumber(token, fallback = 0.0) {
    if (token === null || token === undefined || token === '') return fallback;
    const dec = this.decrypt(token);
    if (dec === null || dec === undefined) return fallback;

    const num = parseFloat(String(dec).replace(',', '.'));
    return isNaN(num) ? fallback : num;
  }

  /**
   * Verifica se uma string já está criptografada.
   */
  static isEncrypted(val) {
    if (!val || typeof val !== 'string') return false;
    return val.startsWith('enc:gcm:');
  }
}

export default CryptoService;
