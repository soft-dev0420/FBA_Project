import { openDB } from 'idb';

const DB_NAME = 'fbaToolDB';
const DB_VERSION = 2; // incremented because we added box storage
const ITEM_STORE = 'boxContent';
const BOX_STORE = 'boxes';

// Initialize or upgrade the database
export const initDB = async () => {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ITEM_STORE)) {
        db.createObjectStore(ITEM_STORE, { keyPath: 'id', autoIncrement: false });
      }
      if (!db.objectStoreNames.contains(BOX_STORE)) {
        db.createObjectStore(BOX_STORE, { keyPath: 'id' });
      }
    }
  });
};

// ------------------------- ITEM (PRODUCT) DATA -------------------------

// Save product data (parsed from Amazon file)
export const saveParsedData = async (items) => {
  const db = await initDB();
  const tx = db.transaction(ITEM_STORE, 'readwrite');
  const store = tx.objectStore(ITEM_STORE);
  await store.clear();
  for (const item of items) {
    await store.put(item);
  }
  await tx.done;
};

// Get all saved product entries
export const getAllBoxContent = async () => {
  const db = await initDB();
  return await db.getAll(ITEM_STORE);
};

// Clear only product data
export const clearBoxContent = async () => {
  const db = await initDB();
  const tx = db.transaction(ITEM_STORE, 'readwrite');
  await tx.objectStore(ITEM_STORE).clear();
  await tx.done;
};

// ---------------------------- BOX DATA ----------------------------

// Save all boxes
export const saveBoxes = async (boxes) => {
  const db = await initDB();
  const tx = db.transaction(BOX_STORE, 'readwrite');
  const store = tx.objectStore(BOX_STORE);
  await store.clear();
  for (const box of boxes) {
    await store.put(box);
  }
  await tx.done;
};

// Get all saved boxes
export const getBoxes = async () => {
  const db = await initDB();
  return await db.getAll(BOX_STORE);
};

// Clear only boxes
export const clearBoxes = async () => {
  const db = await initDB();
  const tx = db.transaction(BOX_STORE, 'readwrite');
  await tx.objectStore(BOX_STORE).clear();
  await tx.done;
};

// ---------------------------- GLOBAL RESET ----------------------------

// Clear both products and boxes
export const clearAllData = async () => {
  const db = await initDB();
  await Promise.all([
    db.clear(ITEM_STORE),
    db.clear(BOX_STORE)
  ]);
};
