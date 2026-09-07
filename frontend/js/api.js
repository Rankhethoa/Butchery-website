const API = {
    base: "/api",

    async request (path, options = {}){
        const res = await fetch (`${this.base}${path}`, {
            headers: { "Content-Type" : "application/json"},
            cache: "no-store",
            ...options,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error (data.error || "Something went wrong.");
        return data;
    },
    
    getConfig (){
        return this.request("/config");
    },
    getMenu (){
        return this.request("/menu");
    },
    getBoard (){
        return this.request("/orders/board");
    },
    placeOrder (payLoad){
        return this.request("/orders", {method: "POST", body: JSON.stringify(payLoad)});
    },
    trackOrder (ticketNumber, phone){
        const qs = new URLSearchParams ({ ticketNumber, phone }).toString();
        return this.request(`/orders/track?${qs}`);
    },
    initializePaystack(orderId, email, phone) {
        return this.request("/payments/dpo/initialize", {
          method: "POST",
          body: JSON.stringify({ orderId, email, phone }),
        });
      },
      confirmMobileMoney(orderId, reference) {
        return this.request("/payments/mobile-money/notify", {
          method: "POST",
          body: JSON.stringify({ orderId, reference }),
        });
      },
};

function formatMoney (amount, currency = "ZAR"){
    const symbol = currency === "LS" || currency === "M" ? "ZAR" : currency + " ";
    return `${symbol} ${Number(amount).toFixed(2)}`;
}

function formatEta (dateStr){
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString ([], {hour: "2-digit", minute: "2-digit"});
}

function statusLabel (status){
    return{
        queued: "Queued", 
        on_the_fire: "On the fire",
        ready: "Ready",
        completed: "Collected",
        cancelled: "Cancelled"
    }
    [status] || status;
}
