import * as XLSX from "xlsx";

// Parse Excel/CSV file, return { skus: [...], totalBoxes }
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length < 2) {
          // Expect at least an instruction/cover sheet and the main data sheet
          reject(
            new Error(
              "Invalid Excel file: Expected at least 2 sheets for processing."
            )
          );
          return;
        }

        const instructionSheet = workbook.Sheets[sheetNames[0]];
        const mainDataSheet = workbook.Sheets[sheetNames[1]];
        // Metadata sheet is optional, typically the third sheet
        const metadataSheet =
          sheetNames.length > 2 ? workbook.Sheets[sheetNames[2]] : null;

        // Convert sheets to JSON (array of arrays) for storage and later reconstruction
        // Using defval: "" to ensure empty cells are represented, helps in reconstruction
        const instructionData = instructionSheet
          ? XLSX.utils.sheet_to_json(instructionSheet, {
              header: 1,
              defval: "",
            })
          : null;
        const json = XLSX.utils.sheet_to_json(mainDataSheet, {
          header: 1,
          defval: "",
        });
        let mainJson = [];
        let length = 0;
        for (let i in json[4]) {
          if ((json[4][i] === "" || json[4][12] === 0) && i > 11) {
            length = i;
            break;
          } else {
            length = json[4].length;
          }
        }

        json.map((item) => {
          let array_item = [];
          for (let i = 0; i < length; i++) {
            array_item.push(item[i]);
          }
          mainJson.push(array_item);
        });
        const metadataData = metadataSheet
          ? XLSX.utils.sheet_to_json(metadataSheet, { header: 1, defval: "" })
          : null;

        resolve({
          mainJson,
          originalSheetData: {
            // Store data for instruction and metadata sheets
            instruction: instructionData
              ? { name: sheetNames[0], data: instructionData }
              : null,
            metadata: metadataData
              ? { name: sheetNames[2] || "Metadata", data: metadataData }
              : null,
          },
        });
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

/**
 * Export data in Amazon format with shipmentID support
 * @param {Object} importData - The imported data to export
 * @param {string} shipmentID - Optional shipmentID to include in the filename
 */
