/**
 * Helper checksum file untuk media upload (finalize memerlukan checksum).
 *
 * Backend memvalidasi `checksum` (8–64 char) dan mencocokkannya dengan objek
 * yang ter-upload di object storage. Placeholder string akan DITOLAK (422),
 * sehingga kita menghitung digest SHA-256 nyata dari isi file.
 */
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';

export interface FileDigest {
  /** SHA-256 hex lowercase (64 char) — diterima backend sebagai checksum. */
  readonly sha256Hex: string;
  /** Ukuran file dalam bytes (untuk size_bytes / actual_bytes). */
  readonly sizeBytes: number;
}

/**
 * Baca file lokal sekali lalu kembalikan SHA-256 hex + ukurannya.
 * Aman untuk ukuran audio tipikal (< 25 MB sesuai batas backend).
 */
export const digestFileSha256 = async (fileUri: string): Promise<FileDigest> => {
  const file = new File(fileUri);
  const buffer = await file.arrayBuffer();
  const digestBuffer = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    new Uint8Array(buffer),
  );
  return {
    sha256Hex: arrayBufferToHex(digestBuffer),
    sizeBytes: buffer.byteLength,
  };
};

const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
};
