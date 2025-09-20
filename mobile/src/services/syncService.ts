import { offlineService } from './offlineService';
import { shelterService } from './shelterService';
import { store } from '../store';
import { syncPendingUpdates } from '../store/shelterSlice';

class SyncService {
  private syncInterval: any = null;
  private isRunning = false;

  /**
   * Start automatic sync with specified interval
   */
  startAutoSync(intervalMs: number = 30000) { // Default 30 seconds
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, intervalMs);

    // Also perform initial sync
    this.performSync();
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Perform manual sync
   */
  async performSync(): Promise<boolean> {
    try {
      const isOnline = await offlineService.isOnline();
      if (!isOnline) {
        return false;
      }

      const pendingUpdates = await offlineService.getPendingUpdates();
      if (pendingUpdates.length === 0) {
        return true;
      }

      // Dispatch the sync action to Redux
      const result = await store.dispatch(syncPendingUpdates());
      
      if (syncPendingUpdates.fulfilled.match(result)) {
        console.log('Sync completed successfully');
        return true;
      } else {
        console.warn('Sync failed:', result.payload);
        return false;
      }
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    const pendingUpdates = await offlineService.getPendingUpdates();
    const lastSync = await offlineService.getLastSync();
    const isOnline = await offlineService.isOnline();

    return {
      isOnline,
      pendingUpdatesCount: pendingUpdates.length,
      lastSync: lastSync ? new Date(lastSync) : null,
      isAutoSyncRunning: this.isRunning
    };
  }

  /**
   * Force sync all pending updates immediately
   */
  async forceSyncAll(): Promise<{ success: number; failed: number }> {
    const pendingUpdates = await offlineService.getPendingUpdates();
    let success = 0;
    let failed = 0;

    for (const pendingUpdate of pendingUpdates) {
      try {
        await shelterService.updateStatus(
          pendingUpdate.update.shelterId,
          {
            capacity: pendingUpdate.update.capacity,
            resources: pendingUpdate.update.resources,
            status: pendingUpdate.update.status,
            urgentNeeds: pendingUpdate.update.urgentNeeds
          }
        );
        
        await offlineService.removeUpdate(pendingUpdate.id);
        success++;
      } catch (error) {
        await offlineService.incrementRetryCount(pendingUpdate.id);
        failed++;
      }
    }

    if (success > 0) {
      await offlineService.updateLastSync();
    }

    return { success, failed };
  }

  /**
   * Clean up old failed updates (older than 24 hours)
   */
  async cleanupOldUpdates() {
    const pendingUpdates = await offlineService.getPendingUpdates();
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    const updatesToKeep = pendingUpdates.filter(update => {
      const updateTime = new Date(update.createdAt).getTime();
      return updateTime > cutoffTime && update.retryCount < 5; // Keep if recent and not failed too many times
    });

    if (updatesToKeep.length !== pendingUpdates.length) {
      await offlineService.clearPendingUpdates();
      
      // Re-add the updates we want to keep
      for (const update of updatesToKeep) {
        await offlineService.queueUpdate(update.update);
      }
    }
  }
}

export const syncService = new SyncService();