let MENU = [];
let CONFIG = {currency: "ZAR"};
let ACTIVE_CATEGORY = "all";
const cart = new Map();

function cartKey(itemId, spice) {
    return `${itemId}::${spice}`;
}

async function init(){
    try{
        CONFIG = await API.getConfig();
        document.getElementById("currencyLabel").textContent = CONFIG.currency;
    } catch (err){}

    loadMenu();
    loadBoard();
    setInterval (loadBoard, 15000);
    wireCartDrawer();
    wireCheckout();
}

init();

async function loadMenu(){
    try{
        MENU = await API.getMenu();
        renderCategoryTabs();
        renderMenu();
    } catch (err){
        document.getElementById("menuGrid").innerHTML = `<p class="board-empty">Couldn't load the menu. Please refresh page</p>`;
    }
}

function renderCategoryTabs(){
    const cats = ["all", ...new Set(MENU.map((m) => m.category))];
    const wrap = document.getElementById("categoryTabs");
    wrap.innerHTML = cats.map((c) => `<button class="tab ${c === ACTIVE_CATEGORY ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
    wrap.querySelectorAll(".tab").forEach((btn) => {
        btn.addEventListener("click", () => {
            ACTIVE_CATEGORY = btn.dataset.cat;
            renderCategoryTabs();
            renderMenu();
        });
    });
}

function renderMenu (){
    const grid = document.getElementById("menuGrid");
    const items = ACTIVE_CATEGORY === "all" ? MENU : MENU.filter((m) => m.category === ACTIVE_CATEGORY);
    if (items.length === 0){
        grid.innerHTML = `<p class="board-empty">No items available in this category.</p>`;
        return;
    }
    grid.innerHTML = items.map(cardHtml).join("");
    grid.querySelectorAll("[data-add]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.add;
            const input =grid.querySelector(`[data-qty="${id}"]`);
            const spiceSelect = grid.querySelector(`[data-spice="${id}"]`);
            const qty = Number(input.value);
            const item = MENU.find((m) => m._id === id);
            if (!qty || qty<-0) return;
            if (item.pricingUnit === "per_kg" && qty < item.minWeightKg){
                input.focus();
                return;
            }
            const spice = spiceSelect ? spiceSelect.value : item.spiceLevel || "none";
            addToCart(item, qty, spice);
        });
    });
}

function cardHtml (item){
    const unit = item.pricingUnit === "per_kg" ? "kg" : "unit";
    const step = item.pricingUnit === "per_kg" ? 0.1 : 1;
    const defaultQty = item.pricingUnit === "per_kg" ? item.minWeightKg : 1;
    const hasSpiceOptions = item.spiceLevel && item.spiceLevel !== "none";
    const spiceOptions = ["mild", "medium", "hot"];
    const spiceDropdown = hasSpiceOptions
    ? `
    <div class="qty-row">
      <label>Spice</label>
      <select data-spice="${item._id}">
        ${spiceOptions
          .map(
            (level) =>
              `<option value="${level}" ${level === item.spiceLevel ? "selected" : ""}>${level}</option>`
          )
          .join("")}
      </select>
    </div>`
    : "";
    

    return `
    <div class="meat-card">
        <div class="top-row">
        <h4>${item.name}</h4>
        <span class="price">${formatMoney(item.price, CONFIG.currency)}/${unit}</span>
        </div>
        <p class="desc">${item.description || ""}</p>
        ${spiceDropdown}
        <div class="qty-row">
        <label>Qty (${unit})</label>
        <input type="number" data-qty="${item._id}" min="${item.pricingUnit === "per_kg" ? item.minWeightKg : 1}" step="${step}" value="${defaultQty}" />
        <button class="btn btn-ghost" data-add="${item._id}">Add</button>
        </div>
    </div>
    `;
}

function addToCart (item, quantity, spice){
    const key = cartKey(item._id, spice);
    const existing = cart.get(item._id);
    cart.set(key, {
        item,
        spice,
        quantity: existing ? existing.quantity + quantity : quantity,
    });
    renderCart();
    openDrawer();
}

function removeFromCart(key){
    cart.delete(key);
    renderCart();
}

function cartTotals(){
    let subtotal = 0;
    for (const{item, quantity} of cart.values())
        subtotal += item.price * quantity;
    return { subtotal, total: subtotal };
}

function renderCart (){
    const body = document.getElementById("cartBody");
    const countBadge = document.getElementById("cartCount");
    const checkoutBtn = document.getElementById("checkoutBtn");

    if (cart.size === 0){
        body.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
        countBadge.hidden = true;
        checkoutBtn.disabled = true;
    } else{
        body.innerHTML = [...cart.entries()].map(([key, { item, quantity, spice }]) => {
            const unit = item.pricingUnit === "per_kg" ? "kg" : "unit";
            const spiceLabel = spice && spice !== "none" ? ` &middot; ${spice} spice` : "";
            return `<div class="cart-line">
                      <div>
                      <div class="name">${item.name}</div>
                      <div class="meta">${quantity}${unit === "kg" ? "kg" : "×"} @ ${formatMoney(item.price, CONFIG.currency)} each ${spiceLabel}</div>
                      <button class="remove" data-remove="${key}">Remove</button>
                      </div>
                      <div class="amount">${formatMoney(item.price * quantity, CONFIG.currency)}</div>
                      </div>`;
          }).join("");
        body.querySelectorAll("[data-remove]").forEach((btn) => {
            btn.addEventListener("click", () => {
                removeFromCart(btn.dataset.remove);
            });
        });
        countBadge.hidden = false;
        countBadge.textContent = cart.size;
        checkoutBtn.disabled = false;
    }
    const { subtotal, total } = cartTotals();
    document.getElementById("cartSubtotal").textContent = formatMoney(subtotal, CONFIG.currency);
    document.getElementById("cartTotal").textContent = formatMoney(total, CONFIG.currency);
}

//Drawer
function wireCartDrawer(){
    const backdrop = document.getElementById("drawerBackdrop");
    document.getElementById("openCartBtn").addEventListener("click", openDrawer);
    document.getElementById("closeCartBtn").addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    document.getElementById("checkoutBtn").addEventListener("click", () => {
        closeDrawer();
        openCheckout();
    });
}

function openDrawer(){
    document.getElementById("cartDrawer").classList.add("open");
    document.getElementById("drawerBackdrop").classList.add("open");
}
function closeDrawer(){
    document.getElementById("cartDrawer").classList.remove("open");
    document.getElementById("drawerBackdrop").classList.remove("open");
}

//Checkout
function wireCheckout(){
    document.getElementById("checkoutForm").addEventListener("submit", handleCheckoutSubmit);
    document.getElementById("confirmDoneBtn").addEventListener("click", () =>{
        document.getElementById("confirmBackdrop").classList.remove("open");
        cart.clear();
        renderCart();
        window.location.href = "index.html";
    });
}

function openCheckout(){
    document.getElementById("checkoutError").classList.remove("show");
    document.getElementById("checkoutBackdrop").classList.add("open");
}
function closeCheckout(){
    document.getElementById("checkoutBackdrop").classList.remove("open");
}
function showCheckoutError(message){
    const el = document.getElementById("checkoutError");
    el.textContent = message;
    el.classList.add("show");
}

async function handleCheckoutSubmit(e){
    e.preventDefault();
    const btn = document.getElementById("placeOrderBtn");
    btn.disabled = true;
    btn.textContent = "Placing order...";

    try{
        const payload = {
            customerName: document.getElementById("customerName").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            items: [...cart.values()].map(({item, quantity, spice}) => ({
                menuItemId: item._id,
                quantity,
                spiceLevel: spice || "none",
            })),

        };

        const {order} = await API.placeOrder(payload);
        if (payload.paymentMethod === "cash" || payload.paymentMethod === "bank_card"){
            showConfirmation(order.ticketNumber, order.estimatedReadyAt);
            closeCheckout();
            return;
        }

        if (payload.paymentMethod === "bank_eft"){
            const { authorizationUrl} = await API.initializePaystack(order._id);
            window.location.href = authorizationUrl;
            return;
        }
        

        if (payload.paymentMethod === "mobile_money"){
            closeCheckout();
            promptMobileMoneyConfirmation(order);
            return;
        }
    } catch (err){
        showCheckoutError(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Place order";
    }
}

function promptMobileMoneyConfirmation(order){
    const reference = window.prompt(
        `Send ${formatMoney(order.totalAmount, CONFIG.currency)} to 62146157/50180910 via EcoCash/M-Pesa then paste your confirmation code here:`);
    if (!reference)
        return;
    API.confirmMobileMoney(order._id, reference).then(({order: confirmed}) =>
    showConfirmation(confirmed.ticketNumber, confirmed.estimatedReadyAt))   
    .catch ((err) => alert(err.message));
}

function showConfirmation(ticketNumber, estimatedReadyAt){
    document.getElementById("ticketNumberOut").textContent = ticketNumber;
    document.getElementById("ticketEtaOut").textContent = `Estimated ready: ${formatEta(estimatedReadyAt)}`;
    document.getElementById("confirmBackdrop").classList.add("open");
}

//Join the queue
async function loadBoard(){
    try{
        const board = await API.getBoard();
        renderBoard(board, document.getElementById("heroBoard"), 4);
        renderBoard(board, document.getElementById("fullBoard"), 20);
    } catch (e){}
}

function renderBoard(board, container, limit){
    if (!container) return;
    if (board.length === 0){
        container.innerHTML = `<p class="board-empty">No orders on the grill right now. Order and become the first in line</p>`;
        return;
    }
    container.innerHTML = board.slice(0, limit).map (
        (t) => `<div class="ticket-row">
        <span class="ticket-num">${t.ticketNumber}</span>
        <span class="ticket-status status-${t.status}">${statusLabel(t.status)}</span>
        <span class="ticket-eta">${formatEta(t.estimatedReadyAt)}</span>
        </div>`
    ).join ("");
}