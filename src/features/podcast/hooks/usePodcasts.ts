import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/core/di/ServiceContainer';

/** Daftar podcast milik pengguna (backend-authoritative). */
export const usePodcastList = (input?: { limit?: number; enabled?: boolean }) =>
  useQuery({
    queryKey: ['podcasts', 'list', input?.limit ?? 50],
    queryFn: () => getServices().podcastService.listPodcasts({ limit: input?.limit ?? 50 }),
    enabled: input?.enabled ?? true,
  });

/**
 * Poll status ingestion dokumen podcast.
 *
 * Refetch berkala selama dokumen belum terminal (parsed/failed) agar UI
 * menampilkan "processing" nyata dari backend, bukan progres buatan.
 */
export const usePodcastIngestionStatus = (podcastId: string, input?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['podcasts', 'ingestion-status', podcastId],
    queryFn: () => getServices().podcastService.getIngestionStatus(podcastId),
    enabled: input?.enabled ?? true,
    refetchInterval: (query) => {
      const status = query.state.data?.parseStatus;
      if (status === 'parsed' || status === 'failed') return false;
      return 3000;
    },
  });
