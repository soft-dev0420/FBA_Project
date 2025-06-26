import {
  collection,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";

// Helper function to create valid dates
const createValidDate = (dateValue) => {
  // If no date value provided, use current time
  if (!dateValue) {
    return new Date();
  }

  // If it's already a valid Date object
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }

  // Try to create a new Date
  const date = new Date(dateValue);

  // Check if the resulting date is valid
  if (isNaN(date.getTime())) {
    console.warn(
      `Invalid date value: ${dateValue}, using current time instead`
    );
    return new Date(); // Fallback to current time
  }

  return date;
};

// Helper function to sanitize email for Firebase key
const sanitizeEmailForFirebase = (email) => {
  return email
    .replace("@", "_at_")
    .replace(/\./g, "_dot_")
    .replace(/[#$[\]]/g, "_");
};

// Helper function to get user shipments from Firebase
export const getUserShipments = async (userEmail) => {
  try {
    const sanitizedEmail = sanitizeEmailForFirebase(userEmail);
    const shipmentsRef = collection(db, "users", sanitizedEmail, "shipments");
    const querySnapshot = await getDocs(shipmentsRef);

    const shipments = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Restore nested arrays if data was flattened
      if (data.mainJson && data.mainJson._metadata?.isFlattened) {
        data.mainJson = MigrationService.restoreNestedArrays(data.mainJson);
      }
      shipments.push({ id: doc.id, ...data });
    });

    return shipments;
  } catch (error) {
    console.error("Error getting user shipments:", error);
    throw error;
  }
};

// Migration service to move data from IndexedDB to Firebase
export class MigrationService {
  constructor(userEmail) {
    this.userEmail = userEmail;
    this.sanitizedEmail = sanitizeEmailForFirebase(userEmail);
    this.DB_NAME = "FBAShipments";
    this.SHIPMENT_STORE = "shipments";
  }

  // Extract all data from IndexedDB
  async extractIndexedDBData() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => {
        console.error("Failed to open IndexedDB");
        reject(request.error);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;

        // Check if the object store exists
        if (!db.objectStoreNames.contains(this.SHIPMENT_STORE)) {
          console.log("No shipment store found in IndexedDB");
          resolve([]);
          return;
        }

        const transaction = db.transaction([this.SHIPMENT_STORE], "readonly");
        const store = transaction.objectStore(this.SHIPMENT_STORE);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const allData = getAllRequest.result;
          console.log(`Found ${allData.length} shipments in IndexedDB`);
          resolve(allData);
        };

