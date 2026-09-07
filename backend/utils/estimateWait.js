export function getStations(){
    const n = parseInt(process.env.GRILL_STATIONS || "2", 10);
    return Number.isFinite(n) && n > 0 ? n : 2;
}

export function simulateStations (activeOrders, now=Date.now()){
    const stations = getStations();
    const freeAt = new Array(stations).fill(0);

    // orders already on the grill occupy a station until they finish
    const onFire = activeOrders.filter((o) => o.status === "on_the_fire");
    onFire.forEach((order, i) =>{
        const elapsedMin = order.grillStartedAt ? (now - new Date(order.grillStartedAt).getTime()) / 60000 : 0;
        const remaining = Math.max(order.totalCookMinutes - elapsedMin, 1);
        const slot = i % stations;
        freeAt[slot] = Math.max(freeAt[slot], remaining);
    });

    // queued orders get assigned to whichever station frees up soonest
    const queued = activeOrders.filter((o) => o.status === "queued");
    for (const order of queued){
        let minIdx = 0;
        for (let i=1; i<freeAt.length; i++){
            if (freeAt[i] < freeAt[minIdx]) minIdx = i;
        }
        freeAt[minIdx] += order.totalCookMinutes;
    }
    return freeAt;
}

export function estimateReadyTime(newOrderCookMinutes, activeOrders, now=Date.now()){
    const freeAt = simulateStations(activeOrders, now);
    let minIdx = 0;
    for (let i=1; i<freeAt.length; i++){
        if (freeAt[i] < freeAt[minIdx]) minIdx = i;
    }
    const readyInMinutes = freeAt[minIdx] + newOrderCookMinutes;
    return {
        estimatedReadyAt: new Date(now + readyInMinutes * 60000),
        waitMinutes: Math.round(readyInMinutes),
        positionAhead: activeOrders.length,
    };
    
}