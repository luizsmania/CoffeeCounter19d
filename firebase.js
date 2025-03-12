import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBw9JQhm3bjSn8uu2q0OQfYMH5T_jJiT0A",
  authDomain: "dub21-c4bd6.firebaseapp.com",
  databaseURL: "https://dub21-c4bd6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dub21-c4bd6",
  storageBucket: "dub21-c4bd6.appspot.com",
  messagingSenderId: "515778318217",
  appId: "1:515778318217:web:937a7293be912f5628db58",
  measurementId: "G-LPHPQNG58F"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);  // Obtenha a referência do Firestore
const analytics = getAnalytics(app);

export function exportData() {
    let allData = {};

    // Get all available dates from localStorage
    const allDates = Object.keys(localStorage)
      .filter(key => key.startsWith('coffeeList_'))
      .map(key => key.replace('coffeeList_', ''));

    console.log("Available dates in localStorage:", allDates);

    if (allDates.length === 0) {
      console.log("No coffee lists found in localStorage.");
      return;
    }

    allDates.forEach(date => {
      const coffeeListString = localStorage.getItem(`coffeeList_${date}`);

      if (coffeeListString) {
        const coffeeList = JSON.parse(coffeeListString);
        console.log(`Coffee List for ${date}:`, coffeeList);

        let coffeeCount = {};
        let milkCount = {};
        let syrupCount = {};
        let extraCount = {};

        coffeeList.forEach(function (row) {
          if (row.coffee !== 'No Coffee Selected') {
            coffeeCount[row.coffee] = (coffeeCount[row.coffee] || 0) + 1;
          }
          if (row.milk !== 'Regular Milk') {
            milkCount[row.milk] = (milkCount[row.milk] || 0) + 1;
          }
          if (row.syrup !== 'No Syrup') {
            syrupCount[row.syrup] = (syrupCount[row.syrup] || 0) + 1;
          }
          if (row.extra !== 'No Extra') {
            extraCount[row.extra] = (extraCount[row.extra] || 0) + 1;
          }
        });

        // Add the data for each date to the allData object
        allData[date] = { coffeeCount, milkCount, syrupCount, extraCount };

      } else {
        console.log(`No valid coffee list found for date: ${date}`);
      }
    });

    // Update Firestore with all logs in a single document
    if (Object.keys(allData).length > 0) {
      const coffeeLogsRef = doc(db, "coffee_logs", "dub19downstairs_coffee_logs"); // Single document named 'coffee_logs'
      setDoc(coffeeLogsRef, { logs: allData })
        .then(() => console.log("All data uploaded to Firestore"))
        .catch((error) => console.error("Error uploading to Firestore:", error));
    }

    // Convert the allData object to a JSON string
    const jsonData = JSON.stringify(allData, null, 2);

    // Create a link to download the JSON file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.click();

    console.log('Exported data:', jsonData);
}

document.getElementById('added').addEventListener('click', exportData);