(async function initTrackPage() {
  const params = new URLSearchParams(window.location.search);
  const dpoTransId = params.get("TransID") || params.get("TransToken");
  const prefillTicket = params.get("ticket");

  if (prefillTicket) document.getElementById("ticketNumber").value = prefillTicket;

  if (dpoTransId) {
    try {
      const { order } = await API.request(`/payments/dpo/verify/${dpoTransId}`);
      renderOrder(order, null);
    } catch (err) {
      showError(err.message);
    }
  }

  document.getElementById("trackForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ticketNumber = document.getElementById("ticketNumber").value.trim();
    const phone = document.getElementById("trackPhone").value.trim();
    hideError();
    try {
      const { order, position } = await API.trackOrder(ticketNumber, phone);
      renderOrder(order, position);
    } catch (err) {
      showError(err.message);
      document.getElementById("trackResult").innerHTML = "";
    }
  });
})();
  
  function showError(message) {
    const el = document.getElementById("trackError");
    el.textContent = message;
    el.classList.add("show");
  }
  function hideError() {
    document.getElementById("trackError").classList.remove("show");
  }
  
function renderOrder(order,position){
    const itemsHtml = order.items
    .map((line) => {
        const spiceLabel = line.spiceLevel && line.spiceLevel !== "none" ? ` (${line.spiceLevel})` : "";
        return `<div class="totals-row"><span>${line.name}${spiceLabel} (${line.quantity}${line.pricingUnit === "per_kg" ? "kg" : "×"})</span><span>${formatMoney(line.lineTotal, order.currency)}</span></div>`;
      })
    .join("");

    document.getElementById ("trackResult").innerHTML = 
    `<div class="ticket-stub">
    <p class="eyebrow">Ticket</p>
    <div class=big-ticket">${order.ticketNumber}</div>
    <div class=eta">
    <span class="ticket-status status-${order.status}" style="display:inline-block;margin:8px 0;">${statusLabel (order.status)}</span>
    </div>
    <div class="eta"> Estimated ready: ${formatEta(order.estimatedReadyAt)}</div>
    ${position ? `<div class="eta">${position} order${position === 1 ? "" : "s"} ahead of you</div>` : ""}
    </div>
    <div class="board-preview">
    <h3>Order details</h3>
    ${itemsHtml}
    <div class="totals-row grand"><span>Total</span><span>${formatMoney(order.totalAmount, order.currency)}</span></div>
    <div class="totals-row"><span>Payment</span><span>${order.paymentStatus === "paid" ? "Paid" : "Pending"}</span></div>
    </div>`;
}

