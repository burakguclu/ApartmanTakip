import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/utils/constants';
import { createDocument } from './firestoreService';

// Collections to wipe on factory reset (admins deliberately excluded)
const WIPEABLE_COLLECTIONS = [
  COLLECTIONS.APARTMENTS,
  COLLECTIONS.BLOCKS,
  COLLECTIONS.FLATS,
  COLLECTIONS.RESIDENTS,
  COLLECTIONS.DUES,
  COLLECTIONS.PAYMENTS,
  COLLECTIONS.EXPENSES,
  COLLECTIONS.INCOMES,
  COLLECTIONS.AUDIT_LOGS,
  COLLECTIONS.NOTIFICATIONS,
];

/**
 * Delete all documents in a single collection (batch deletes, max 500)
 */
async function clearCollection(collectionName: string): Promise<number> {
  const snapshot = await getDocs(collection(db, collectionName));
  let deleted = 0;

  // Firestore batches max 500 operations
  const batchSize = 450;
  let batch = writeBatch(db);
  let count = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(doc(db, collectionName, docSnap.id));
    count++;
    deleted++;

    if (count >= batchSize) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  return deleted;
}

/**
 * Factory reset — wipe all data collections
 */
export async function factoryReset(): Promise<number> {
  let totalDeleted = 0;
  for (const col of WIPEABLE_COLLECTIONS) {
    totalDeleted += await clearCollection(col);
  }
  return totalDeleted;
}

// ──────────────────────────────────────────────
// Test data
// ──────────────────────────────────────────────

const TURKISH_NAMES = [
  'Ahmet Yılmaz', 'Mehmet Kaya', 'Ayşe Demir', 'Fatma Çelik', 'Ali Şahin',
  'Zeynep Arslan', 'Mustafa Doğan', 'Emine Kılıç', 'Hasan Aydın', 'Hüseyin Özdemir',
  'Elif Yıldız', 'İbrahim Öztürk', 'Hatice Erdoğan', 'Ömer Koç', 'Meryem Güneş',
  'Yusuf Korkmaz', 'Rabia Çetin', 'Burak Kaplan', 'Seda Aktaş', 'Emre Polat',
];

const PHONE_PREFIX = '05';

function randomPhone(): string {
  return PHONE_PREFIX + Math.floor(100000000 + Math.random() * 900000000).toString().slice(0, 9);
}

function pickName(index: number): string {
  return TURKISH_NAMES[index % TURKISH_NAMES.length];
}

/**
 * Generate test data:
 *  - 2 apartments
 *  - 2 blocks per apartment
 *  - 5 flats per block
 *  - 1 resident per flat
 */
export async function generateTestData(userId: string): Promise<{
  apartments: number;
  blocks: number;
  flats: number;
  residents: number;
}> {
  let residentIndex = 0;

  const aptConfigs = [
    { name: 'Yıldız Apartmanı', address: 'Atatürk Cad. No:12', city: 'İstanbul', district: 'Kadıköy' },
    { name: 'Güneş Sitesi', address: 'Cumhuriyet Mah. No:45', city: 'İstanbul', district: 'Beşiktaş' },
  ];

  const blockNames = ['A Blok', 'B Blok'];

  let totalBlocks = 0;
  let totalFlats = 0;
  let totalResidents = 0;

  for (const aptConfig of aptConfigs) {
    // Create apartment
    const apartmentId = await createDocument<Record<string, unknown>>(COLLECTIONS.APARTMENTS, {
      name: aptConfig.name,
      address: aptConfig.address,
      city: aptConfig.city,
      district: aptConfig.district,
      totalUnits: 10,
      createdBy: userId,
    });

    for (const blockName of blockNames) {
      // Create block
      const blockId = await createDocument<Record<string, unknown>>(COLLECTIONS.BLOCKS, {
        apartmentId,
        name: blockName,
        totalFloors: 5,
        createdBy: userId,
      });
      totalBlocks++;

      let flatCounter = 1;
      for (let f = 1; f <= 5; f++) {
        // Create flat
        const flatId = await createDocument<Record<string, unknown>>(COLLECTIONS.FLATS, {
          apartmentId,
          blockId,
          flatNumber: String(flatCounter),
          floor: Math.ceil(f / 2), // distribute across floors
          type: 'residential',
          occupancyStatus: 'occupied',
          createdBy: userId,
        });
        flatCounter++;
        totalFlats++;

        // Create resident
        const fullName = pickName(residentIndex);
        const [firstName, lastName] = fullName.split(' ');
        await createDocument<Record<string, unknown>>(COLLECTIONS.RESIDENTS, {
          apartmentId,
          blockId,
          flatId,
          firstName,
          lastName,
          phone: randomPhone(),
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          isOwner: residentIndex % 3 === 0, // every 3rd is owner
          moveInDate: '2025-01-15',
          isActive: true,
          createdBy: userId,
        });
        totalResidents++;
        residentIndex++;
      }
    }
  }

  return {
    apartments: aptConfigs.length,
    blocks: totalBlocks,
    flats: totalFlats,
    residents: totalResidents,
  };
}