        getAllRequest.onerror = () => {
          reject(getAllRequest.error);
        };
      };
    });
  }

  // Extract data from localStorage as fallback
  extractLocalStorageData() {
    const shipmentList = JSON.parse(
      localStorage.getItem("shipmentList") || "[]"
    );
    const shipments = [];

    shipmentList.forEach((shipmentId) => {
      const data = localStorage.getItem(`importData_${shipmentId}`);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          shipments.push({
            shipmentID: shipmentId,
            data: parsedData,
            createdDate: parsedData.createdDate || new Date().toISOString(),
            lastModifiedDate:
              parsedData.lastModifiedDate || new Date().toISOString(),
          });
        } catch (error) {
          console.error(
            `Error parsing localStorage data for ${shipmentId}:`,
            error
          );
        }
      }
    });

    console.log(`Found ${shipments.length} shipments in localStorage`);
    return shipments;
  }

  // Method to flatten nested arrays for Firestore
  flattenNestedArrays(mainJsonArray) {
    if (!Array.isArray(mainJsonArray)) {
      return {
        _metadata: {
          originalLength: 0,
          isFlattened: true,
          flattenedAt: new Date().toISOString(),
          originalType: typeof mainJsonArray,
        },
        data: mainJsonArray,
      };
    }

    const flattened = {};

    mainJsonArray.forEach((row, rowIndex) => {
      if (Array.isArray(row)) {
        // Convert each row array to an object with string keys
        const rowObject = {};
        row.forEach((cell, cellIndex) => {
          // Handle any data type, convert to string if needed
          if (cell === null || cell === undefined) {
            rowObject[`col_${cellIndex}`] = "";
          } else if (typeof cell === "object") {
            rowObject[`col_${cellIndex}`] = JSON.stringify(cell);
          } else {
            rowObject[`col_${cellIndex}`] = String(cell);
          }
        });
        flattened[`row_${rowIndex}`] = rowObject;
      } else {
        // If it's not an array, store as string
        if (row === null || row === undefined) {
          flattened[`row_${rowIndex}`] = "";
        } else if (typeof row === "object") {
          flattened[`row_${rowIndex}`] = JSON.stringify(row);
        } else {
          flattened[`row_${rowIndex}`] = String(row);
        }
      }
    });

    // Store metadata about the original structure
    flattened._metadata = {
      originalLength: mainJsonArray.length,
      isFlattened: true,
      flattenedAt: new Date().toISOString(),
      originalType: "array",
    };

    return flattened;
  }

  // Static method to restore nested arrays from flattened data
  static restoreNestedArrays(flattenedData) {
    if (!flattenedData || !flattenedData._metadata?.isFlattened) {
      return flattenedData;
    }

    // Handle non-array original data
    if (flattenedData._metadata.originalType !== "array") {
      return flattenedData.data;
    }

    const restored = [];
    const keys = Object.keys(flattenedData).filter((key) =>
      key.startsWith("row_")
    );

    // Sort keys numerically
    keys.sort((a, b) => {
      const aNum = parseInt(a.replace("row_", ""));
      const bNum = parseInt(b.replace("row_", ""));
      return aNum - bNum;
    });

    keys.forEach((key) => {
      const rowData = flattenedData[key];
      if (
        typeof rowData === "object" &&
        rowData !== null &&
        !Array.isArray(rowData)
      ) {
        // Restore row array
        const rowArray = [];
        const colKeys = Object.keys(rowData).filter((k) =>
          k.startsWith("col_")
        );

        // Sort column keys numerically
        colKeys.sort((a, b) => {
          const aNum = parseInt(a.replace("col_", ""));
          const bNum = parseInt(b.replace("col_", ""));
          return aNum - bNum;
        });

        colKeys.forEach((colKey) => {
          const colIndex = parseInt(colKey.replace("col_", ""));
          const cellValue = rowData[colKey];

          // Try to parse JSON if it looks like an object
          if (
            typeof cellValue === "string" &&
            (cellValue.startsWith("{") || cellValue.startsWith("["))
          ) {
            try {
              rowArray[colIndex] = JSON.parse(cellValue);
            } catch (e) {
              rowArray[colIndex] = cellValue;
            }
          } else {
            rowArray[colIndex] = cellValue;
          }
        });

        restored.push(rowArray);
      } else {
        // Handle non-object row data
        if (
          typeof rowData === "string" &&
          (rowData.startsWith("{") || rowData.startsWith("["))
        ) {
          try {
            restored.push(JSON.parse(rowData));
          } catch (e) {
            restored.push(rowData);
          }
        } else {
          restored.push(rowData);
        }
      }
    });

    return restored;
  }

  // UPDATED: Transform data to Firebase format with validated dates
  transformDataForFirebase(rawData) {
    return rawData.map((item) => {
      const shipmentData = item.data || item;

      // Flatten the mainJson nested arrays
      const flattenedMainJson = this.flattenNestedArrays(
        shipmentData.mainJson || []
      );

      // Use validated dates - THIS IS THE KEY FIX
      const createdDate = createValidDate(
        item.createdDate || shipmentData.createdDate
      );

      const lastModifiedDate = createValidDate(
        item.lastModifiedDate || shipmentData.lastModifiedDate
      );

      return {
        shipmentID: item.shipmentID || shipmentData.shipmentID,
        shipmentName: shipmentData.shipmentName || item.shipmentID,
        mainJson: flattenedMainJson, // Use flattened version
        userEmail: this.userEmail,
        sanitizedEmail: this.sanitizedEmail,
        createdDate: createdDate, // Use validated date
        lastModifiedDate: lastModifiedDate, // Use validated date
        migratedAt: serverTimestamp(),
        version: "1.0",
      };
    });
  }

  // Upload data to Firebase using email-based structure
  async uploadToFirebase(transformedData) {
    const batchSize = 500; // Firestore batch limit
    const batches = [];

    // Split data into batches
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batchData = transformedData.slice(i, i + batchSize);
      batches.push(batchData);
    }

    console.log(
      `Uploading ${transformedData.length} shipments for user ${this.userEmail} in ${batches.length} batch(es)`
    );

    // Upload each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = writeBatch(db);
      const batchData = batches[i];

      batchData.forEach((shipment) => {
        // Store under: users/{sanitized_email}/shipments/{shipmentID}
        const docRef = doc(
          db,
          "users",
          this.sanitizedEmail,
          "shipments",
          shipment.shipmentID
        );
        batch.set(docRef, shipment);
      });

      try {
        await batch.commit();
        console.log(
          `Batch ${i + 1}/${batches.length} uploaded successfully for user ${
            this.userEmail
          }`
        );
      } catch (error) {
        console.error(
          `Error uploading batch ${i + 1} for user ${this.userEmail}:`,
          error
        );
        throw error;
      }
    }

    // Also create a user profile document
    const userProfileRef = doc(db, "users", this.sanitizedEmail);
    await setDoc(
      userProfileRef,
      {
        email: this.userEmail,
        sanitizedEmail: this.sanitizedEmail,
        lastMigration: serverTimestamp(),
        shipmentCount: transformedData.length,
      },
      { merge: true }
    );

    return transformedData.length;
  }

  // Main migration function
  async migrate() {
    try {
      console.log(`🚀 Starting migration for user ${this.userEmail}...`);

      // Step 1: Extract data from IndexedDB
      let allData = [];
      try {
        allData = await this.extractIndexedDBData();
      } catch (error) {
        console.warn(
          "Failed to extract from IndexedDB, trying localStorage:",
          error
        );
        allData = this.extractLocalStorageData();
      }

      // If IndexedDB was empty, try localStorage
      if (allData.length === 0) {
        console.log("IndexedDB was empty, checking localStorage...");
        allData = this.extractLocalStorageData();
      }

      if (allData.length === 0) {
        console.log("✅ No data found to migrate");
        return {
          success: true,
          migratedCount: 0,
          message: "No data to migrate",
          userEmail: this.userEmail,
        };
      }

      // Debug: Check date values before transformation
      console.log("🔍 Debugging date values...");
      allData.slice(0, 2).forEach((item, index) => {
        const shipmentData = item.data || item;
        console.log(`Item ${index}:`, {
          createdDate: item.createdDate,
          shipmentCreatedDate: shipmentData.createdDate,
          lastModifiedDate: item.lastModifiedDate,
          shipmentLastModifiedDate: shipmentData.lastModifiedDate,
        });
      });

      // Step 2: Transform data for Firebase
      console.log("🔄 Transforming data for Firebase...");
      const transformedData = this.transformDataForFirebase(allData);

      // Step 3: Upload to Firebase with email-based structure
      console.log(`📤 Uploading to Firebase under user: ${this.userEmail}...`);
      const migratedCount = await this.uploadToFirebase(transformedData);

      console.log(
        `✅ Migration completed successfully for user ${this.userEmail}!`
      );
      return {
        success: true,
        migratedCount,
        message: `Successfully migrated ${migratedCount} shipments to Firebase for ${this.userEmail}`,
        userEmail: this.userEmail,
      };
    } catch (error) {
      console.error(`❌ Migration failed for user ${this.userEmail}:`, error);
      return {
        success: false,
        migratedCount: 0,
        message: `Migration failed: ${error.message}`,
        userEmail: this.userEmail,
      };
    }
  }

  // Verify migration by comparing counts
  async verifyMigration() {
    try {
      // Count IndexedDB records
      const indexedDBData = await this.extractIndexedDBData();
      const localStorageData = this.extractLocalStorageData();
      const localCount = Math.max(
        indexedDBData.length,
        localStorageData.length
      );

      // Count Firebase records for this user
      const firebaseShipments = await getUserShipments(this.userEmail);
      const firebaseCount = firebaseShipments.length;

      console.log(`Local storage count for ${this.userEmail}: ${localCount}`);
      console.log(`Firebase count for ${this.userEmail}: ${firebaseCount}`);

      return {
        localCount,
        firebaseCount,
        isValid: localCount === firebaseCount,
        message:
          localCount === firebaseCount
            ? "✅ Migration verification successful"
            : "⚠️ Count mismatch detected",
        userEmail: this.userEmail,
      };
    } catch (error) {
      console.error(`Error verifying migration for ${this.userEmail}:`, error);
      return {
        localCount: 0,
        firebaseCount: 0,
        isValid: false,
        message: `Verification failed: ${error.message}`,
        userEmail: this.userEmail,
      };
    }
  }
}

