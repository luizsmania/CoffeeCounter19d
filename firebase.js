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
  let today = new Date();
  let formattedToday = today.toLocaleDateString('en-GB'); // Gera "DD/MM/YYYY"

  let allData = {};

  // Verifica se há dados do dia atual no localStorage
  const coffeeListString = localStorage.getItem(`coffeeList_${formattedToday}`);

  if (!coffeeListString) {
      console.log(`Nenhuma lista de café encontrada para hoje (${formattedToday}).`);
      return;
  }

  const coffeeList = JSON.parse(coffeeListString);
  console.log(`Coffee List for today (${formattedToday}):`, coffeeList);

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

  allData[formattedToday] = { coffeeCount, milkCount, syrupCount, extraCount };

  // Atualiza Firestore sem apagar os dados antigos
  const coffeeLogsRef = doc(db, "coffee_logs", "dub19downstairs_coffee_logs");

  getDoc(coffeeLogsRef)
      .then((docSnap) => {
          if (docSnap.exists()) {
              let previousData = docSnap.data().logs || {};
              let updatedData = { ...previousData, ...allData }; // Mantém dados antigos e adiciona os novos

              return setDoc(coffeeLogsRef, { logs: updatedData });
          } else {
              return setDoc(coffeeLogsRef, { logs: allData }); // Cria novo documento caso não exista
          }
      })
      .then(() => console.log("Dados de hoje enviados para o Firestore"))
      .catch((error) => console.error("Erro ao enviar para o Firestore:", error));
}



function scheduleExportData() {
  const now = new Date();
  const startHour = 7;
  const endHour = 17;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let nextRunTime;

  if (currentHour < startHour || (currentHour === startHour && currentMinute < 15)) {
      // If before start time or before 7:15, schedule for 7:15
      nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 15, 0, 0);
  } else if (currentHour >= endHour && currentMinute >= 15) {
      // If after last scheduled time (17:15), schedule for next day's 7:15
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      nextRunTime = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), startHour, 15, 0, 0);
  } else {
      // Schedule for the next hour's 15th minute
      nextRunTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour + 1, 15, 0, 0);
  }

  const delay = nextRunTime - now;

  setTimeout(() => {
      exportData();
      scheduleExportData(); // Re-run function for next scheduled time
  }, delay);

  console.log("Next exportData scheduled for:", nextRunTime);
}


// Start the scheduling
scheduleExportData();

document.getElementById("exportFirestore").addEventListener("click", exportData);