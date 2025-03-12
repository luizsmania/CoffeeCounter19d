// Global variables for selected coffee details
let selectedCoffee = '';
let selectedMilk = '';
let selectedSyrup = '';
let selectedExtra = '';
let coffeeList = [];
let selectedDate = getFormattedDate(new Date()); // Initialize selectedDate to today’s date


// Load the saved coffee list for the current day when the page is loaded
window.onload = function() {
    // Load the saved coffee list for the current day
    loadCoffeeList(selectedDate);
    updateDateDropdown();
    updateCoffeeList();

    // Check for the reset success flag
    if (localStorage.getItem('resetSuccess') === 'true') {
        alert("All coffee lists have been reset successfully.");
        // Remove the flag so it doesn't show again
        localStorage.removeItem('resetSuccess');
    }
};
document.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
      event.preventDefault();
    }
  });
// Function to get date in DD/MM/YYYY format
function getFormattedDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Load the coffee list for a specific date from local storage
function loadCoffeeList(date) {
    const savedCoffeeList = localStorage.getItem(`coffeeList_${date}`);
    coffeeList = savedCoffeeList ? JSON.parse(savedCoffeeList) : [];
}

// Save the coffee list for the current selected date
function saveCoffeeList() {
    localStorage.setItem(`coffeeList_${selectedDate}`, JSON.stringify(coffeeList));
}  

// Change the date based on dropdown selection
function changeDate(event) {
    selectedDate = event.target.value;
    loadCoffeeList(selectedDate);
    updateCoffeeList();
    checkDate(selectedDate);
  }

function checkDate(date) {
const today = getFormattedDate(new Date());
const messageElement = document.getElementById('oldListMessage');

// Show or hide message based on date matching
messageElement.style.display = (date === today) ? 'none' : 'block';
}

