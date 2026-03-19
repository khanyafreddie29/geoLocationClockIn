// geologic calculation
// calculates the straight line distance between two gps coordinates pts on a sphere

export function getDistanceMetres(
    lat1: number, lon1: number,
    lat2: number, lon2: number,

): number {
    const R = 6371000;
    const toRad = (deg: number) => deg * Math.PI/180;

    const dLAT = toRad(lat2 - lat1);
    const dLON = toRad(lon2 - lon1);

    const a = 
        Math.sin(dLAT/2) ** 2 +
        Math.cos(toRad(lat1)) * 
        Math.cos(toRad(lat2)) *
        Math.sin(dLON/2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadius(
    learnerLat: number, learnerLon: number,
    venueLat: number, venueLon: number,
    raidusMetres: number
): boolean {
    const distance = getDistanceMetres(learnerLat, learnerLon, venueLat, venueLon);
    return distance <= raidusMetres;
}