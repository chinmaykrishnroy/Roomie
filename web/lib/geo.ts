export interface GeoCoords {
  latitude: number;
  longitude: number;
}

export async function getBrowserLocation(): Promise<GeoCoords | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("Geolocation denied or unavailable:", err.message);
        resolve(null);
      },
      { timeout: 6000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  });
}