// Add a new coffee entry to the list
function addCoffee() {
    const coffeeDetails = {
        coffee: selectedCoffee || 'No Coffee Selected',
        milk: selectedMilk || 'Regular Milk',
        syrup: selectedSyrup || 'No Syrup',
        extra: selectedExtra || 'No Extra',
        time: new Date().toLocaleTimeString(),
        backgroundColor: 'rgba(255, 202, 111, 0.26)'
    };

    coffeeList.push(coffeeDetails); // Add new coffee to list
    updateCoffeeList();
    saveCoffeeList();
    resetSelections();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset coffee selection choices
function resetSelections() {
    selectedCoffee = '';
    selectedMilk = '';
    selectedSyrup = '';
    selectedExtra = '';
    document.querySelectorAll('.button').forEach(btn => btn.classList.remove('selected'));
}

// Global flag to track if we just deleted a coffee
let isDeleted = false;

// Update and display the coffee list for the selected date
function updateCoffeeList() {
    const coffeeListElement = document.getElementById('coffeeList');
    const coffeeCountElement = document.getElementById('coffeeCount');
    coffeeListElement.innerHTML = ''; // Clear current list

    // Display count and date for selected coffees
    coffeeCountElement.textContent = `Coffees on ${selectedDate} - Total: ${coffeeList.length}`;

    const recentCoffees = coffeeList.slice(-999).reverse(); // Get the most recent coffees

    // Iterate over all coffees and append them to the list
    recentCoffees.forEach((coffee, index) => {
        let listItemText = `${coffee.coffee}`;
        if (coffee.milk && coffee.milk !== 'Regular Milk') listItemText += ` with ${coffee.milk}`;
        if (coffee.syrup && coffee.syrup !== 'No Syrup') listItemText += ` and ${coffee.syrup}`;
        if (coffee.extra && coffee.extra !== 'No Extra') listItemText += ` and ${coffee.extra}`;

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${listItemText}
            <span style="font-size: 0.7em; margin-left: 7px; display: block; margin-top: 1px;" class="toggle-color">
                at ${coffee.time}
            </span>
            <button onclick="removeCoffee(${coffeeList.length - 1 - index})" style="font-family: Serif; font-size: 0.65em; margin-bottom: 5px; margin-left: 7px; padding: 4px 8px; background-color: rgba(255, 0, 0, 0.5); color: black; border: 0px solid; border-radius: 3px; cursor: pointer;">Delete</button>
        `;

        // Set initial background color
        listItem.style.backgroundColor = coffee.backgroundColor;

        // Add transition for slide-in and fade-in effects
        listItem.style.transition = 'transform 0.5s ease-out, opacity 0.9s ease-out, background-color 0.6s ease'; // Add background-color transition
        listItem.style.opacity = 0;  // Initially hide the item
        listItem.style.transform = 'translateX(-100%)';  // Start off to the left

        // Toggle item color on click with smooth transition
        listItem.addEventListener('click', () => {
            // Toggle between green and original background color
            coffee.backgroundColor = coffee.backgroundColor === 'rgba(0, 128, 0, 0.3)' ? 'rgba(255, 202, 111, 0.26)' : 'rgba(0, 128, 0, 0.3)';
            listItem.style.backgroundColor = coffee.backgroundColor;  // Apply the color change
        });

        // Append the item to the list
        coffeeListElement.appendChild(listItem);

        // Apply animation only to the most recent (last) item when added
        if (!isDeleted && index === 0) {  // Apply animation only if we didn't just delete
            setTimeout(() => {
                listItem.style.opacity = 1;  // Fade in the item
                listItem.style.transform = 'translateX(0)';  // Slide into place
            }, 10); // Small delay to ensure the transition applies after the item is appended
        } else {
            // For other items (not the last one), make them visible immediately without animation
            listItem.style.opacity = 1;
            listItem.style.transform = 'translateX(0)';
        }
    });

    // After rendering the list, reset the delete flag
    isDeleted = false;
}

// Remove a coffee from the list
function removeCoffee(index) {
    const confirmDelete = confirm("Are you sure you want to delete this coffee?");
    if (confirmDelete) {
        // Set the delete flag so we don't apply animation after deletion
        isDeleted = true;
        
        // Remove the coffee from the list
        coffeeList.splice(index, 1);

        // Update the list (without animation on the new last item)
        updateCoffeeList();

        // Save the updated list
        saveCoffeeList();
    }
}



function updateDateDropdown() {
    const dropdown = document.getElementById('dateDropdown');
    const currentDate = getFormattedDate(new Date());

    // Get all available dates from localStorage
    const dates = Object.keys(localStorage)
        .filter(key => key.startsWith('coffeeList_'))
        .map(key => key.replace('coffeeList_', ''));

    // Sort dates in descending order
    dates.sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/').map(Number);
        const [dayB, monthB, yearB] = b.split('/').map(Number);

        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);

        return dateB - dateA; // Descending order
    });

    // Clear the dropdown
    dropdown.innerHTML = '';

    // Add sorted dates to the dropdown
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.text = date;
        dropdown.appendChild(option);
    });

    // Always include the current date in the dropdown if no coffee entries exist
    if (coffeeList.length === 0) {
        const todayOption = document.createElement('option');
        todayOption.value = currentDate;
        todayOption.text = currentDate;
        dropdown.appendChild(todayOption);
        dropdown.value = currentDate; // Set the current date as selected
    } else if (dates.includes(currentDate)) {
        dropdown.value = currentDate; // Select the current date if it exists
    }
}
function checkOutdatedList() {
    const outdatedMessage = document.getElementById('outdatedMessage');
    const coffeeCountElement = document.getElementById('coffeeCount');

    if (!outdatedMessage || !coffeeCountElement) {
        console.error("Elements not found!");
        return; // Exit if elements are not found
    }

    const currentDate = getFormattedDate(new Date());
    const displayedDateMatch = coffeeCountElement.textContent.match(/\d{2}\/\d{2}\/\d{4}/);

    if (displayedDateMatch) {
        const displayedDate = displayedDateMatch[0];
        console.log(`Displayed Date: ${displayedDate}, Current Date: ${currentDate}`); // Debugging
        if (displayedDate !== currentDate) {
            outdatedMessage.style.display = 'block';
        } else {
            outdatedMessage.style.display = 'none';
        }
    }
}

function resetDailyList() {
    const today = getFormattedDate(new Date());
    if (selectedDate !== today) {
        selectedDate = today;
        loadCoffeeList(selectedDate);
        updateCoffeeList();
        updateDateDropdown();

        // Manually trigger checkOutdatedList to update the outdated message
        checkOutdatedList();
        location.reload()
    } else {
        // If the selectedDate is the same, ensure the outdated check runs too
        checkOutdatedList();
    }
    
}

function confirmResetDay() {
    const confirmReset = confirm(
        "Are you sure you want to reset all data?\n\n" +
        "Please note that resetting all data is unnecessary. Your coffee lists are now saved automatically and can be easily retrieved by changing the dropdown menu. You no longer need to reset them daily!\n\n" +
        "Você tem certeza de que deseja deletar todos os dados?\n\n" +
        "Observe que deleter todos os dados diariamente é desnecessário. Suas listas de café agora são salvas automaticamente e podem ser facilmente recuperadas alterando o menu no canto superior direito em cima do botao enter. Você não precisa mais redefini-las diariamente!"
    );


    if (confirmReset) {
        // Clear all coffee lists from local storage
        Object.keys(localStorage)
            .filter(key => key.startsWith('coffeeList_'))
            .forEach(key => localStorage.removeItem(key));
        
        // Clear the coffee list array and update the display
        coffeeList = [];
        updateCoffeeList();

        // Reset all dropdowns
        resetAllDropdowns();

        // Store a flag in local storage to indicate that a reset occurred
        localStorage.setItem('resetSuccess', 'true');
        
        // Reload the page
        location.reload();
    }
}

// Function to reset all dropdowns and their options
function resetAllDropdowns() {
    const dropdown = document.getElementById('dateDropdown');
    dropdown.innerHTML = ''; // Clear all options

    // If you have additional dropdowns, reset them similarly
    // const milkDropdown = document.getElementById('milkDropdown');
    // milkDropdown.innerHTML = ''; // Uncomment and modify if needed
    // Add other dropdown resets as necessary
}

setInterval(resetDailyList, 3600000); // 3600000 ms = 1 hour
function refreshIfOutdated() {
    const dropdown = document.getElementById('dateDropdown');
    const currentDate = getFormattedDate(new Date());
    const outdatedMessage = document.getElementById('outdatedMessage');

    console.log(`Dropdown value: ${dropdown.value}`);
    console.log(`Current date: ${currentDate}`);
    console.log(`Outdated message display: ${outdatedMessage.style.display}`);

    if (dropdown.value !== currentDate && outdatedMessage.style.display === 'none') {
        console.log('Refreshing the page...');
        location.reload();
    }
}

// Call this function periodically, e.g., every 30 seconds
setInterval(refreshIfOutdated, 360000);


// Select and unselect coffee options
function selectOption(option, category, buttonElement) {
    if (buttonElement.classList.contains('selected')) {
        buttonElement.classList.remove('selected');
        if (category === 'coffee') selectedCoffee = '';
        if (category === 'milk') selectedMilk = '';
        if (category === 'syrup') selectedSyrup = '';
        if (category === 'extra') selectedExtra = '';
    } else {
        document.querySelectorAll(`.button.${category}`).forEach(btn => btn.classList.remove('selected'));
        buttonElement.classList.add('selected');
        if (category === 'coffee') selectedCoffee = option;
        if (category === 'milk') selectedMilk = option;
        if (category === 'syrup') selectedSyrup = option;
        if (category === 'extra') selectedExtra = option;
    }
}
const apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
const city = 'Dublin';
const url = `https://api.openweathermap.org/data/2.5/weather?q=Dublin&appid=604b3b10dc1bd50d0c79ac19718d5c7e&units=metric`;

fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        const weatherDescription = data.weather[0].description;
        const temperature = data.main.temp;
        const currentTime = new Date();

        // Get the day of the week and format date as DD/MM/YYYY
        const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' };
        const today = currentTime.toLocaleDateString('en-GB', options); // e.g., "Wednesday, 16/10/2024"

        const greeting = currentTime.getHours() < 12 ? "Good Morning!" : 
                         currentTime.getHours() < 18 ? "Good Afternoon!" : 
                         "Good Evening!";

        document.getElementById('weather-info').innerHTML = 
            `${today}<br>${greeting}<br>Dublin weather today: ${weatherDescription}, ${temperature}°C.`;
    })
    .catch(error => {
        document.getElementById('weather-info').innerText = "Could not fetch weather data.";
        console.error("Error fetching weather data:", error);
    });

// Reload the page every 2 hours (7200000 milliseconds)
setTimeout(() => {
    location.reload();
}, 7200000); // 2 hours in milliseconds == 7200000

/// Function to export all coffee lists to a JSON file
function exportCoffeeLists() {
    const allCoffeeData = {};

    // Get all coffee lists from localStorage
    Object.keys(localStorage)
        .filter(key => key.startsWith('coffeeList_'))
        .forEach(key => {
            allCoffeeData[key] = JSON.parse(localStorage.getItem(key));
        });

    // Create a JSON file from the data
    const blob = new Blob([JSON.stringify(allCoffeeData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'coffeeLists.json'; // Name of the downloaded file
    link.click();
}

// Function to trigger file input (for uploading JSON data)
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

// Function to handle the uploaded JSON file
function uploadCoffeeLists(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const uploadedData = JSON.parse(e.target.result);

                // Clear existing coffee lists from localStorage
                Object.keys(localStorage)
                    .filter(key => key.startsWith('coffeeList_'))
                    .forEach(key => localStorage.removeItem(key));

                // Store the uploaded data back into localStorage
                Object.keys(uploadedData).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(uploadedData[key]));
                });

                // Reload the coffee list for today
                selectedDate = getFormattedDate(new Date());
                loadCoffeeList(selectedDate);
                updateCoffeeList();

                alert("Coffee lists have been uploaded successfully!");
            } catch (error) {
                alert("Error parsing the uploaded file.");
                console.error("Error parsing the uploaded file:", error);
            }
        };

        reader.readAsText(file);
    }
}