export function exportAmazonFormat(importData, shipmentID) {
  try {
    let box_merge_num = 0;
    let box_counter = -1;
    let max = importData.mainJson.length;
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Helper function to convert numeric strings from column 9 onwards
    const convertNumericFromColumn9 = (row) => {
      return row.map((cell, cellIndex) => {
        // Leave columns 0-8 untouched
        if (cellIndex < 9) return cell;

        // Handle empty cells
        if (cell === null || cell === undefined || cell === "") return cell;

        // Convert numeric strings to numbers
        if (typeof cell === "string") {
          // Remove commas and whitespace
          const cleanString = cell.replace(/,|\s/g, "");
          const numberValue = Number(cleanString);

          // Return number if valid, otherwise original value
          if (!isNaN(numberValue) && cleanString !== "") {
            return numberValue;
          }
        }
        return cell;
      });
    };

    // 1. Add Instruction Sheet (if available from original import)
    if (importData?.originalSheetData?.instruction?.data) {
      const ws_instruction = XLSX.utils.aoa_to_sheet(
        importData.originalSheetData.instruction.data
      );
      XLSX.utils.book_append_sheet(
        wb,
        ws_instruction,
        importData.originalSheetData.instruction.name || "Instructions"
      );
    }

    // 2. Process and Add BoxSummary Sheet
    for (let i = 0; i < max; i++) {
      if (importData.mainJson[i][0] === "Name of box") {
        box_merge_num = i;
      }

      // Convert numeric values from column 9 onwards
      const processedRow = convertNumericFromColumn9(importData.mainJson[i]);
      ws_data.push(processedRow);
    }

    // Calculate box counter
    const boxCount = importData.mainJson[box_merge_num];
    for (let i = 0; i < boxCount.length; i++) {
      if (boxCount[i] !== "") {
        box_counter++;
      }
    }

    // Explicitly convert box counter to number (column 12)
    importData.mainJson[2][12] = Number(box_counter);

    // Create worksheet with processed data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Configure cell merges
    ws["!merges"] = [];
    for (let i = 0; i < max; i++) {
      if (i === 0) {
        // Merge first row columns A-L
        ws["!merges"].push({ s: { r: i, c: 0 }, e: { r: i, c: 11 } });
      } else if (i === 1) {
        // Merge second row columns A-B
        ws["!merges"].push({ s: { r: i, c: 0 }, e: { r: i, c: 1 } });
      } else if (i === 2) {
        // Merge third row columns A-C and I-L
        ws["!merges"].push({ s: { r: i, c: 0 }, e: { r: i, c: 2 } });
        ws["!merges"].push({ s: { r: i, c: 8 }, e: { r: i, c: 11 } });
      } else if (i === box_merge_num) {
        // Merge box header rows
        for (let j = 0; j <= 4; j++) {
          ws["!merges"].push({ s: { r: i + j, c: 0 }, e: { r: i + j, c: 11 } });
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Box packing information");

    // 3. Add Metadata Sheet (if available from original import)
    if (importData?.originalSheetData?.metadata?.data) {
      const ws_metadata = XLSX.utils.aoa_to_sheet(
        importData.originalSheetData.metadata.data
      );
      XLSX.utils.book_append_sheet(
        wb,
        ws_metadata,
        importData.originalSheetData.metadata.name || "Metadata"
      );
    }

    // Generate the filename with shipmentID if provided
    const filename = shipmentID
      ? `FBA_(${shipmentID})_${importData.shipmentName}_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      : `FBA_with_details_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, filename);
    return filename; // Return the filename for reference
  } catch (error) {
    console.error("Error exporting Amazon format:", error);
    throw new Error("Failed to export Amazon format data");
  }
}

/**
 * Export box summary data with shipmentID support
 * @param {Object} importData - The imported data to export
 * @param {string} shipmentID - Optional shipmentID to include in the filename
 */
export function exportBoxSummary(importData, shipmentID) {
  try {
    const wb = XLSX.utils.book_new();
    let boxNameId = 0;

    // Find the box name row index
    for (let i = 0; i < importData.mainJson.length; i++) {
      if (importData.mainJson[i][0] === "Name of box") {
        boxNameId = i;
        break;
      }
    }

    // Extract box details arrays
    const name = importData.mainJson[boxNameId];

    // Create worksheet data array with headers
    const ws_data = [
      ["Box Summary with FNSKU Details", "", ""], //  Added third column
    ];

    // Add shipmentID to summary if provided
    if (shipmentID) {
      ws_data.push([`Shipment ID: ${shipmentID}`, "", ""]); //  Added third column
      ws_data.push(["", "", ""]); //  Added third column for spacing
    }

    //  Updated column headers to include Total Units
    ws_data.push(["Box Name", "Contents (FNSKU - Quantity)", "Total Units"]);

    // Process each box
    for (let i = 1; i < name.length; i++) {
      // Skip empty boxes
      if (name[i] === "") continue;

      // Get box name for Column A
      const boxName = name[i];

      const boxItems = [];
      let totalUnits = 0; // Track total units in this box

      importData.mainJson.forEach((row, idx) => {
        // Only process rows that have FNSKU information (column 4)
        if (idx > 4 && row[4] !== "" && row[i] && row[i] !== "") {
          const quantity = parseInt(row[i]) || 0; // Parse quantity as integer
          boxItems.push(`${row[4]} - ${row[i]}`);
          totalUnits += quantity; // Add to total units
        }
      });

      if (boxItems.length > 0) {
        ws_data.push([boxName, boxItems.join(", "), totalUnits]);
      } else {
        ws_data.push([boxName, "No items", 0]);
      }
    }

    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    ws["!cols"] = [
      { wch: 20 }, // Column A width for box names
      { wch: 100 }, // Column B width for contents
      { wch: 15 }, // Column C width for total units
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title across all three columns
    ];

    if (shipmentID) {
      ws["!merges"].push(
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } } // Merge shipment ID across all three columns
      );
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Box Summary");

    // Generate the filename with shipmentID if provided
    const filename = shipmentID
      ? `BoxSummary__(${shipmentID})_${importData.shipmentName}_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      : `BoxSummary_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);
    return filename; // Return the filename for reference
  } catch (error) {
    console.error("Error exporting box summary:", error);
    throw new Error("Failed to export box summary data");
  }
}
