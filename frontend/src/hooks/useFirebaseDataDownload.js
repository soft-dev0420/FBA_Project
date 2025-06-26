import { useState } from "react";
import { getUserShipments } from "../services/migrationService";
import { saveImportData } from "../utils/storage0";

export const useFirebaseDataDownload = () => {
  const [downloadState, setDownloadState] = useState({
    isLoading: false,
    isComplete: false,
    progress: 0,
    message: "",
    error: null,
    downloadResult: null,
  });

  const startDownload = async (userEmail) => {
    if (!userEmail) {
      setDownloadState({
        isLoading: false,
        isComplete: true,
        progress: 100,
        message: "No user email provided",
        error: "User not authenticated",
        downloadResult: { success: false, downloadedCount: 0 },
      });
      return;
    }

    try {
      setDownloadState({
        isLoading: true,
        isComplete: false,
        progress: 10,
        message: "Connecting to Firebase...",
        error: null,
        downloadResult: null,
      });

      // Check if user has data in Firebase
      setDownloadState((prev) => ({
        ...prev,
        progress: 30,
        message: "Checking for shipment data...",
      }));

      const firebaseShipments = await getUserShipments(userEmail);

      if (firebaseShipments.length === 0) {
        setDownloadState({
          isLoading: false,
          isComplete: true,
          progress: 100,
          message: "No shipments found in Firebase",
          error: null,
          downloadResult: { success: true, downloadedCount: 0 },
        });
        return { success: true, downloadedCount: 0, hasData: false };
      }

      // Download and store each shipment
      setDownloadState((prev) => ({
        ...prev,
        progress: 50,
        message: `Downloading ${firebaseShipments.length} shipments...`,
      }));

      let downloadedCount = 0;
      const errors = [];

      for (const [index, shipment] of firebaseShipments.entries()) {
        try {
          // Restore nested arrays if needed (from flattened Firebase data)
          if (shipment.mainJson && shipment.mainJson._metadata?.isFlattened) {
            const { MigrationService } = await import(
              "../services/migrationService"
            );
            shipment.mainJson = MigrationService.restoreNestedArrays(
              shipment.mainJson
            );
          }

          // Save to local storage/IndexedDB
          await saveImportData(shipment, shipment.shipmentID);
          downloadedCount++;

          // Update progress
          const progressPercent =
            50 + ((index + 1) / firebaseShipments.length) * 40;
          setDownloadState((prev) => ({
            ...prev,
            progress: Math.round(progressPercent),
            message: `Downloaded ${downloadedCount}/${firebaseShipments.length} shipments...`,
          }));

          console.log(`✅ Downloaded shipment: ${shipment.shipmentID}`);
        } catch (error) {
          console.error(
            `❌ Failed to download shipment ${shipment.shipmentID}:`,
            error
          );
          errors.push(`${shipment.shipmentID}: ${error.message}`);
        }
      }

      // Finalizing
      setDownloadState((prev) => ({
        ...prev,
        progress: 95,
        message: "Finalizing download...",
      }));

      await new Promise((resolve) => setTimeout(resolve, 500));

      const result = {
        success: errors.length === 0,
        downloadedCount,
        totalShipments: firebaseShipments.length,
        errors,
        hasData: downloadedCount > 0,
        message:
          errors.length === 0
            ? `Successfully downloaded ${downloadedCount} shipments!`
            : `Downloaded ${downloadedCount}/${firebaseShipments.length} shipments with ${errors.length} errors`,
      };

      setDownloadState({
        isLoading: false,
        isComplete: true,
        progress: 100,
        message: result.message,
        error: result.success
          ? null
          : `Download completed with ${errors.length} errors`,
        downloadResult: result,
      });

      return result;
    } catch (error) {
      console.error("Data download failed:", error);
      const result = {
        success: false,
        downloadedCount: 0,
        totalShipments: 0,
        errors: [error.message],
        hasData: false,
        message: `Download failed: ${error.message}`,
      };

      setDownloadState({
        isLoading: false,
        isComplete: true,
        progress: 0,
        message: "Download failed",
        error: error.message,
        downloadResult: result,
      });

      return result;
    }
  };

  const resetDownload = () => {
    setDownloadState({
      isLoading: false,
      isComplete: false,
      progress: 0,
      message: "",
      error: null,
      downloadResult: null,
    });
  };

  return {
    ...downloadState,
    startDownload,
    resetDownload,
  };
};
