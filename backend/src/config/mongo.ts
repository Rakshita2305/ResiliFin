import mongoose from 'mongoose';

import { env } from './env';
import { logger } from '../utils/logger';
import { UserModel } from '../modules/users/user.model';

const FIREBASE_FIELD_CANDIDATES = ['firebaseUid', 'firebaseUserId', 'firebaseId', 'firebaseEmail', 'firebaseClaims'];

const cleanupFirebaseArtifacts = async (): Promise<void> => {
  const db = mongoose.connection.db;

  if (!db) {
    return;
  }

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();

  for (const item of collections) {
    if (!item.name) {
      continue;
    }

    const collection = db.collection(item.name);

    try {
      const indexes = await collection.indexes();
      for (const index of indexes) {
        const indexName = index.name ?? '';
        const keyFields = Object.keys(index.key ?? {});
        const firebaseIndex =
          indexName !== '_id_' &&
          (indexName.toLowerCase().includes('firebase') || keyFields.some((field) => field.toLowerCase().includes('firebase')));

        if (!firebaseIndex) {
          continue;
        }

        await collection.dropIndex(indexName);
        logger.info(`Dropped firebase index ${item.name}.${indexName}`);
      }

      const unsetFields = FIREBASE_FIELD_CANDIDATES.reduce<Record<string, ''>>((acc, field) => {
        acc[field] = '';
        return acc;
      }, {});

      const firebaseFieldFilter = {
        $or: FIREBASE_FIELD_CANDIDATES.map((field) => ({ [field]: { $exists: true } })),
      };

      const unsetResult = await collection.updateMany(firebaseFieldFilter, { $unset: unsetFields });
      if (unsetResult.modifiedCount > 0) {
        logger.info(`Removed firebase fields from ${item.name}: ${unsetResult.modifiedCount} docs`);
      }
    } catch (error) {
      logger.error(`Skipping firebase artifact cleanup for collection ${item.name}`, error);
    }
  }
};

const dropLegacyFirebaseUidIndex = async (): Promise<void> => {
  try {
    const indexes = await UserModel.collection.indexes();
    const hasLegacyIndex = indexes.some((index) => index.name === 'firebaseUid_1');

    if (!hasLegacyIndex) {
      return;
    }

    await UserModel.collection.dropIndex('firebaseUid_1');
    logger.info('Dropped legacy users index: firebaseUid_1');
  } catch (error) {
    // Keep startup resilient; this cleanup is best-effort for old schemas.
    logger.error('Skipping legacy firebaseUid index cleanup', error);
  }
};

export const connectMongo = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDbName,
  });
  await dropLegacyFirebaseUidIndex();
  await cleanupFirebaseArtifacts();
  logger.info(`MongoDB connected: ${env.mongoDbName}`);
};

export const disconnectMongo = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
