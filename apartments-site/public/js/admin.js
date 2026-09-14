const loginPanel = document.getElementById("loginPanel");
const adminContent = document.getElementById("adminContent");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const listingForm = document.getElementById("listingForm");
const formMsg = document.getElementById("formMsg");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const listingIdInput = document.getElementById("listingId");
const existingThumbs = document.getElementById("existingThumbs");
const adminListings = document.getElementById("adminListings");

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function checkSession() {
  const res = await fetch("/api/auth/session");
  const { isAdmin } = await res.json();
  loginPanel.hidden = isAdmin;
  adminContent.hidden = !isAdmin;
  if (isAdmin) loadAdminListings();
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "";
  const password = document.getElementById("password").value;
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    loginMsg.textContent = "Incorrect password.";
    return;
  }
  loginForm.reset();
  checkSession();
});

function resetForm() {
  listingForm.reset();
  listingIdInput.value = "";
  existingThumbs.innerHTML = "";
  formTitle.textContent = "Add a new listing";
  submitBtn.textContent = "Add listing";
  cancelEditBtn.hidden = true;
}

cancelEditBtn.addEventListener("click", resetForm);

function fillFormForEdit(listing) {
  listingIdInput.value = listing.id;
  document.getElementById("title").value = listing.title || "";
  document.getElementById("address").value = listing.address || "";
  document.getElementById("city").value = listing.city || "";
  document.getElementById("state").value = listing.state || "";
  document.getElementById("zip").value = listing.zip || "";
  document.getElementById("price").value = listing.price || "";
  document.getElementById("bedrooms").value = listing.bedrooms || "";
  document.getElementById("bathrooms").value = listing.bathrooms || "";
  document.getElementById("sqft").value = listing.sqft || "";
  document.getElementById("description").value = listing.description || "";
  document.getElementById("amenities").value = (listing.amenities || []).join(", ");
  document.getElementById("contactName").value = listing.contactName || "";
  document.getElementById("contactPhone").value = listing.contactPhone || "";
  document.getElementById("contactEmail").value = listing.contactEmail || "";
  document.getElementById("available").value = String(listing.available);

  existingThumbs.innerHTML = listing.images
    .map(
      (f) => `
      <div class="thumb-wrap">
        <img src="uploads/${f}" alt="" />
        <button type="button" data-filename="${f}" aria-label="Remove this photo">×</button>
      </div>`
    )
    .join("");

  formTitle.textContent = `Editing: ${listing.title || listing.address}`;
  submitBtn.textContent = "Save changes";
  cancelEditBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

existingThumbs.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-filename]");
  if (!btn) return;
  const id = listingIdInput.value;
  if (!id) return;
  const res = await fetch(`/api/listings/${id}/images/${encodeURIComponent(btn.dataset.filename)}`, {
    method: "DELETE",
  });
  if (res.ok) {
    const listing = await res.json();
    fillFormForEdit(listing);
    loadAdminListings();
  }
});

listingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.className = "msg";
  formMsg.textContent = "Saving…";

  const id = listingIdInput.value;
  const formData = new FormData(listingForm);
  formData.delete("images");
  const imageFiles = document.getElementById("images").files;
  for (const file of imageFiles) formData.append("images", file);

  const res = await fetch(id ? `/api/listings/${id}` : "/api/listings", {
    method: id ? "PUT" : "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    formMsg.className = "msg error";
    formMsg.textContent = body.error || "Something went wrong.";
    return;
  }

  formMsg.className = "msg success";
  formMsg.textContent = id ? "Listing updated." : "Listing added.";
  resetForm();
  loadAdminListings();
});

async function loadAdminListings() {
  const res = await fetch("/api/listings");
  const listings = await res.json();

  if (!listings.length) {
    adminListings.innerHTML = `<p style="color:var(--muted)">No listings yet — add your first one above.</p>`;
    return;
  }

  adminListings.innerHTML = listings
    .map(
      (l) => `
      <div class="admin-listing-row" data-id="${l.id}">
        <img src="${l.images[0] ? "uploads/" + l.images[0] : ""}" alt="" />
        <div class="info">
          <div class="title">${escapeHtml(l.title || l.address)}</div>
          <div class="meta">$${Number(l.price).toLocaleString()}/mo · ${l.bedrooms}bd/${l.bathrooms}ba · ${escapeHtml(l.city)}</div>
        </div>
        <div class="row-actions">
          <button class="btn btn-secondary" data-action="edit" aria-label="Edit ${escapeHtml(l.title || l.address)}">Edit</button>
          <button class="btn btn-danger" data-action="delete" aria-label="Delete ${escapeHtml(l.title || l.address)}">Delete</button>
        </div>
      </div>`
    )
    .join("");
}

adminListings.addEventListener("click", async (e) => {
  const row = e.target.closest(".admin-listing-row");
  if (!row) return;
  const id = row.dataset.id;
  const action = e.target.dataset.action;

  if (action === "edit") {
    const res = await fetch(`/api/listings/${id}`);
    if (res.ok) fillFormForEdit(await res.json());
  }

  if (action === "delete") {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) loadAdminListings();
  }
});

checkSession();
