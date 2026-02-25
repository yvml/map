import L from "leaflet";

let marker: L.CircleMarker | undefined = undefined;

function updateLocation = (position: GeolocationPosition) => {
  const { latitude, longitude, accuracy } = position.coords;
  
  if (!marker) {
    marker = L.circleMarker([latitude, longitude], { radius: accuracy })
  }
}
