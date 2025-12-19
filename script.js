// ========= APP CONFIG =========
const APP_NAME = "Sibebas";
const APP_TAGLINE = "Jual beli barang bekas mahasiswa Telkom University";

// ========= DUMMY PRODUCTS (untuk seed pertama kali) =========
const DUMMY_PRODUCTS = [
  {
    id: 1,
    name: "Laptop Bekas i5",
    price: 3500000,
    desc: "Laptop kondisi baik, cocok untuk kuliah/kerja. Sudah dicek, siap pakai.",
    image: "foto/laptop.jpg",
    condition: "85% mulus"
  },
  {
    id: 2,
    name: "HP Second 128GB",
    price: 1500000,
    desc: "HP normal, layar aman, baterai masih oke untuk harian. Bonus softcase.",
    image: "foto/handphone.jpg",
    condition: "90% mulus"
  },
  {
    id: 3,
    name: "Sepeda Bekas",
    price: 800000,
    desc: "Sepeda layak pakai, nyaman untuk harian. Ban bagus, rem aman.",
    image: "foto/sepeda.jpg",
    condition: "80% mulus"
  }
];

// ========= STORAGE HELPERS =========
function rupiah(n){
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
}

function setBrand(){
  const nameEl = document.getElementById("appName");
  const tagEl = document.getElementById("appTagline");
  if (nameEl) nameEl.innerText = APP_NAME;
  if (tagEl) tagEl.innerText = APP_TAGLINE;
}

function requireLogin(){
  if (!localStorage.getItem("login")) window.location.href = "index.html";
}

// ===== PRODUCTS (CRUD) =====
function seedProductsIfEmpty(){
  const existing = localStorage.getItem("products");
  if(!existing){
    localStorage.setItem("products", JSON.stringify(DUMMY_PRODUCTS));
  }
}

function getProducts(){
  seedProductsIfEmpty();
  return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(products){
  localStorage.setItem("products", JSON.stringify(products));
}

// ===== CART =====
function getCart(){
  return JSON.parse(localStorage.getItem("cart")) || [];
}
function saveCart(cart){
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ========= AUTH =========
function login(){
  localStorage.setItem("login", "true");
  window.location.href = "home.html";
}
function logout(){
  localStorage.removeItem("login");
  window.location.href = "index.html";
}

// ========= BADGE =========
function updateCartBadge(){
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  badge.innerText = getCart().length;
}

// ========= HOME LIST =========
function loadProducts(){
  requireLogin();
  setBrand();

  const list = document.getElementById("productList");
  list.innerHTML = "";
  const products = getProducts();

  products.forEach(p => {
    list.innerHTML += `
      <div class="cardItem">
        <img src="${p.image}" alt="${p.name}">
        <div class="cardBody">
          <div style="font-weight:900; font-size:16px;">${p.name}</div>
          <div class="muted">${p.condition || "-"}</div>
          <div class="price">${rupiah(p.price)}</div>
          <div class="row">
            <span class="pill">ID: ${p.id}</span>
            <a class="btn btnPrimary" href="detail.html?id=${p.id}" style="padding:8px 10px; border-radius:12px;">Detail</a>
          </div>
        </div>
      </div>
    `;
  });

  updateCartBadge();
}

// ========= DETAIL =========
let selectedProduct = null;

function loadDetail(){
  requireLogin();
  setBrand();

  const id = new URLSearchParams(window.location.search).get("id");
  const products = getProducts();
  selectedProduct = products.find(p => String(p.id) === String(id));

  if(!selectedProduct){
    document.getElementById("detailWrap").innerHTML = `<div class="block">Barang tidak ditemukan.</div>`;
    return;
  }

  document.getElementById("name").innerText = selectedProduct.name;
  document.getElementById("img").src = selectedProduct.image;
  document.getElementById("price").innerText = rupiah(selectedProduct.price);
  document.getElementById("desc").innerText = selectedProduct.desc;
  document.getElementById("cond").innerText = selectedProduct.condition || "-";

  updateCartBadge();
}

function addToCart(){
  if(!selectedProduct) return;
  const cart = getCart();
  cart.push(selectedProduct);
  saveCart(cart);
  updateCartBadge();
  alert("✅ Ditambahkan ke keranjang!");
}

// ========= CART =========
function loadCart(){
  requireLogin();
  setBrand();

  const cart = getCart();
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("totalPrice");

  if(cart.length === 0){
    list.innerHTML = `<div class="block">Keranjang kamu masih kosong.</div>`;
    totalEl.innerText = rupiah(0);
    updateCartBadge();
    return;
  }

  list.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;
    list.innerHTML += `
      <div class="cartItem">
        <img src="${item.image}" alt="${item.name}">
        <div class="cartInfo">
          <div style="font-weight:900;">${item.name}</div>
          <div class="muted">${item.condition || "-"}</div>
          <div class="price" style="margin-top:6px;">${rupiah(item.price)}</div>
        </div>
        <button class="btn btnDanger" onclick="removeFromCart(${index})">Hapus</button>
      </div>
    `;
  });

  totalEl.innerText = rupiah(total);
  updateCartBadge();
}

