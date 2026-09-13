const grid = document.getElementById("listingGrid");
const resultsMeta = document.getElementById("resultsMeta");
const searchForm = document.getElementById("searchForm");

function currency(n) {
  return `$${Number(n).toLocaleString()}`;
}

function cardHtml(listing) {
  const img = listing.images[0] ? `uploads/${listing.images[0]}` : placeholderSvg();
  const unavailable = listing.available ? "" : `<span class="badge-unavailable">Not available</span>`;
  return `
    <a class="card" href="listing.html?id=${listing.id}">
      <img class="card-image" src="${img}" alt="${escapeHtml(listing.title || listing.address)}" />
      <div class="card-body">
        <div class="card-price">${currency(listing.price)}/mo</div>
        <div class="card-address">${escapeHtml(listing.title || listing.address)}</div>
        <div class="card-city">${escapeHtml(listing.city)}${listing.state ? ", " + escapeHtml(listing.state) : ""}</div>
        <div class="card-specs">${listing.bedrooms} bd · ${listing.bathrooms} ba${listing.sqft ? " · " + listing.sqft + " sqft" : ""}</div>
        ${unavailable}
      </div>
    </a>
  `;
}

function placeholderSvg() {
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#9aa1ab" text-anchor="middle" dy=".3em">No photo yet</text></svg>`
  );
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function loadListings(params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  const res = await fetch(`/api/listings?${qs.toString()}`);
  const listings = await res.json();

  if (!listings.length) {
    grid.innerHTML = "";
    resultsMeta.textContent = "";
    grid.parentElement.querySelector(".empty-state")?.remove();
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No apartments found. Try different search criteria, or check back soon.";
    grid.after(empty);
    return;
  }

  document.querySelector(".empty-state")?.remove();
  resultsMeta.textContent = `${listings.length} apartment${listings.length === 1 ? "" : "s"} found`;
  grid.innerHTML = listings.map(cardHtml).join("");
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loadListings({
    city: document.getElementById("cityInput").value.trim(),
    minPrice: document.getElementById("minPriceInput").value,
    maxPrice: document.getElementById("maxPriceInput").value,
    bedrooms: document.getElementById("bedroomsInput").value,
  });
});

loadListings();
