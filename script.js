"use strict";

const BASE_URL = "https://fakestoreapi.com";

const els = {
  tbody: document.getElementById("productsTbody"),
  loadingRow: document.getElementById("loadingRow"),
  countText: document.getElementById("countText"),
  errorText: document.getElementById("errorText"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  refreshBtn: document.getElementById("refreshBtn"),

  // modal fields
  modalEl: document.getElementById("productModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalTitleText: document.getElementById("modalTitleText"),
  modalImage: document.getElementById("modalImage"),
  modalPrice: document.getElementById("modalPrice"),
  modalCategory: document.getElementById("modalCategory"),
  modalRating: document.getElementById("modalRating"),
  modalDescription: document.getElementById("modalDescription"),
};

let modal; // bootstrap modal instance
let allProducts = [];
let categories = [];

function money(price) {
  return `$${Number(price).toFixed(2)}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setLoading(v) {
  els.loadingRow.hidden = !v;
}

function setError(msg) {
  els.errorText.textContent = msg || "";
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

async function loadData() {
  setError("");
  setLoading(true);
  els.tbody.innerHTML = "";
  els.countText.textContent = "Loading…";

  try {
    const [productsData, categoriesData] = await Promise.all([
      fetchJson(`${BASE_URL}/products`),
      fetchJson(`${BASE_URL}/products/categories`),
    ]);

    allProducts = Array.isArray(productsData) ? productsData : [];
    categories = Array.isArray(categoriesData) ? categoriesData : [];

    populateCategories(categories);
    renderTable(getFilteredProducts());
  } catch (e) {
    console.error(e);
    setError("Failed to load products. Check your internet / API.");
    els.countText.textContent = "0 items";
  } finally {
    setLoading(false);
  }
}

function populateCategories(cats) {
  const current = els.categorySelect.value || "all";
  els.categorySelect.innerHTML = `<option value="all">All</option>`;
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.categorySelect.appendChild(opt);
  }
  const exists = [...els.categorySelect.options].some(o => o.value === current);
  els.categorySelect.value = exists ? current : "all";
}

function getFilteredProducts() {
  const q = (els.searchInput.value || "").trim().toLowerCase();
  const cat = els.categorySelect.value;

  return allProducts.filter(p => {
    const matchesCat = (cat === "all") ? true : p.category === cat;
    const matchesQ =
      !q ||
      String(p.title).toLowerCase().includes(q) ||
      String(p.category).toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });
}

function renderTable(products) {
  els.tbody.innerHTML = "";

  for (const p of products) {
    const tr = document.createElement("tr");
    tr.classList.add("clickable-row");
    tr.innerHTML = `
      <td>${escapeHtml(p.id)}</td>
      <td title="Click to view details">${escapeHtml(p.title)}</td>
      <td>${money(p.price)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td class="text-center">
        <img class="thumb" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy">
      </td>
    `;

    tr.addEventListener("click", () => openModal(p));
    els.tbody.appendChild(tr);
  }

  els.countText.textContent = `${products.length} item${products.length === 1 ? "" : "s"}`;
}

function openModal(p) {
  const rate = p?.rating?.rate ?? "N/A";
  const count = p?.rating?.count ?? "N/A";

  els.modalTitle.textContent = `Product #${p.id}`;
  els.modalTitleText.textContent = p.title;

  els.modalImage.src = p.image;
  els.modalImage.alt = p.title;

  els.modalPrice.textContent = money(p.price);
  els.modalCategory.textContent = p.category;
  els.modalRating.textContent = `${rate} / 5 (${count} reviews)`;
  els.modalDescription.textContent = p.description;

  modal.show();
}

// Events
els.searchInput.addEventListener("input", () => renderTable(getFilteredProducts()));
els.categorySelect.addEventListener("change", () => renderTable(getFilteredProducts()));
els.refreshBtn.addEventListener("click", loadData);

// Init
document.addEventListener("DOMContentLoaded", () => {
  modal = new bootstrap.Modal(els.modalEl, { backdrop: true, keyboard: true });
  loadData();
});
