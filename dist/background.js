// const SHEET_ID = "1ltMVRwDsnuOfZjEvs7ZTEFQcpOYKkDarucRub5ArP8U";
// const API_KEY = "AIzaSyBEchBkNxkE8b47nSdt_q7ZUByf1nh8_G8";
// const RANGE = "Sheet1";

// let cachedSheetData = { columns: [], rows: [] };

// async function fetchSheetData() {
//   try {
//     const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`);
//     const data = await response.json();

//     if (data.values && data.values.length > 0) {
//       const [columns, ...rows] = data.values;

//       // Dynamically find the indices of the columns based on column names
//       const ebayItemIdIndex = columns.indexOf('ebay_item_id');
//       const ebayPriceIndex = columns.indexOf('ebay_price');
//       const statusIndex = columns.indexOf('status');

//       if (ebayItemIdIndex === -1 || ebayPriceIndex === -1 || statusIndex === -1) {
//         console.error('Missing expected columns');
//         return;
//       }

//       // Filter rows based on the 'status' column (assuming status is the 3rd column in the sheet)
//       const filteredRows = rows.filter(row => row[statusIndex] === "1"); // Status == "1"

//       // Extract the ebay_item_id from the filtered rows
//       const ebayItemIds = filteredRows.map(row => row[ebayItemIdIndex]);

//       console.log('Filtered ebay item ids:', ebayItemIds);

//       // Store the data in the cachedSheetData object
//       cachedSheetData = { columns, rows, ebayItemIds };

//       console.log('Fetched Google Sheet data:', cachedSheetData);
//     } else {
//       cachedSheetData = { columns: [], rows: [], ebayItemIds: [] };
//     }
//   } catch (error) {
//     console.error('Failed to fetch Google Sheet data:', error);
//   }
// }

// // Fetch once when extension is installed or reloaded
// chrome.runtime.onInstalled.addListener(() => {
//   fetchSheetData();
// });

// // Allow App.jsx to request the data
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === 'GET_SHEET_DATA') {
//     sendResponse({ data: cachedSheetData });
//   }
//   return true;
// });

const SHEET_ID = "1ltMVRwDsnuOfZjEvs7ZTEFQcpOYKkDarucRub5ArP8U";
const API_KEY = "AIzaSyBEchBkNxkE8b47nSdt_q7ZUByf1nh8_G8";
const RANGE = "Sheet1";

// Function to fetch the data from Google Sheets
async function fetchSheetData() {
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`);
    const data = await response.json();

    if (data.values && data.values.length > 0) {
      const [columns, ...rows] = data.values;

      // Dynamically find the indices of the columns based on column names
      const ebayItemIdIndex = columns.indexOf('ebay_item_id');
      const ebayPriceIndex = columns.indexOf('ebay_price');
      const statusIndex = columns.indexOf('status');

      if (ebayItemIdIndex === -1 || ebayPriceIndex === -1 || statusIndex === -1) {
        console.error('Missing expected columns');
        return;
      }

      // Filter rows based on the 'status' column (assuming status is the 3rd column in the sheet)
      const filteredRows = rows.filter(row => row[statusIndex] === "1"); // Status == "1"

      // Extract the ebay_item_id from the filtered rows
      const ebayItemIds = filteredRows.map(row => row[ebayItemIdIndex]);

      console.log('Filtered ebay item ids:', ebayItemIds);

      // Store the data in chrome storage so it persists
      chrome.storage.local.set({ cachedSheetData: { columns, rows, ebayItemIds, lastUpdated: Date.now() } });

      console.log('Fetched Google Sheet data and stored in chrome.storage:', { columns, rows, ebayItemIds });
    } else {
      chrome.storage.local.set({ cachedSheetData: { columns: [], rows: [], ebayItemIds: [] } });
    }
  } catch (error) {
    console.error('Failed to fetch Google Sheet data:', error);
  }
}

// Fetch data on startup or service worker activation
chrome.runtime.onStartup.addListener(() => {
  fetchSheetData();
});

// Fetch data when the extension is installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
  fetchSheetData();
});

// Allow App.jsx to request the data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SHEET_DATA') {
    // Get data from chrome storage
    chrome.storage.local.get('cachedSheetData', (result) => {
      if (result.cachedSheetData) {
        // Check if data is more than 1 hour old (for example)
        const dataAge = Date.now() - result.cachedSheetData.lastUpdated;
        const oneHourInMs = 1000 * 60 * 60;
        if (dataAge > oneHourInMs) {
          // If the data is more than 1 hour old, refresh it
          console.log('Data is stale, refreshing...');
          fetchSheetData();  // Fetch fresh data
        }

        sendResponse({ data: result.cachedSheetData });
      } else {
        sendResponse({ data: { columns: [], rows: [], ebayItemIds: [] } });
      }
    });
    return true; // Keep the message channel open for async response
  }
});

// Periodic data refresh (example: every hour)
setInterval(fetchSheetData, 1000 * 60 * 60); // Refresh every hour
