// Enhanced storage system with localStorage and IndexedDB support
const DB_NAME = "FBAShipments";
const DB_VERSION = 1;
const SHIPMENT_STORE = "shipments";
const SHIPMENT_LIST_KEY = "shipmentList";
const SHIPMENT_METADATA_KEY = "shipmentMetadata"; // New key for metadata

// Check if IndexedDB is available
const indexedDBSupported =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB;

// Open IndexedDB connection
async function openDB() {
  return new Promise((resolve, reject) => {
    if (!indexedDBSupported) {
      console.warn("IndexedDB not supported, falling back to localStorage");
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Create object store for shipments if it doesn't exist
      if (!db.objectStoreNames.contains(SHIPMENT_STORE)) {
        const store = db.createObjectStore(SHIPMENT_STORE, {
          keyPath: "shipmentID",
        });
        // Add index for creation date
        store.createIndex("createdDate", "createdDate", { unique: false });
        // Add index for last modified date
        store.createIndex("lastModifiedDate", "lastModifiedDate", {
          unique: false,
        });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

// Get list of all shipment IDs with metadata
export async function getShipmentList() {
  try {
    // Try IndexedDB first
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const transaction = db.transaction(SHIPMENT_STORE, "readonly");
        const store = transaction.objectStore(SHIPMENT_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          // Return array of objects with shipmentID, createdDate and lastModifiedDate
          const shipments = request.result.map((item) => ({
            id: item.shipmentID,
            createdDate: item.createdDate,
            lastModifiedDate: item.lastModifiedDate,
          }));
          // Sort by lastModifiedDate (most recent first)
          shipments.sort(
            (a, b) => new Date(b.lastModifiedDate) - new Date(a.createdDate)
          );
          resolve(shipments);
        };

        request.onerror = () => {
          console.warn(
            "Failed to get shipment list from IndexedDB, falling back to localStorage"
          );
          // Fallback to localStorage
          const storedMetadata = localStorage.getItem(SHIPMENT_METADATA_KEY);
          const metadata = storedMetadata ? JSON.parse(storedMetadata) : {};
          const storedList = localStorage.getItem(SHIPMENT_LIST_KEY);
          const ids = storedList ? JSON.parse(storedList) : [];

          // Convert to array of objects with metadata
          const shipments = ids.map((id) => ({
            id,
            createdDate: metadata[id]?.createdDate || new Date().toISOString(),
            lastModifiedDate:
              metadata[id]?.lastModifiedDate || new Date().toISOString(),
          }));

          resolve(shipments);
        };
      });
    } else {
      // Use localStorage
      const storedMetadata = localStorage.getItem(SHIPMENT_METADATA_KEY);
      const metadata = storedMetadata ? JSON.parse(storedMetadata) : {};
      const storedList = localStorage.getItem(SHIPMENT_LIST_KEY);
      const ids = storedList ? JSON.parse(storedList) : [];

      // Convert to array of objects with metadata
      const shipments = ids.map((id) => ({
        id,
        createdDate: metadata[id]?.createdDate || new Date().toISOString(),
        lastModifiedDate:
          metadata[id]?.lastModifiedDate || new Date().toISOString(),
      }));

      return shipments;
    }
  } catch (error) {
    console.error("Error getting shipment list:", error);
    return [];
  }
}

// Add a shipment ID to the list with metadata
async function addShipmentToList(shipmentID, createdDate, lastModifiedDate) {
  try {
    const currentShipments = await getShipmentList();
    const currentIDs = currentShipments.map((s) => s.id);

    if (!currentIDs.includes(shipmentID)) {
      // Add new shipment ID with metadata
      const now = new Date().toISOString();
      const newShipment = {
        id: shipmentID,
        createdDate: createdDate || now,
        lastModifiedDate: lastModifiedDate || now,
      };
      const newList = [...currentShipments, newShipment];
      const newIDs = [...currentIDs, shipmentID];

      // Try IndexedDB first
      const db = await openDB();
      if (!db) {
        // Fallback to localStorage if IndexedDB isn't available
        localStorage.setItem(SHIPMENT_LIST_KEY, JSON.stringify(newIDs));

        // Update metadata in localStorage
        const storedMetadata = localStorage.getItem(SHIPMENT_METADATA_KEY);
        const metadata = storedMetadata ? JSON.parse(storedMetadata) : {};
        metadata[shipmentID] = {
          createdDate: newShipment.createdDate,
          lastModifiedDate: newShipment.lastModifiedDate,
        };
        localStorage.setItem(SHIPMENT_METADATA_KEY, JSON.stringify(metadata));
      }

      // Always update localStorage as well for redundancy
      localStorage.setItem(SHIPMENT_LIST_KEY, JSON.stringify(newIDs));

      // Update metadata in localStorage
      const storedMetadata = localStorage.getItem(SHIPMENT_METADATA_KEY);
      const metadata = storedMetadata ? JSON.parse(storedMetadata) : {};
      metadata[shipmentID] = {
        createdDate: newShipment.createdDate,
        lastModifiedDate: newShipment.lastModifiedDate,
      };
      localStorage.setItem(SHIPMENT_METADATA_KEY, JSON.stringify(metadata));
    } else {
      // Update last modified date for existing shipment
      const now = new Date().toISOString();

      // Update in localStorage
      const storedMetadata = localStorage.getItem(SHIPMENT_METADATA_KEY);
      const metadata = storedMetadata ? JSON.parse(storedMetadata) : {};
      if (metadata[shipmentID]) {
        metadata[shipmentID].lastModifiedDate = lastModifiedDate || now;
        localStorage.setItem(SHIPMENT_METADATA_KEY, JSON.stringify(metadata));
      }
    }
  } catch (error) {
    console.error("Error adding shipment to list:", error);
  }
}

// Save import data with a specific shipmentID
export async function saveImportData(data, shipmentID) {
  // Ensure we have a shipmentID
  if (!shipmentID) {
    // Generate a random shipmentID if none is provided
    shipmentID =
      data.shipmentID ||
      `FBA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Create timestamps
  const now = new Date().toISOString();
  const createdDate = data.createdDate || now;
  const lastModifiedDate = now;

  // Store the shipmentID and dates in the data object
  data.shipmentID = shipmentID;
  data.createdDate = createdDate;
  data.lastModifiedDate = lastModifiedDate;

  try {
    // Add to shipment list with metadata
    await addShipmentToList(shipmentID, createdDate, lastModifiedDate);

    // Try IndexedDB first
    const db = await openDB();
    if (db) {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(SHIPMENT_STORE, "readwrite");
        const store = transaction.objectStore(SHIPMENT_STORE);
        const request = store.put({
          shipmentID,
          data,
          createdDate,
          lastModifiedDate,
        });

        request.onsuccess = () => {
          // Also save to localStorage as backup
          localStorage.setItem(
            `importData_${shipmentID}`,
            JSON.stringify({
              ...data,
              createdDate,
              lastModifiedDate,
            })
          );
          resolve(shipmentID);
        };

        request.onerror = (event) => {
          console.warn(
            "Error saving to IndexedDB, falling back to localStorage"
          );
          localStorage.setItem(
            `importData_${shipmentID}`,
            JSON.stringify({
              ...data,
              createdDate,
              lastModifiedDate,
            })
          );
          resolve(shipmentID);
        };
      });
    } else {
      // Use localStorage
      localStorage.setItem(
        `importData_${shipmentID}`,
        JSON.stringify({
          ...data,
          createdDate,
          lastModifiedDate,
        })
      );
      return shipmentID;
    }
  } catch (error) {
    console.error("Error saving import data:", error);

    // Last resort fallback
    localStorage.setItem(
      `importData_${shipmentID}`,
      JSON.stringify({
        ...data,
        createdDate,
        lastModifiedDate,
      })
    );
    return shipmentID;
  }
}

// Get import data by shipmentID
export async function getImportData(shipmentID) {
  try {
    // If shipmentID is provided, get specific shipment
    if (shipmentID) {
      // Try IndexedDB first
      const db = await openDB();
      if (db) {
        return new Promise((resolve) => {
          const transaction = db.transaction(SHIPMENT_STORE, "readonly");
          const store = transaction.objectStore(SHIPMENT_STORE);
          const request = store.get(shipmentID);

          request.onsuccess = () => {
            if (request.result) {
              resolve(request.result.data);
            } else {
              // Fallback to localStorage
              const storedData = localStorage.getItem(
                `importData_${shipmentID}`
              );
              resolve(storedData ? JSON.parse(storedData) : null);
            }
          };

          request.onerror = () => {
            // Fallback to localStorage
            const storedData = localStorage.getItem(`importData_${shipmentID}`);
            resolve(storedData ? JSON.parse(storedData) : null);
          };
        });
      } else {
        // Use localStorage
        const storedData = localStorage.getItem(`importData_${shipmentID}`);
        return storedData ? JSON.parse(storedData) : null;
      }
    } else {
      // No shipmentID provided, get the most recent one
      const shipmentList = await getShipmentList();
      if (shipmentList.length > 0) {
        // Get the most recent by lastModifiedDate
        shipmentList.sort(
          (a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate)
        );
        const mostRecentID = shipmentList[0].id;
        return getImportData(mostRecentID);
      }
      return null;
    }
  } catch (error) {
    console.error("Error getting import data:", error);

    // Last resort fallback for specific ID
    if (shipmentID) {
      const storedData = localStorage.getItem(`importData_${shipmentID}`);
      return storedData ? JSON.parse(storedData) : null;
    }

    // Original fallback for backwards compatibility
    const legacyData = localStorage.getItem("importData");
    return legacyData ? JSON.parse(legacyData) : null;
  }
}

// Get all shipments with their data
export async function getAllShipments() {
  try {
    const shipmentList = await getShipmentList();
    const shipments = [];

    // Try IndexedDB first
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const transaction = db.transaction(SHIPMENT_STORE, "readonly");
        const store = transaction.objectStore(SHIPMENT_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
          // Sort by lastModifiedDate (most recent first)
          const data = request.result.map((item) => item.data);
          data.sort(
            (a, b) =>
              new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate)
          );
          resolve(data);
        };

        request.onerror = async () => {
          // Fallback to localStorage
          for (const shipment of shipmentList) {
            const data = localStorage.getItem(`importData_${shipment.id}`);
            if (data) {
              shipments.push(JSON.parse(data));
            }
          }
          // Sort by lastModifiedDate
          shipments.sort(
            (a, b) =>
              new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate)
          );
          resolve(shipments);
        };
      });
    } else {
      // Use localStorage
      for (const shipment of shipmentList) {
        const data = localStorage.getItem(`importData_${shipment.id}`);
        if (data) {
          shipments.push(JSON.parse(data));
        }
      }
      // Sort by lastModifiedDate
      shipments.sort(
        (a, b) => new Date(b.lastModifiedDate) - new Date(a.lastModifiedDate)
      );
      return shipments;
    }
  } catch (error) {
    console.error("Error getting all shipments:", error);
    return [];
  }
}

// Delete a shipment by ID
export async function deleteShipment(shipmentID) {
  try {
    // Remove from list first
    const allShipments = await getShipmentList();
    const newList = allShipments.filter(
      (shipment) => shipment.id !== shipmentID
    );
    const newIDs = newList.map((shipment) => shipment.id);

    // Update localStorage list
    localStorage.setItem(SHIPMENT_LIST_KEY, JSON.stringify(newIDs));

    // Update metadata
    const storedMetadata = localStorage.getItem(SHIPMENT_METADATA_KEY);
    if (storedMetadata) {
      const metadata = JSON.parse(storedMetadata);
      delete metadata[shipmentID];
      localStorage.setItem(SHIPMENT_METADATA_KEY, JSON.stringify(metadata));
    }

    // Remove from IndexedDB if available
    const db = await openDB();
    if (db) {
      const transaction = db.transaction(SHIPMENT_STORE, "readwrite");
      const store = transaction.objectStore(SHIPMENT_STORE);
      store.delete(shipmentID);
    }

    // Always remove from localStorage too
    localStorage.removeItem(`importData_${shipmentID}`);
    return true;
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return false;
  }
}
