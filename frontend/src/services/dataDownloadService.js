import { getUserShipments } from "./migrationService";
import { saveImportData } from "../utils/storage0";

export class DataDownloadService {
  constructor(userEmail) {
    this.userEmail = userEmail;
  }

  // Download all user data from Firebase to local storage
  async downloadUserDataToLocal() {
    try {
      console.log(`🔄 Starting data download for user: ${this.userEmail}`);

      // Get all user shipments from Firebase
      const firebaseShipments = await getUserShipments(this.userEmail);

      if (firebaseShipments.length === 0) {
        console.log("✅ No shipments found in Firebase to download");
        return {
          success: true,
          downloadedCount: 0,
          message: "No shipments to download - ready to create new ones!",
        };
      }

      let downloadedCount = 0;
      const errors = [];

      // Download each shipment to local storage
      for (const shipment of firebaseShipments) {
        try {
          // Restore nested arrays if needed (from flattened Firebase data)
          if (shipment.mainJson && shipment.mainJson._metadata?.isFlattened) {
            const { MigrationService } = await import("./migrationService");
            shipment.mainJson = MigrationService.restoreNestedArrays(
              shipment.mainJson
            );
          }

          // Save to local storage/IndexedDB using existing storage system
          await saveImportData(shipment, shipment.shipmentID);
          downloadedCount++;

          console.log(`✅ Downloaded shipment: ${shipment.shipmentID}`);
        } catch (error) {
          console.error(
            `❌ Failed to download shipment ${shipment.shipmentID}:`,
            error
          );
          errors.push(`${shipment.shipmentID}: ${error.message}`);
        }
      }

      const result = {
        success: errors.length === 0,
        downloadedCount,
        totalShipments: firebaseShipments.length,
        errors,
        message:
          errors.length === 0
            ? `Successfully downloaded ${downloadedCount} shipments to local storage`
            : `Downloaded ${downloadedCount}/${firebaseShipments.length} shipments with ${errors.length} errors`,
      };

      console.log(`🎉 Data download completed:`, result);
      return result;
    } catch (error) {
      console.error("❌ Data download failed:", error);
      return {
        success: false,
        downloadedCount: 0,
        totalShipments: 0,
        errors: [error.message],
        message: `Data download failed: ${error.message}`,
      };
    }
  }

  // Check if user has data in Firebase
  async checkFirebaseData() {
    try {
      const firebaseShipments = await getUserShipments(this.userEmail);
      return {
        hasData: firebaseShipments.length > 0,
        shipmentCount: firebaseShipments.length,
      };
    } catch (error) {
      console.error("Error checking Firebase data:", error);
      return {
        hasData: false,
        shipmentCount: 0,
      };
    }
  }
}

// Helper function to download user data
export const downloadUserDataToLocal = async (userEmail) => {
  const downloadService = new DataDownloadService(userEmail);
  return await downloadService.downloadUserDataToLocal();
};

// Helper function to check if user has Firebase data
export const checkUserFirebaseData = async (userEmail) => {
  const downloadService = new DataDownloadService(userEmail);
  return await downloadService.checkFirebaseData();
};
