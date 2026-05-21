const STORAGE_KEY = 'boodschappen-app-v1';
const DEFAULT_CATEGORIES = ['Groente', 'Fruit', 'Zuivel', 'Voorraadkast'];

const elements = {
  form: document.querySelector('#product-form'),
  name: document.querySelector('#product-name'),
  categorySelect: document.querySelector('#category-select'),
  categoryInput: document.querySelector('#category-input'),
  stock: document.querySelector('#stock-input'),
  minStock: document.querySelector('#min-stock-input'),
  shoppingSummary: document.querySelector('#shopping-summary'),
  inventorySummary: document.querySelector('#inventory-summary'),
  shoppingList: document.querySelector('#shopping-list'),
  productList: document.querySelector('#product-list')
};

const state = loadState();

elements.form.addEventListener('submit', handleSubmit);
elements.productList.addEventListener('input', handleProductInput);
elements.productList.addEventListener('change', handleProductInput);
elements.productList.addEventListener('click', handleProductDelete);

render();

function loadState() {
  const fallback = { categories: [...DEFAULT_CATEGORIES], products: [] };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.products) || !Array.isArray(saved.categories)) {
      return fallback;
    }

    return {
      categories: uniqueCategories(saved.categories),
      products: saved.products.map(normalizeProduct).filter(Boolean)
    };
  } catch {
    return fallback;
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const name = elements.name.value.trim();
  const selectedCategory = elements.categorySelect.value;
  const newCategory = elements.categoryInput.value.trim();
  const stock = toNumber(elements.stock.value);
  const minStock = toNumber(elements.minStock.value);
  const category = newCategory || selectedCategory;

  if (!name || !category) {
    return;
  }

  if (newCategory) {
    state.categories = uniqueCategories([...state.categories, newCategory]);
  }

  state.products.unshift({
    id: makeId(),
    name,
    category,
    stock,
    minStock
  });

  persist();
  elements.form.reset();
  elements.stock.value = '0';
  elements.minStock.value = '1';
  render();
}

function handleProductInput(event) {
  const card = event.target.closest('[data-id]');
  if (!card) {
    return;
  }

  const product = state.products.find((item) => item.id === card.dataset.id);
  if (!product) {
    return;
  }

  if (event.target.matches('[data-field="stock"]')) {
    product.stock = toNumber(event.target.value);
  }

  if (event.target.matches('[data-field="minStock"]')) {
    product.minStock = toNumber(event.target.value);
  }

  if (event.target.matches('[data-field="category"]')) {
    product.category = event.target.value;
  }

  persist();
  render();
}

function handleProductDelete(event) {
  const button = event.target.closest('button[data-action="delete"]');
  if (!button) {
    return;
  }

  state.products = state.products.filter((item) => item.id !== button.dataset.id);
  persist();
  render();
}

function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      categories: uniqueCategories(state.categories),
      products: state.products.map(normalizeProduct).filter(Boolean)
    })
  );
}

function render() {
  state.categories = uniqueCategories(state.categories);
  renderCategoryOptions();
  renderProducts();
  renderShoppingList();
}

function renderCategoryOptions() {
  const options = state.categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join('');

  elements.categorySelect.innerHTML = options;
}

function renderProducts() {
  if (!state.products.length) {
    elements.inventorySummary.textContent = 'Nog geen producten toegevoegd.';
    elements.productList.innerHTML = '<p class="empty-state">Voeg je eerste product toe om de voorraad te beheren.</p>';
    return;
  }

  elements.inventorySummary.textContent = `${state.products.length} product(en) in lokale voorraad.`;
  elements.productList.innerHTML = state.products
    .map((product) => {
      const needsShopping = product.stock < product.minStock;
      const categoryOptions = state.categories
        .map(
          (category) =>
            `<option value="${escapeHtml(category)}" ${category === product.category ? 'selected' : ''}>${escapeHtml(category)}</option>`
        )
        .join('');

      return `
        <article class="product-card ${needsShopping ? 'needs-shopping' : ''}" data-id="${product.id}">
          <header>
            <div>
              <h3>${escapeHtml(product.name)}</h3>
              <span class="category-chip">${escapeHtml(product.category)}</span>
            </div>
            ${needsShopping ? '<span class="badge badge-warning">Moet op boodschappenlijst</span>' : ''}
          </header>
          <div class="product-meta form-grid">
            <label>
              Voorraad
              <input data-field="stock" type="number" min="0" value="${product.stock}">
            </label>
            <label>
              Minimumvoorraad
              <input data-field="minStock" type="number" min="0" value="${product.minStock}">
            </label>
          </div>
          <div class="product-actions">
            <label>
              Categorie
              <select data-field="category">${categoryOptions}</select>
            </label>
            <button type="button" data-action="delete" data-id="${product.id}">Verwijderen</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderShoppingList() {
  const shoppingItems = state.products.filter((product) => product.stock < product.minStock);

  if (!shoppingItems.length) {
    elements.shoppingSummary.textContent = 'Geen producten onder minimumvoorraad.';
    elements.shoppingList.innerHTML = '<li class="empty-state">Alles is voldoende op voorraad.</li>';
    return;
  }

  elements.shoppingSummary.textContent = `${shoppingItems.length} product(en) moeten op de boodschappenlijst.`;
  elements.shoppingList.innerHTML = shoppingItems
    .map(
      (product) => `
        <li class="shopping-item">
          <strong>${escapeHtml(product.name)}</strong>
          <div class="muted">${escapeHtml(product.category)} · voorraad ${product.stock} / minimum ${product.minStock}</div>
        </li>
      `
    )
    .join('');
}

function uniqueCategories(categories) {
  const cleaned = categories
    .map((category) => String(category || '').trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_CATEGORIES, ...cleaned])].sort((left, right) => left.localeCompare(right, 'nl'));
}

function normalizeProduct(product) {
  if (!product || !product.id || !product.name) {
    return null;
  }

  return {
    id: String(product.id),
    name: String(product.name).trim(),
    category: String(product.category || DEFAULT_CATEGORIES[0]).trim() || DEFAULT_CATEGORIES[0],
    stock: toNumber(product.stock),
    minStock: toNumber(product.minStock)
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `product-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
