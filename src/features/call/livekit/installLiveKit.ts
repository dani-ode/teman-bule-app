/**
 * LiveKit SDK bootstrap (R06).
 *
 * registerGlobals() must be called before any livekit-client usage.
 * Install once at app entry; a second call is safe (idempotent no-op).
 */
import { registerGlobals } from '@livekit/react-native';

let installed = false;

export function installLiveKitGlobals(): void {
  if (installed) return;
  registerGlobals();
  installed = true;
}
