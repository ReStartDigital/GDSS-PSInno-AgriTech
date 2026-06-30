import { userRepository } from '../features/user/user.repository.js';
import { AUTH_CONSTANTS } from '../common/constants/auth.constants.js';
import { logger } from '../common/utils/logger.js';

/**
 * Deletes user rows that were created (Step 1 of registration) but never
 * completed OTP verification within 24 hours. These are abandoned
 * registration attempts — the phone number becomes available for a fresh
 * registration attempt once purged.
 *
 * Scheduled to run hourly via the cron runner (see jobs.runner.ts).
 */
export async function cleanupStaleUnverifiedRegistrations(): Promise<void> {
  const cutoff = new Date(Date.now() - AUTH_CONSTANTS.UNVERIFIED_REGISTRATION_TTL_HOURS * 60 * 60 * 1000);

  const deletedCount = await userRepository.deleteStaleUnverified(cutoff);

  if (deletedCount > 0) {
    logger.info('Cleaned up stale unverified registrations', { deletedCount, cutoff: cutoff.toISOString() });
  }
}