// import React, { useEffect, useState } from "react";

// function App() {
//   const [sheetData, setSheetData] = useState([]);
//   const [error, setError] = useState("");
//   const [token, setToken] = useState(null); // Store the token
//   const [authStatus, setAuthStatus] = useState(false); // Track auth status

  // const handleClick = () => {
  //   chrome.tabs.create({ url: "https://www.ebay.com/sh/lst/active" });
  // };

//   const getAuthToken = () => {
//     chrome.identity.getAuthToken({ interactive: true }, (token) => {
//       if (chrome.runtime.lastError || !token) {
//         setError(
//           "Authentication failed: " +
//             (chrome.runtime.lastError?.message || "No token received")
//         );
//         console.error("chrome.identity.getAuthToken error:", chrome.runtime.lastError);
//         return;
//       }

//       setToken(token);
//       setAuthStatus(true);
//       fetchSheetData(token); // Fetch data immediately after getting token
//     });
//   };

//   const fetchSheetData = async (authToken) => {
//     if (!authToken) {
//       setError("Not authenticated. Please sign in.");
//       return;
//     }

//     const spreadsheetId = "1ltMVRwDsnuOfZjEvs7ZTEFQcpOYKkDarucRub5ArP8U";
//     const range = "Sheet1!A1:B10";

//     try {
//       const response = await fetch(
//         `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
//         {
//           headers: { Authorization: `Bearer ${authToken}` },
//         }
//       );
//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }
//       const data = await response.json();
//       setSheetData(data.values);
//       console.log("Data from sheet:", data.values);
//       setError(""); // Clear any previous errors
//     } catch (error) {
//       setError("Error fetching sheet data: " + error.message);
//       console.error("Error fetching sheet data:", error);
//     }
//   };

//   const clearAuthToken = () => {
//     chrome.identity.getAuthToken({ interactive: false }, (currentToken) => {
//       if (!chrome.runtime.lastError && currentToken) {
//         chrome.identity.removeCachedAuthToken({ token: currentToken }, () => {
//           setToken(null);
//           setAuthStatus(false);
//           setSheetData([]);
//           setError("");
//           console.log("User signed out.");
//         });
//       }
//     });
//   };

//   useEffect(() => {
//     getAuthToken(); // Attempt to get token on popup load
//   }, []);

//   return (
//     <div className="w-64 h-auto p-4">
      // <button
      //   onClick={handleClick}
      //   className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
      // >
      //   Go to eBay
      // </button>

//       {!authStatus ? (
//         <button
//           onClick={getAuthToken}
//           className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
//         >
//           Sign In with Google
//         </button>
//       ) : (
//         <div>
//           <button
//             onClick={() => fetchSheetData(token)}
//             className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-2"
//           >
//             Fetch Sheet Data
//           </button>
//           <button
//             onClick={clearAuthToken}
//             className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-2"
//           >
//             Sign Out
//           </button>
//           {error && <p className="text-red-500">{error}</p>}
//           <pre>{JSON.stringify(sheetData, null, 2)}</pre>
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

import React, { useEffect, useState } from 'react';

function App() {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [ebayItemIds, setEbayItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SHEET_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        setError('Failed to get sheet data');
        setLoading(false);
        return;
      }

      if (response?.data) {
        setColumns(response.data.columns || []);
        setRows(response.data.rows || []);
        setEbayItemIds(response.data.ebayItemIds || []);
        setLoading(false);
      } else {
        setError('No data found');
        setLoading(false);
      }
    });
  }, []);

  // Function to simulate searching on eBay with a comma-separated list of item IDs
  const searchEbayItems = (itemIds) => {
    // Check if there are multiple item IDs
    const itemIdsString = itemIds.length > 1 ? itemIds.join(',') : itemIds[0];
    // Construct the eBay search URL
    const searchUrl = `https://www.ebay.com/sh/lst/active?keyword=${itemIdsString}&source=filterbar&action=search`;
    // Open the search URL in a new tab
    chrome.tabs.create({ url: searchUrl });
  };

  // Function to trigger the eBay search with or without multiple item IDs
  const handleSearch = () => {
    if (ebayItemIds.length > 0) {
      searchEbayItems(ebayItemIds); // Pass all item IDs at once
    }
  };

  const handleClick = () => {
    // Trigger the eBay search
    handleSearch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] w-[400px] bg-gray-100">
        <div className="text-blue-500 text-lg font-semibold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] w-[400px] bg-gray-100">
        <div className="text-red-500 text-lg font-semibold">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-[400px] h-[400px] p-4 bg-gray-100 font-sans overflow-y-auto">
      <button
        onClick={handleClick}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded mb-4"
      >
        Start eBay Search
      </button>
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800">Google Sheets Data</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-blue-500 text-white">
            <tr>
              {columns.map((header, idx) => (
                <th
                  key={idx}
                  className="py-2 px-3 text-left text-xs font-semibold uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-100">
                {row.map((cell, cidx) => (
                  <td key={cidx} className="py-2 px-3 text-sm text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;