function exportData() {
    let coffeeCount = {};
    let milkCount = {};
    let syrupCount = {};
    let extraCount = {};

    coffeeList.forEach(function(row) {
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

    let csvContent = "data:text/csv;charset=utf-8,Coffee - Count\n";
    for (const coffee in coffeeCount) {
        csvContent += `${coffee}=${coffeeCount[coffee]}\n`;
    }

    csvContent += "\nMilk - Count\n";
    for (const milk in milkCount) {
        csvContent += `${milk}=${milkCount[milk]}\n`;
    }

    csvContent += "\nSyrup - Count\n";
    for (const syrup in syrupCount) {
        csvContent += `${syrup}=${syrupCount[syrup]}\n`;
    }

    csvContent += "\nExtra - Count\n";
    for (const extra in extraCount) {
        csvContent += `${extra}=${extraCount[extra]}\n`;
    }

    // Get the selected date from the dropdown
    const selectedDate = document.getElementById('dateDropdown').value; // Get selected date
    const formattedDate = selectedDate.replace(/-/g, '/'); // Change format to DD/MM/YYYY or keep it as is based on your needs

    // Create the filename with the formatted date
    const filename = `${formattedDate} Coffee Log.csv`;

    // Encode CSV content and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename); // Use the generated filename
    document.body.appendChild(link);
    link.click();
}
