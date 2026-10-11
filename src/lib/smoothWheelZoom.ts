import L from 'leaflet';

/** 每帧只应用最新锚点和累计滚轮量，不等待 Leaflet 的缩放动画结束。 */
export function attachSmoothWheelZoom(map: L.Map): () => void {
  const container = map.getContainer();
  const pixelsPerLevel = (map.options.wheelPxPerZoomLevel ?? 60) * 2;
  let targetZoom: number | null = null;
  let latestEvent: WheelEvent | null = null;
  let frame: number | null = null;
  let applying = false;

  const reset = () => {
    if (applying) return;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    targetZoom = null;
    latestEvent = null;
  };
  const apply = () => {
    frame = null;
    if (!latestEvent || targetZoom === null) return;
    if (!container.isConnected || !container.getClientRects().length) { reset(); return; }
    // 先按 Leaflet 的步长取整，再算锚点；未跨步长的小输入不触发无缩放平移。
    const snap = L.Browser.any3d ? map.options.zoomSnap ?? 0 : 1;
    const zoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), snap ? Math.round(targetZoom / snap) * snap : targetZoom));
    if (zoom === map.getZoom()) return;
    const anchor = map.mouseEventToContainerPoint(latestEvent);
    applying = true;
    try { map.setZoomAround(anchor, zoom, { animate: false }); }
    finally { applying = false; }
  };
  const wheel = (event: WheelEvent) => {
    // 控件、水平滚动和浏览器缩放不被地图截获；原触摸缩放与键盘 handler 保留。
    const target = event.target instanceof Element ? event.target : null;
    if (event.ctrlKey || event.metaKey) { reset(); return; }
    if (event.defaultPrevented || target?.closest('button, input, select, textarea, a, [role="dialog"], [data-map-wheel-ignore]')) return;
    const delta = L.DomEvent.getWheelDelta(event);
    if (!delta || !Number.isFinite(delta)) return;
    targetZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), (targetZoom ?? map.getZoom()) + delta / pixelsPerLevel));
    latestEvent = event;
    L.DomEvent.stop(event);
    if (frame === null) frame = requestAnimationFrame(apply);
  };

  container.addEventListener('wheel', wheel, { passive: false });
  container.addEventListener('mousedown', reset);
  container.addEventListener('touchstart', reset, { passive: true });
  map.on('movestart zoomstart', reset);
  return () => {
    reset();
    container.removeEventListener('wheel', wheel);
    container.removeEventListener('mousedown', reset);
    container.removeEventListener('touchstart', reset);
    map.off('movestart zoomstart', reset);
  };
}
