import L from 'leaflet';

/** setView的连续缩放不必销毁仍可复用的瓦片；viewreset仍负责更新投影。 */
class StableMapTiles extends L.TileLayer {
  override getEvents() {
    const events = super.getEvents?.() ?? {};
    delete events.viewprereset;
    return events;
  }
}

/** 原生24000×20000分级PNG，逻辑世界仍为3000×2500。 */
export function createMapTiles(pixelRatio = window.devicePixelRatio || 1): L.TileLayer {
  const dense = pixelRatio > 1;
  return new StableMapTiles(`${import.meta.env.BASE_URL}assets/map-tiles/{z}/{x}/{y}.png`, {
    pane: 'overlayPane', zIndex: 2,
    tileSize: dense ? 128 : 256,
    zoomOffset: dense ? 5 : 4,
    minZoom: -4, maxZoom: 2,
    minNativeZoom: dense ? -3 : -2,
    maxNativeZoom: dense ? 2 : 3,
    bounds: [[-2500, 0], [0, 3000]], noWrap: true,
    keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false,
    className: 'map-detail-tile',
  });
}
