// File: services/cronJobs.js
import cron from 'node-cron';
import { processDailyIncome } from '../controllers/depositController.js';

// 🔥 Daily income cron job - runs every day at 12:01 AM
export const startDailyIncomeCron = () => {
  console.log('🚀 Starting daily income cron job...');
  
  // Run every day at 12:01 AM
  cron.schedule('1 0 * * *', async () => {
    console.log('⏰ Daily income cron job triggered at:', new Date().toISOString());
    try {
      await processDailyIncome();
      console.log('✅ Daily income processing completed successfully');
    } catch (error) {
      console.error('❌ Daily income cron job failed:', error);
    }
  }, {
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  console.log('✅ Daily income cron job scheduled successfully');
};

// Optional: Manual trigger for testing
export const triggerDailyIncomeManually = async () => {
  console.log('🧪 Manually triggering daily income processing...');
  try {
    await processDailyIncome();
    console.log('✅ Manual daily income processing completed');
  } catch (error) {
    console.error('❌ Manual daily income processing failed:', error);
  }
};