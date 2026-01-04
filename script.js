const input = document.getElementById("urlInput");
const suggestions = document.getElementById("suggestions");
const list = document.getElementById("list");

const addBtn = document.getElementById("goButton");
const startBtn = document.getElementById("startRoute");
const clearBtn = document.getElementById("clearAll");
const shareBtn = document.getElementById("shareRoute");
const printBtn = document.getElementById("printRoute");

const homeBtn = document.getElementById("homeBtn");
const mapBtn = document.getElementById("mapBtn");
const adreseDiv = document.getElementById("adrese");
const mapDiv = document.getElementById("map");

let locations = [];
let markers = [];
let routeLayer = null;

/* ================= MAP ================= */
const map = L.map("map").setView([44.82, 20.46], 7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

/* ================= FULLSCREEN ================= */
mapBtn.onclick = () => {
    adreseDiv.style.display = "none";
    mapDiv.classList.add("fullscreen");
    setTimeout(() => map.invalidateSize(), 200);
};
homeBtn.onclick = () => {
    adreseDiv.style.display = "flex";
    mapDiv.classList.remove("fullscreen");
    setTimeout(() => map.invalidateSize(), 200);
};

/* ================= USER LOCATION ================= */
navigator.geolocation?.getCurrentPosition(p => {
    L.circleMarker([p.coords.latitude, p.coords.longitude], {
        radius: 6,
        color: "lime"
    }).addTo(map).bindPopup("Vaša lokacija");
});

/* ================= LOAD FROM LINK (FIXED) ================= */
const params = new URLSearchParams(window.location.search);

if (params.has("route")) {
    try {
        const decoded = decodeURIComponent(params.get("route"));
        const json = atob(decoded);
        locations = JSON.parse(json);
        autosave();
        renderAll();
    } catch (e) {
        console.error("Neuspešno učitavanje rute iz linka", e);
    }
}

/* ================= AUTOSAVE ================= */
const saved = JSON.parse(localStorage.getItem("route_autosave"));
const savedTime = localStorage.getItem("route_time");

if (!locations.length && saved && Date.now() - savedTime < 1800000) {
    locations = saved;
    renderAll();
}

/* ================= SUGGESTIONS ================= */
let lastReq = 0;
input.addEventListener("input", async () => {
    const q = input.value.trim();
    if (q.length < 3) return;
    if (Date.now() - lastReq < 700) return;
    lastReq = Date.now();

    const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=rs&limit=5`
    );
    const d = await r.json();

    suggestions.innerHTML = "";
    d.forEach(p => {
        const li = document.createElement("li");
        li.textContent = p.display_name;
        li.onclick = () => {
            input.value = p.display_name;
            input.dataset.lat = p.lat;
            input.dataset.lng = p.lon;
            suggestions.innerHTML = "";
        };
        suggestions.appendChild(li);
    });
});

/* ================= ADD ================= */
addBtn.onclick = () => {
    if (!input.dataset.lat) return;

    locations.push({
        name: input.value,
        lat: +input.dataset.lat,
        lng: +input.dataset.lng
    });

    input.value = "";
    input.dataset.lat = "";
    input.dataset.lng = "";

    autosave();
    renderAll();
};

/* ================= RENDER ================= */
function renderAll() {
    list.innerHTML = "";
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    clearRoute();

    locations.forEach((l, i) => {
        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${l.name}`;
        list.appendChild(li);

        const marker = L.marker([l.lat, l.lng], {
            icon: L.divIcon({
                className: "numbered-marker",
                html: `<div>${i + 1}</div>`,
                iconSize: [30, 30]
            })
        }).addTo(map);

        markers.push(marker);
    });

    enableMobileDrag();
}

/* ================= MOBILE + DESKTOP DRAG ================= */
function enableMobileDrag() {
    let dragged;

    [...list.children].forEach(li => {
        li.draggable = true;

        li.ondragstart = () => dragged = li;
        li.ondragover = e => e.preventDefault();
        li.ondrop = () => {
            if (dragged !== li) {
                list.insertBefore(dragged, li);
                syncOrder();
            }
        };

        li.ontouchstart = () => dragged = li;
        li.ontouchmove = e => {
            const t = e.touches[0];
            const el = document.elementFromPoint(t.clientX, t.clientY);
            if (el && el.tagName === "LI" && el !== dragged) {
                list.insertBefore(dragged, el);
            }
        };
        li.ontouchend = syncOrder;
    });
}

function syncOrder() {
    const newOrder = [];
    [...list.children].forEach(li => {
        const name = li.textContent.replace(/^\d+\.\s/, "");
        const found = locations.find(l => l.name === name);
        if (found) newOrder.push(found);
    });
    locations = newOrder;
    autosave();
    renderAll();
}

/* ================= ROUTE ================= */
async function drawRoute() {
    if (locations.length < 2) return;

    clearRoute();

    const coords = locations.map(l => `${l.lng},${l.lat}`).join(";");
    const r = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const d = await r.json();
    if (!d.routes?.length) return;

    routeLayer = L.geoJSON(d.routes[0].geometry, {
        style: { color: "#00ffcc", weight: 5 }
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds());
}

startBtn.onclick = drawRoute;

/* ================= SHARE (FIXED) ================= */
shareBtn.onclick = () => {
    if (!locations.length) return;

    const json = JSON.stringify(locations);
    const encoded = encodeURIComponent(btoa(json));
    const link = `${location.origin}${location.pathname}?route=${encoded}`;

    navigator.clipboard.writeText(link);
    alert("Link kopiran! Otvori ga u novom tabu.");
};

/* ================= PRINT ================= */
printBtn.onclick = () => window.print();

/* ================= CLEAR ================= */
clearBtn.onclick = () => {
    locations = [];
    autosave();
    renderAll();
};

/* ================= HELPERS ================= */
function clearRoute() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
}

function autosave() {
    localStorage.setItem("route_autosave", JSON.stringify(locations));
    localStorage.setItem("route_time", Date.now());
}
