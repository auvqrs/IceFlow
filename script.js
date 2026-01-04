const input = document.getElementById("urlInput");
const suggestions = document.getElementById("suggestions");
const addBtn = document.getElementById("goButton");
const startBtn = document.getElementById("startRoute");
const list = document.querySelector("ol");

let locations = [];
let routeLayer;

const map = L.map("map").setView([44.82, 20.46], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
}).addTo(map);


let lastRequest = 0;

input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 3) {
        suggestions.innerHTML = "";
        return;
    }

    if (Date.now() - lastRequest < 1000) return;
    lastRequest = Date.now();

    const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=rs&limit=5`
    );
    const data = await res.json();

    suggestions.innerHTML = "";

    data.forEach(place => {
        const li = document.createElement("li");
        li.textContent = place.display_name;
        li.onclick = () => {
            input.value = place.display_name;
            input.dataset.lat = place.lat;
            input.dataset.lng = place.lon;
            suggestions.innerHTML = "";
        };
        suggestions.appendChild(li);
    });
});

/* ---------- ADD ADDRESS ---------- */

addBtn.onclick = () => {
    if (!input.dataset.lat) return;

    locations.push({
        name: input.value,
        lat: Number(input.dataset.lat),
        lng: Number(input.dataset.lng)
    });

    addListItem(input.value);

    input.value = "";
    input.dataset.lat = "";
    input.dataset.lng = "";
};

function addListItem(text) {
    const li = document.createElement("li");
    li.draggable = true;

    li.innerHTML = `
        <span>${text}</span>
        <div>
            <button>Edit</button>
            <button>Del</button>
        </div>
    `;

    li.querySelector("button:nth-child(1)").onclick = () => {
        const nv = prompt("Edit address", text);
        if (nv) li.querySelector("span").textContent = nv;
    };

    li.querySelector("button:nth-child(2)").onclick = () => {
        const i = [...list.children].indexOf(li);
        locations.splice(i, 1);
        li.remove();
    };

    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    list.appendChild(li);
}

list.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    const after = [...list.children].find(li => {
        const box = li.getBoundingClientRect();
        return e.clientY < box.top + box.height / 2;
    });
    after ? list.insertBefore(dragging, after) : list.appendChild(dragging);
});


startBtn.onclick = async () => {
    if (locations.length < 2) return;

    if (routeLayer) map.removeLayer(routeLayer);

    const coords = locations
        .map(l => `${l.lng},${l.lat}`)
        .join(";");

    const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );

    const data = await res.json();

    routeLayer = L.geoJSON(data.routes[0].geometry).addTo(map);
    map.fitBounds(routeLayer.getBounds());
};
