const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Drop any legacy unique indexes that conflict with our schema.
 * The shared 'smart-user-db' may have pre-existing indexes from other projects.
 */
const cleanLegacyIndexes = async () => {
  const db = mongoose.connection.db;

  // Drop unique index on 'phone' — we allow multiple users with empty phone
  try {
    await db.collection('users').dropIndex('phone_1');
    logger.info('Dropped legacy unique index: users.phone_1');
  } catch (_) {
    // Index does not exist — that's fine
  }

  // Drop any other unexpected unique indexes on non-unique fields
  const indexesToDrop = ['avatar_1'];
  for (const idx of indexesToDrop) {
    try {
      await db.collection('users').dropIndex(idx);
      logger.info(`Dropped legacy index: users.${idx}`);
    } catch (_) {}
  }
};

const connectDB = async () => {
  let delay = 3000;
  let attempt = 0;

  // USE_MEMORY_DB=true → in-process MongoDB via mongodb-memory-server.
  // Real MongoDB o'rnatish kerakmas. Faqat MONGO_URI berilgan bo'lsa real DB ishlatiladi.
  if (process.env.USE_MEMORY_DB === 'true' && !process.env.MONGO_URI) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    process.env.MONGO_URI = mem.getUri('savdo_db');
    logger.info(`MongoMemoryServer ishga tushdi: ${process.env.MONGO_URI}`);
  }

  const tryConnect = async () => {
    attempt++;
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info(`MongoDB connected: ${conn.connection.host}`);
      await cleanLegacyIndexes();

      // USE_MEMORY_DB rejimida memory DB har restart'da bo'shaydi — admin'lar avtomatik yaratilsin
      if (process.env.USE_MEMORY_DB === 'true') {
        try {
          const User = require('../models/User.model');
          const seedAdmins = [
            { name: 'Super Admin', email: 'superadmin@savdo.uz', password: 'Admin@1234', role: 'SUPER_ADMIN' },
            { name: 'Admin',       email: 'admin@savdo.uz',      password: 'Admin@1234', role: 'ADMIN' },
          ];
          for (const a of seedAdmins) {
            if (!(await User.findOne({ email: a.email }))) {
              await User.create(a);
              logger.info(`Seeded ${a.role}: ${a.email} / ${a.password}`);
            }
          }
        } catch (e) {
          logger.warn(`Admin seed skipped: ${e.message}`);
        }
      }

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Reconnecting...');
        setTimeout(tryConnect, 5000);
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });
    } catch (error) {
      logger.warn(`MongoDB ulanmadi (${attempt}-urinish): ${error.message}`);
      logger.warn(`${delay / 1000}s dan keyin qayta uriniladi... (MongoDB: ${process.env.MONGO_URI})`);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 30000);
      return tryConnect();
    }
  };

  await tryConnect();
};

module.exports = connectDB;
