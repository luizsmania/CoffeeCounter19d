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


function scheduleExportData() {
  const now = new Date();
  const startHour = 7;
  const endHour = 17;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let nextRunTime;

  if (currentHour < startHour) {
      nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0, 0);
  } else if (currentHour >= endHour) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      nextRunTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), startHour, 0, 0, 0);
  } else {
      const minutesSinceStart = (currentHour - startHour) * 60 + currentMinute;
      const nextRunMinutes = Math.ceil(minutesSinceStart / 30) * 30;
      const nextRunHour = startHour + Math.floor(nextRunMinutes / 60);
      const nextRunMinute = nextRunMinutes % 60;
      nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextRunHour, nextRunMinute, 0, 0);
      if(nextRunTime.getHours() >= endHour){
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          nextRunTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), startHour, 0, 0, 0);
      }
  }

  const delay = nextRunTime - now;

  setTimeout(() => {
      exportData();
      scheduleExportData();
  }, delay);

  console.log("Next exportData scheduled for:", nextRunTime);
}

// Start the scheduling
scheduleExportData();