function removeFromCart(index){
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  loadCart();
}

function clearCart(){
  saveCart([]);
  loadCart();
}

// =====================================================
// ================== ADMIN CRUD PAGE ===================
// =====================================================
let editingProductId = null;

function loadAdmin(){
  requireLogin();
  setBrand();
  renderAdminTable();
  updateCartBadge(); // kalau kamu pakai badge juga di admin
}

function resetForm(){
  editingProductId = null;
  const ids = ["pName","pPrice","pCond","pImage","pDesc"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
}

function nextProductId(products){
  // aman walau ada yang terhapus
  const maxId = products.reduce((m,p)=> Math.max(m, Number(p.id)||0), 0);
  return maxId + 1;
}

function createProduct(){
  const products = getProducts();

  const name = document.getElementById("pName").value.trim();
  const price = Number(document.getElementById("pPrice").value);
  const condition = document.getElementById("pCond").value.trim();
  const image = document.getElementById("pImage").value.trim();
  const desc = document.getElementById("pDesc").value.trim();

  if(!name || !price || !image){
    alert("Mohon isi: Nama, Harga, dan Path Foto.");
    return;
  }

  const newProduct = {
    id: nextProductId(products),
    name,
    price,
    condition: condition || "-",
    image,
    desc: desc || "-"
  };

  products.push(newProduct);
  saveProducts(products);

  resetForm();
  renderAdminTable();
  alert("Produk berhasil ditambahkan!");
}

function fillEditForm(id){
  const products = getProducts();
  const p = products.find(x => String(x.id) === String(id));
  if(!p) return;

  editingProductId = p.id;
  document.getElementById("pName").value = p.name;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pCond").value = p.condition || "";
  document.getElementById("pImage").value = p.image || "";
  document.getElementById("pDesc").value = p.desc || "";
}

function updateProduct(){
  if(editingProductId === null){
    alert("Pilih produk Terlebih Dahulu: klik tombol Edit pada tabel.");
    return;
  }

  const products = getProducts();
  const idx = products.findIndex(x => String(x.id) === String(editingProductId));
  if(idx < 0) return;

  const name = document.getElementById("pName").value.trim();
  const price = Number(document.getElementById("pPrice").value);
  const condition = document.getElementById("pCond").value.trim();
  const image = document.getElementById("pImage").value.trim();
  const desc = document.getElementById("pDesc").value.trim();

  if(!name || !price || !image){
    alert("Mohon isi: Nama, Harga, dan Path Foto.");
    return;
  }

  products[idx] = {
    ...products[idx],
    name,
    price,
    condition: condition || "-",
    image,
    desc: desc || "-"
  };

  saveProducts(products);
  renderAdminTable();
  resetForm();
  alert("Produk berhasil diupdate!");
}

function deleteProduct(id){
  const ok = confirm("Yakin mau hapus produk ini?");
  if(!ok) return;

  const products = getProducts().filter(p => String(p.id) !== String(id));
  saveProducts(products);

  // kalau sedang edit produk yang dihapus
  if(String(editingProductId) === String(id)) resetForm();

  renderAdminTable();
  alert("Produk Berhasil dihapus.");
}

function resetProductsToDummy(){
  const ok = confirm("Reset produk ke dummy awal?");
  if(!ok) return;
  localStorage.setItem("products", JSON.stringify(DUMMY_PRODUCTS));
  resetForm();
  renderAdminTable();
  alert("Produk berhasil direset.");
}

function renderAdminTable(){
  const container = document.getElementById("adminTable");
  if(!container) return;

  const products = getProducts();
  if(products.length === 0){
    container.innerHTML = `<div class="muted">Belum ada produk.</div>`;
    return;
  }

  // tabel sederhana (tanpa library)
  let html = `
    <div style="overflow:auto;">
      <table style="width:100%; border-collapse:collapse; min-width:720px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(255,255,255,.12);">ID</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(255,255,255,.12);">Nama</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(255,255,255,.12);">Harga</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(255,255,255,.12);">Foto</th>
            <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(255,255,255,.12);">Aksi</th>
          </tr>
        </thead>
        <tbody>
  `;

  products.forEach(p => {
    html += `
      <tr>
        <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.08);">${p.id}</td>
        <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.08); font-weight:800;">${p.name}</td>
        <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.08);">${rupiah(p.price)}</td>
        <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.08);">
          <span class="muted">${p.image}</span>
        </td>
        <td style="padding:10px; border-bottom:1px solid rgba(255,255,255,.08);">
          <button class="btn" onclick="fillEditForm(${p.id})">Edit</button>
          <button class="btn btnDanger" onclick="deleteProduct(${p.id})">Hapus</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}
