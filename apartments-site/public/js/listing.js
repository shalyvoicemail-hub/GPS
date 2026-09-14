const wrap = document.getElementById("detailWrap");

function currency(n) {
  return `$${Number(n).toLocaleString()}`;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function placeholderSvg() {
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="#9aa1ab" text-anchor="middle" dy=".3em">No photos yet</text></svg>`
  );
}

function render(listing) {
  const images = listing.images.length ? listing.images.map((f) => `uploads/${f}`) : [placeholderSvg()];

  const altBase = escapeHtml(listing.title || listing.address || "Apartment photo");

  wrap.innerHTML = `
    <img class="gallery-main" id="mainImage" src="${images[0]}" alt="${altBase} — photo 1 of ${images.length}" />
    ${images.length > 1 ? `<div class="gallery-thumbs" id="thumbs" role="group" aria-label="Photos">${images
      .map((src, i) => `<button type="button" class="${i === 0 ? "active" : ""}" data-index="${i}" aria-current="${i === 0 ? "true" : "false"}" aria-label="Show photo ${i + 1} of ${images.length}"><img src="${src}" alt="" /></button>`)
      .join("")}</div>` : ""}

    <div class="detail-header">
      <div>
        <h1>${escapeHtml(listing.title || listing.address)}</h1>
        <div>${escapeHtml(listing.address)}${listing.address ? ", " : ""}${escapeHtml(listing.city)}${listing.state ? ", " + escapeHtml(listing.state) : ""} ${escapeHtml(listing.zip)}</div>
      </div>
      <div class="detail-price">${currency(listing.price)}<span style="font-size:14px;color:var(--muted)">/mo</span></div>
    </div>

    <div class="detail-specs">
      <div><strong>${listing.bedrooms}</strong> bed</div>
      <div><strong>${listing.bathrooms}</strong> bath</div>
      ${listing.sqft ? `<div><strong>${listing.sqft}</strong> sqft</div>` : ""}
      <div><span aria-hidden="true">${listing.available ? "✅" : "❌"}</span> ${listing.available ? "Available" : "Not available"}</div>
    </div>

    ${listing.description ? `<h2 class="section-title">Description</h2><p>${escapeHtml(listing.description)}</p>` : ""}

    ${listing.amenities.length ? `
      <h2 class="section-title">Amenities</h2>
      <ul class="amenities-list">${listing.amenities.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
    ` : ""}

    <div class="contact-card">
      <h2 class="section-title" style="margin-top:0">Contact</h2>
      ${listing.contactName ? `<div>${escapeHtml(listing.contactName)}</div>` : ""}
      ${listing.contactPhone ? `<div><a href="tel:${escapeHtml(listing.contactPhone)}">${escapeHtml(listing.contactPhone)}</a></div>` : ""}
      ${listing.contactEmail ? `<div><a href="mailto:${escapeHtml(listing.contactEmail)}">${escapeHtml(listing.contactEmail)}</a></div>` : ""}
      ${!listing.contactName && !listing.contactPhone && !listing.contactEmail ? `<div style="color:var(--muted)">No contact info provided.</div>` : ""}
    </div>
  `;

  const mainImage = document.getElementById("mainImage");
  document.getElementById("thumbs")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    mainImage.src = images[index];
    mainImage.alt = `${altBase} — photo ${index + 1} of ${images.length}`;
    document.querySelectorAll("#thumbs button").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-current", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-current", "true");
  });
}

async function init() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    wrap.innerHTML = `<p>No listing specified.</p>`;
    return;
  }
  const res = await fetch(`/api/listings/${encodeURIComponent(id)}`);
  if (!res.ok) {
    wrap.innerHTML = `<p>Listing not found.</p>`;
    document.title = "Listing not found – RentFinder";
    return;
  }
  const listing = await res.json();
  document.title = `${listing.title || listing.address || "Apartment"} – RentFinder`;
  render(listing);
}

init();
