import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/config/db.js';

import app from './src/app.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (err) {
    console.error('❌ Critical system startup failure:', err);
    process.exit(1);
  }
};

startServer();
