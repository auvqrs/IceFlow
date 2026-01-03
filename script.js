let map;
let markers = [];

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 44.8176, lng: 20.4569 }, // example: Belgrade
        zoom: 12,
    });
}

// DOM elements
const adreseDiv = document.getElementById('adrese');
const dodajBtn = document.getElementById('dodajAdresu');
const resetBtn = document.getElementById('resetBtn');

// Function to add address to the list
function addAddress(addressText) {
    const p = document.createElement('p');
    p.textContent = addressText;
    adreseDiv.appendChild(p);
}

// Add Address button: choose manual or map
dodajBtn.addEventListener('click', () => {
    const choice = confirm('Kliknite "OK" da odaberete lokaciju sa mape, ili "Cancel" da unesete adresu ručno.');

    if (choice) {
        alert('Sada kliknite na mapu da izaberete lokaciju.');
        
        // Map click handler
        const mapClickHandler = (event) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();

            // Add marker
            const marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
            });
            markers.push(marker);

            // Add location to addresses
            addAddress(`Mapa lokacija: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}`);

            // Remove this listener after one click
            google.maps.event.removeListener(mapClickHandlerObj);
        };

        // Google Maps addListener returns an object we can remove
        const mapClickHandlerObj = map.addListener('click', mapClickHandler);

    } else {
        const address = prompt('Unesite adresu:'); 
        if (address) addAddress(address);
    }
});

// Reset all addresses and markers
resetBtn.addEventListener('click', () => {
    adreseDiv.innerHTML = '';
    markers.forEach(marker => marker.setMap(null));
    markers = [];
});
