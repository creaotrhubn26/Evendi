import cron from 'node-cron';

/**
 * Subscription Management Cron Jobs
 * 
 * This module sets up automated tasks for the subscription system:
 * - Daily trial expiration checks
 * - Daily trial reminder notifications (7, 3, 1 days before expiry)
 */

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_SECRET = process.env.ADMIN_CRON_SECRET || 'your-secure-admin-secret';

/**
 * Check for expired trials and pause them
 * Runs daily at 09:00 UTC (10:00 CET / 11:00 CEST)
 */
export const scheduleExpiredTrialsCheck = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running expired trials check...', new Date().toISOString());
    
    try {
      const response = await fetch(`${API_URL}/api/admin/subscriptions/check-expired-trials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[CRON] Expired trials check completed:', result);
      
      if (result.expiredCount > 0) {
        console.log(`[CRON] ✅ Paused ${result.expiredCount} expired trial(s)`);
      } else {
        console.log('[CRON] ℹ️ No expired trials found');
      }
    } catch (error) {
      console.error('[CRON] ❌ Error checking expired trials:', error);
    }
  });

  console.log('[CRON] ✅ Expired trials check scheduled (daily at 09:00 UTC)');
};

/**
 * Send trial expiration reminders
 * Runs daily at 10:00 UTC (11:00 CET / 12:00 CEST)
 * Sends notifications at 7, 3, and 1 days before trial expiry
 */
export const scheduleTrialReminders = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Running trial reminders...', new Date().toISOString());
    
    try {
      const response = await fetch(`${API_URL}/api/admin/subscriptions/send-trial-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[CRON] Trial reminders completed:', result);
      
      const total = result.reminders7d + result.reminders3d + result.reminders1d;
      if (total > 0) {
        console.log(`[CRON] ✅ Sent ${total} reminder(s):`);
        console.log(`  - 7 days: ${result.reminders7d}`);
        console.log(`  - 3 days: ${result.reminders3d}`);
        console.log(`  - 1 day: ${result.reminders1d}`);
      } else {
        console.log('[CRON] ℹ️ No reminders to send');
      }
    } catch (error) {
      console.error('[CRON] ❌ Error sending trial reminders:', error);
    }
  });

  console.log('[CRON] ✅ Trial reminders scheduled (daily at 10:00 UTC)');
};

/**
 * Initialize all subscription cron jobs
 */
export const initializeSubscriptionCrons = () => {
  console.log('\n[CRON] Initializing subscription cron jobs...');
  
  scheduleExpiredTrialsCheck();
  scheduleTrialReminders();
  
  console.log('[CRON] All subscription cron jobs initialized\n');
};

/**
 * Manual trigger functions for testing
 */
export const manualTriggers = {
  async checkExpiredTrials() {
    console.log('[MANUAL] Triggering expired trials check...');
    const response = await fetch(`${API_URL}/api/admin/subscriptions/check-expired-trials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET}`,
      },
    });
    return response.json();
  },

  async sendTrialReminders() {
    console.log('[MANUAL] Triggering trial reminders...');
    const response = await fetch(`${API_URL}/api/admin/subscriptions/send-trial-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET}`,
      },
    });
    return response.json();
  },
};
