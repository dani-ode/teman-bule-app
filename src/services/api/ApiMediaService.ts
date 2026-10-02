import { z } from 'zod';
import { HttpTransport, decode } from '@/core/network/HttpTransport';

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

const uploadResponseSchema = z.object({
  media_id: z.string(),
  storage_key: z.string(),
  status: z.string(),
  upload_url: z.string().nullable(),
});

const mediaResponseSchema = z.object({
  media_id: z.string(),
  media_type: z.string(),
  status: z.string(),
  scan_state: z.string(),
});

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

  /** Upload file blob ke S3 via presigned URL. */
  public async uploadToS3(uploadUrl: string, fileUri: string): Promise<void> {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': blob.type || 'audio/m4a',
      },
    });
    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status}`);
    }
  }

  /** Get download URL untuk media yang sudah finalized. */
  public async getDownloadUrl(mediaId: string): Promise<string> {
    const data = decode(
      z.object({ download_url: z.string() }),
      await this.http.request({
        method: 'GET',
        path: `/media/${mediaId}/download-url`,
      }),
    );
    return data.download_url;
  }
}