// Helper function to be used with authentication
export const migrateUserData = async (userEmail) => {
  const migrationService = new MigrationService(userEmail);
  return await migrationService.migrate();
};

export const verifyUserMigration = async (userEmail) => {
  const migrationService = new MigrationService(userEmail);
  return await migrationService.verifyMigration();
};

// Function to get shipment data from Firebase with array restoration
export const getShipmentFromFirebase = async (userEmail, shipmentID) => {
  try {
    const sanitizedEmail = sanitizeEmailForFirebase(userEmail);
    const docRef = doc(db, "users", sanitizedEmail, "shipments", shipmentID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Restore nested arrays if data was flattened
      if (data.mainJson && data.mainJson._metadata?.isFlattened) {
        data.mainJson = MigrationService.restoreNestedArrays(data.mainJson);
      }

      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting shipment from Firebase:", error);
    throw error;
  }
};

// Function to save shipment data to Firebase with array flattening
export const saveShipmentToFirebase = async (
  userEmail,
  shipmentID,
  shipmentData
) => {
  try {
    const sanitizedEmail = sanitizeEmailForFirebase(userEmail);
    const migrationService = new MigrationService(userEmail);

    // Flatten mainJson if it contains nested arrays
    const processedData = { ...shipmentData };
    if (processedData.mainJson && Array.isArray(processedData.mainJson)) {
      processedData.mainJson = migrationService.flattenNestedArrays(
        processedData.mainJson
      );
    }

    const docRef = doc(db, "users", sanitizedEmail, "shipments", shipmentID);
    await setDoc(docRef, {
      ...processedData,
      userEmail: userEmail,
      sanitizedEmail: sanitizedEmail,
      lastModifiedDate: new Date(),
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error saving shipment to Firebase:", error);
    throw error;
  }
};
