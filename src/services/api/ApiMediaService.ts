import { HttpTransport, decode } from '@/core/network/HttpTransport';
import {
  downloadUrlResponseSchema,
  mediaResponseSchema,
  transcribeResponseSchema,
  uploadResponseSchema,
} from './dto/domain.dto';

export interface MediaUploadResult {
  readonly mediaId: string;
  readonly storageKey: string;
  readonly uploadUrl: string | null;
}

export interface MediaFinalizeResult {
  readonly mediaId: string;
  readonly mediaType: string;
  readonly status: string;
  readonly scanState: string;
}

/**
 * Timeout panjang untuk STT: transcribe audio bisa memakan waktu puluhan
 * detik tergantung durasi rekaman, melebihi default timeout client (15s).
 */
const TRANSCRIBE_TIMEOUT_MS = 60_000;

/**
 * Media service untuk upload audio/file ke S3 via presigned URL.
 * Lifecycle: register → upload ke S3 → finalize.
 */
export class ApiMediaService {
  constructor(private readonly http: HttpTransport) {}

  /** Register upload intent, dapatkan presigned URL untuk S3. */
  public async registerUpload(input: {
    mediaType: 'audio' | 'image' | 'pdf';
    sizeBytes: number;
  }): Promise<MediaUploadResult> {
    const data = decode(
      uploadResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/media/uploads',
        body: { media_type: input.mediaType, size_bytes: input.sizeBytes },
      }),
    );
    return {
      mediaId: data.media_id,
      storageKey: data.storage_key,
      uploadUrl: data.upload_url,
    };
  }

  /** Finalize setelah file ter-upload ke S3. */
  public async finalizeUpload(input: {
    mediaId: string;
    checksum: string;
    actualBytes: number;
  }): Promise<MediaFinalizeResult> {
    const data = decode(
      mediaResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/media/${input.mediaId}:complete`,
        body: { checksum: input.checksum, actual_bytes: input.actualBytes },
      }),
    );
    return {
      mediaId: data.media_id,
      mediaType: data.media_type,
      status: data.status,
      scanState: data.scan_state,
    };
  }

  /**
   * Upload file ke S3/MinIO via presigned PUT URL.
   *
   * Signed URL sudah membawa kredensial scoped; JANGAN meneruskan app bearer
   * token ke object storage (R05/auth-security). Content-Type eksplisit audio
   * karena blob RN sering bertipe kosong/octet-stream.
   */
  public async uploadToS3(uploadUrl: string, fileUri: string): Promise<void> {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status}`);
    }
  }

  /**
   * Transcribe audio yang sudah finalized menjadi text (STT).
   *
   * Dipakai pada flow voice message 3-hit: setelah upload finalized, client
   * meminta transcript di sini, lalu mengirim voice message dengan `text` dan
   * `audio_duration_ms` agar backend tidak perlu STT ulang dan durasi user
   * tersimpan akurat dari recorder client.
   */
  public async transcribe(mediaId: string): Promise<string> {
    const data = decode(
      transcribeResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/media/${mediaId}:transcribe`,
        timeoutMs: TRANSCRIBE_TIMEOUT_MS,
      }),
    );
    return data.text;
  }

  /**
   * Probe kesiapan media lewat endpoint yang BENAR-BENAR ada di kontrak
   * backend (`GET /media/{id}/download-url`). Endpoint ini owner-scoped dan
   * hanya berhasil bila media terdaftar & dapat dipakai; ia melempar
   * ClientError terstruktur (404 forbidden/not_found bila belum siap).
   *
   * CATATAN KONTRAK: backend media.py TIDAK mengekspos `GET /media/{id}`
   * status poller. Finalize sudah mengembalikan status secara sinkron
   * (`finalized`/`clean` bila scanner aktif), sehingga polling hanya dipakai
   * sebagai fail-closed guard saat finalize kembali `pending` (scanner async).
   */
  public async getDownloadUrl(mediaId: string): Promise<string> {
    const data = decode(
      downloadUrlResponseSchema,
      await this.http.request({
        method: 'GET',
        path: `/media/${mediaId}/download-url`,
      }),
    );
    return data.download_url;
  }

  /**
   * Pastikan media siap dipakai sebagai voice message (fail-closed, R04).
   *
   * Sumber kebenaran status adalah response `finalizeUpload` itu sendiri:
   * backend menjalankan malware scan SECARA SINKRON saat finalize, sehingga:
   * - `finalized` + `clean`  → siap dipakai.
   * - `rejected` / `malicious` → ditolak, jangan pernah dikirim.
   * - `uploaded` + `pending` → scanner sedang tidak tersedia; backend akan
   *   menolak voice message dengan `MEDIA_NOT_READY` (fail-closed).
   *
   * CATATAN KONTRAK: backend `media.py` TIDAK mengekspos `GET /media/{id}`
   * status poller, dan `download-url` tetap berhasil pada media `pending`,
   * sehingga TIDAK ada endpoint status yang bisa di-poll untuk memastikan
   * transisi `pending → clean`. Karena scan sinkron, status `pending` berarti
   * scanner down — polling tidak akan mengubahnya. Maka method ini bersifat
   * strict: hanya lolos bila finalize sudah `finalized`+`clean`, selain itu
   * lempar error eksplisit agar UI tidak mengirim voice yang pasti ditolak.
   */
  public assertMediaReady(finalizeResult: MediaFinalizeResult): MediaFinalizeResult {
    if (finalizeResult.status === 'rejected' || finalizeResult.scanState === 'malicious') {
      throw new Error('Media ditolak oleh pemindai keamanan.');
    }
    if (finalizeResult.status === 'finalized' && finalizeResult.scanState === 'clean') {
      return finalizeResult;
    }
    throw new Error(
      'Media belum siap dipakai: pemindaian keamanan belum selesai. Coba lagi sebentar.',
    );
  }
}
