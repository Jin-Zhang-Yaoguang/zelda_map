import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { ShrineRecord, TowerRecord } from '../types';
import { localize, translate } from '../i18n';
import type { Locale } from '../i18n';
import { shrineLatLng } from '../lib/data';
import { NEAR_FOCUS_ZOOM, SHRINE_ZOOM_THRESHOLD } from '../lib/map';
import { Icon } from './Icon';
import { attachSmoothWheelZoom } from '../lib/smoothWheelZoom';
import { createMapTiles } from '../lib/mapTiles';

type MapShrine = Pick<ShrineRecord, 'id' | 'name' | 'position' | 'regionId' | 'dlc'>;
interface Props {
  initialView?: { center: [number,number]; zoom: number };
  shrines: MapShrine[];
  towers: TowerRecord[];
  locale: Locale;
  completed: Set<string>;
  selectedId: string | null;
  showShrines: boolean;
  visible: boolean;
  focusTarget: { id: string; serial: number } | null;
  onSelect: (id: string) => void;
  onTowerLocate: () => void;
  regionName: (id: string) => string;
  onView: (center: [number, number], zoom: number) => void;
}
const bounds: L.LatLngBoundsExpression = [[-2500, 0], [0, 3000]];
const shrineOutline = '<span class="shrine-symbol"><svg viewBox="0 0 24 24"><path d="m12 3 7 6-3 11H8L5 9Z"/><path d="m9 11 3-3 3 3-1 5h-4Z"/></svg></span>';
const shrineCheck = '<span class="shrine-symbol"><svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg></span>';
const towerOutline = '<span class="tower-symbol"><svg viewBox="0 0 24 28"><path d="M7 24h10M9 24V11h6v13M5 6l3 5h8l3-5M5 6V3m14 3V3M5 6h14M12 11V3m-3 13h6m-6 4h6"/></svg></span>';

function panelHeight() {
  return matchMedia('(max-width: 899px)').matches
    ? document.querySelector('.sidebar')?.getBoundingClientRect().height || 56
    : 0;
}
function restoreInitialView(map:L.Map,view:Props['initialView']) {
  if(!view||!Array.isArray(view.center)||view.center.length!==2||!view.center.every(Number.isFinite)||!Number.isFinite(view.zoom)||view.zoom < -4||view.zoom > 2||view.center[0] < -10000||view.center[0] > 10000||view.center[1] < -10000||view.center[1] > 13000)return false;
  map.setView(view.center,view.zoom,{animate:false});
  return true;
}
function fitMap(map: L.Map) {
  map.fitBounds(bounds, { paddingTopLeft: [18, 18], paddingBottomRight: [18, panelHeight() + 18], animate: false });
  if (map.getZoom() >= SHRINE_ZOOM_THRESHOLD) {
    map.setZoom(SHRINE_ZOOM_THRESHOLD - 0.1, { animate: false });
  }
}
function focusPosition(map: L.Map, position: { position: { x: number; y: number; z: number } }) {
  map.setView(shrineLatLng(position), Math.max(map.getZoom(), NEAR_FOCUS_ZOOM), { animate: false });
  if (map.getZoom() < NEAR_FOCUS_ZOOM) { map.once('zoomend', () => focusPosition(map, position)); return; }
  if (panelHeight()) map.panBy([0, panelHeight() / 2], { animate: false });
}
/** 透明命中区重叠时，选择离实际点击最近的真实中心，不移动点位。 */
function closestMarker<T extends { position: { x: number; y: number; z: number } }>(map: L.Map, records: T[], event: L.LeafletMouseEvent, fallback: T): T {
  const click = event.originalEvent
    ? map.mouseEventToContainerPoint(event.originalEvent)
    : map.latLngToContainerPoint(event.latlng);
  let result = fallback;
  let distance = Infinity;
  for (const record of records) {
    const point = map.latLngToContainerPoint(shrineLatLng(record));
    if (Math.abs(point.x - click.x) > 22 || Math.abs(point.y - click.y) > 22) continue;
    const candidateDistance = point.distanceTo(click);
    if (candidateDistance < distance) { result = record; distance = candidateDistance; }
  }
  return result;
}
type VisibleMarker = {kind: 'shrine' | 'tower'; id: string; position: MapShrine['position']};
function closestVisibleMarker(map: L.Map, props: Props, event: L.LeafletMouseEvent, fallback: VisibleMarker): VisibleMarker | null {
  const candidates: VisibleMarker[] = [];
  if (props.showShrines) for (const shrine of props.shrines) candidates.push({kind: 'shrine', id: shrine.id, position: shrine.position});
  if (map.getZoom() < SHRINE_ZOOM_THRESHOLD) for (const tower of props.towers) candidates.push({kind: 'tower', id: tower.id, position: tower.position});
  if (!candidates.length) return null;
  // 同中心时保留实际命中类型；近邻重叠仍按真实中心距离，隐藏类型不参与。
  const clicked = candidates.find(record => record.kind === fallback.kind && record.id === fallback.id);
  return closestMarker(map, clicked ? [clicked, ...candidates] : candidates, event, clicked || candidates[0]);
}
interface MarkerDescription {
  id: string;
  kind: 'shrine' | 'tower';
  name: string;
  region: string;
  badges: { text: string; completed?: boolean }[];
  label: string;
}

/** Tooltip only uses names, regions, scope and completion; all text stays plain DOM. */
function tooltipContent(description: MarkerDescription) {
  const card = document.createElement('div');
  card.className = 'map-tooltip-content';
  const title = document.createElement('strong');
  title.className = 'map-tooltip-title';
  title.textContent = description.name;
  const region = document.createElement('span');
  region.className = 'map-tooltip-region';
  region.textContent = description.region;
  const badges = document.createElement('div');
  badges.className = 'map-tooltip-badges';
  for (const item of description.badges) {
    const badge = document.createElement('span');
    badge.className = `map-tooltip-badge${item.completed ? ' completed' : ''}`;
    badge.textContent = item.text;
    badges.append(badge);
  }
  card.append(title, region, badges);
  return card;
}

/** Keep the hover card inside the actual map viewport, above a mobile bottom panel. */
function positionTooltip(map: L.Map, marker: L.Marker) {
  const tooltip = marker.getTooltip();
  const element = tooltip?.getElement();
  if (!element || !marker.isTooltipOpen()) return;
  const viewport = map.getContainer().getBoundingClientRect();
  if (!viewport.width || !viewport.height) { marker.closeTooltip(); return; }
  let visibleBottom = viewport.height;
  if (matchMedia('(max-width: 899px)').matches) {
    const panel = document.querySelector('.sidebar')?.getBoundingClientRect();
    if (panel && panel.height && panel.top < viewport.bottom && panel.bottom > viewport.top) {
      visibleBottom = Math.min(visibleBottom, panel.top - viewport.top);
    }
  }
  const anchor = map.latLngToContainerPoint(marker.getLatLng());
  if (visibleBottom <= 0 || anchor.x < 0 || anchor.x > viewport.width || anchor.y < 0 || anchor.y > visibleBottom) {
    marker.closeTooltip();
    return;
  }
  const inset = 12;
  const right = viewport.width - inset;
  const bottom = visibleBottom - inset;
  const maxWidth = Math.min(240, Math.max(40, viewport.width - inset * 2));
  if (element.style.getPropertyValue('--tooltip-max-width') !== `${maxWidth}px`) element.style.setProperty('--tooltip-max-width', `${maxWidth}px`);
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  let left = Math.max(inset, Math.min(anchor.x - width / 2, right - width));
  const above = anchor.y - height - 15;
  const below = anchor.y + 15;
  const preferredTop = above >= inset ? above : below;
  let top = Math.max(inset, Math.min(preferredTop, bottom - height));
  const overlays = map.getContainer().parentElement?.querySelectorAll<HTMLElement>('.map-layer-label, .map-controls, .map-caption, .map-detail-notice');
  for (const overlay of overlays || []) {
    if (!overlay.getClientRects().length) continue;
    const rect = overlay.getBoundingClientRect();
    const obstacle = { left: rect.left - viewport.left, right: rect.right - viewport.left, top: rect.top - viewport.top, bottom: rect.bottom - viewport.top };
    if (left >= obstacle.right || left + width <= obstacle.left || top >= obstacle.bottom || top + height <= obstacle.top) continue;
    if (obstacle.bottom + inset + height <= bottom) top = obstacle.bottom + inset;
    else if (obstacle.top - inset - height >= inset) top = obstacle.top - inset - height;
    else if (obstacle.left - inset - width >= inset) left = obstacle.left - inset - width;
    else if (obstacle.right + inset + width <= right) left = obstacle.right + inset;
  }
  L.DomUtil.setPosition(element, map.containerPointToLayerPoint(L.point(left, top)));
}

interface MarkerEntry {
  marker: L.Marker;
  iconKey: string;
  descriptionKey: string;
  update: (description: MarkerDescription) => void;
  dispose: () => void;
}
function describeMarker(marker: L.Marker, map: L.Map, initialDescription: MarkerDescription) {
  let description = initialDescription;
  marker.bindTooltip(tooltipContent(description), {
    direction: 'auto', offset: [0, -10], className: 'map-tooltip', interactive: false, opacity: 1
  });
  let frame: number | null = null;
  const reposition = () => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => { frame = null; positionTooltip(map, marker); });
  };
  let observer: ResizeObserver | null = null;
  const cleanup = () => {
    map.off('move zoom resize', reposition);
    observer?.disconnect();
    observer = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };
  const open = () => {
    cleanup();
    reposition();
    map.on('move zoom resize', reposition);
    observer = new ResizeObserver(reposition);
    observer.observe(map.getContainer());
    const panel = document.querySelector('.sidebar');
    if (panel) observer.observe(panel);
  };
  const annotate = () => {
    const element = marker.getElement();
    if (!element) return;
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', description.label);
    element.setAttribute(`data-${description.kind}-id`, description.id);
    element.setAttribute('data-marker-id', description.id);
  };
  marker.on('tooltipopen', open);
  marker.on('tooltipclose remove', cleanup);
  marker.on('add', annotate);
  annotate();
  return {
    update(next: MarkerDescription) {
      description = next;
      marker.setTooltipContent(tooltipContent(description));
      annotate();
      if (marker.isTooltipOpen()) reposition();
    },
    dispose() {
      cleanup();
      marker.off('tooltipopen', open);
      marker.off('tooltipclose remove', cleanup);
      marker.off('add', annotate);
      marker.unbindTooltip();
    }
  };
}
function markerIcon(complete: boolean, selected: boolean) {
  return L.divIcon({className: `shrine-hit ${complete ? 'is-complete' : ''} ${selected ? 'is-selected' : ''}`, html: complete ? shrineCheck : shrineOutline, iconSize: [44, 44], iconAnchor: [22, 22]});
}

export default function MapCanvas(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const shrineMarkers = useRef(new Map<string, MarkerEntry>());
  const towerMarkers = useRef(new Map<string, MarkerEntry>());
  const current = useRef(props);
  current.current = props;
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [imageRetry, setImageRetry] = useState(0);
  const overview = useRef<L.ImageOverlay | null>(null);
  const detailCleanup = useRef<(() => void) | null>(null);
  const [overviewAvailable, setOverviewAvailable] = useState(false);
  const [detailAvailable, setDetailAvailable] = useState(false);
  const [detailFailed, setDetailFailed] = useState(false);
  const [zoom, setZoom] = useState(-2);
  const initializedView = useRef(false);
  const near = zoom >= SHRINE_ZOOM_THRESHOLD;
  function selectMarker(instance: L.Map, event: L.LeafletMouseEvent, fallback: VisibleMarker) {
    const target = closestVisibleMarker(instance, current.current, event, fallback);
    if (!target) return;
    if (target.kind === 'tower') { current.current.onTowerLocate(); focusPosition(instance, target); }
    else current.current.onSelect(target.id);
  }

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, {
      crs: L.CRS.Simple, minZoom: -4, maxZoom: 2, zoomSnap: 0.1, zoomDelta: 0.5,
      zoomControl: false, attributionControl: false, keyboard: true, keyboardPanDelta: 100,
      scrollWheelZoom: false, zoomAnimation: false,
      maxBounds: [[-10000, -10000], [10000, 13000]], maxBoundsViscosity: 0.5
    });
    map.current = instance;
    instance.createPane('shrineMarkers');
    instance.createPane('towerMarkers');
    instance.getPane('shrineMarkers')!.style.zIndex = '600';
    instance.getPane('towerMarkers')!.style.zIndex = '600';
    const detachWheel = attachSmoothWheelZoom(instance);
    layer.current = L.layerGroup().addTo(instance);
    instance.setView([-1250, 1500], -2);
    if (current.current.visible) { if(!restoreInitialView(instance,current.current.initialView))fitMap(instance); initializedView.current = true; }
    setZoom(instance.getZoom());
    if(current.current.visible){const initialCenter=instance.getCenter();current.current.onView([initialCenter.lat,initialCenter.lng],instance.getZoom());}
    const handler = () => {
      const center = instance.getCenter();
      if(current.current.visible)current.current.onView([center.lat, center.lng], instance.getZoom());
      setZoom(instance.getZoom());
    };
    instance.on('moveend zoomend', handler);
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(container.current);
    return () => {
      observer.disconnect(); detachWheel(); instance.off('moveend zoomend', handler);
      detailCleanup.current?.(); detailCleanup.current = null;
      for (const entries of [shrineMarkers.current, towerMarkers.current]) { for (const entry of entries.values()) entry.dispose(); entries.clear(); }
      instance.remove();
      map.current = null; layer.current = null; overview.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    // 重试先加载替代图，成功才移除旧概览，加载/失败时仍保留可用底图。
    setImageState(overview.current ? 'ready' : 'loading');
    const image = L.imageOverlay(`${import.meta.env.BASE_URL}assets/hyrule-base.webp${imageRetry ? '?retry=' + imageRetry : ''}`, bounds, {interactive: false, opacity: 0, zIndex: 0}).addTo(instance);
    const loaded = () => {
      const previous = overview.current;
      overview.current = image;
      image.setOpacity(1);
      if (previous && previous !== image) previous.remove();
      setOverviewAvailable(true);
      setImageState('ready');
    };
    const failed = () => { image.remove(); setImageState('error'); };
    image.on('load', loaded);
    image.on('error', failed);
    return () => { image.off('load', loaded); image.off('error', failed); if (overview.current !== image) image.remove(); };
  }, [imageRetry]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const tiles = createMapTiles();
    const loaded = new Set<string>();
    const failed = new Set<string>();
    const tileKey = (event: L.TileEvent) => `${event.coords.z}/${event.coords.x}/${event.coords.y}`;
    const update = () => { setDetailAvailable(loaded.size > 0); setDetailFailed(failed.size > 0); };
    const loadedTile = (event: L.TileEvent) => { event.tile.style.visibility = ''; const key = tileKey(event); loaded.add(key); failed.delete(key); update(); };
    const failedTile = (event: L.TileErrorEvent) => { event.tile.style.visibility = 'hidden'; const key = tileKey(event); loaded.delete(key); failed.add(key); update(); };
    const removedTile = (event: L.TileEvent) => { const key = tileKey(event); loaded.delete(key); failed.delete(key); update(); };
    setDetailAvailable(false); setDetailFailed(false);
    tiles.on('tileload', loadedTile);
    tiles.on('tileerror', failedTile);
    tiles.on('tileunload', removedTile);
    tiles.addTo(instance);
    const cleanup = () => { tiles.off('tileload', loadedTile); tiles.off('tileerror', failedTile); tiles.off('tileunload', removedTile); tiles.remove(); if (detailCleanup.current === cleanup) detailCleanup.current = null; };
    detailCleanup.current = cleanup;
    return cleanup;
  }, [imageRetry]);

  useEffect(() => {
    const instance = map.current;
    const group = layer.current;
    if (!instance || !group) return;
    const shrineIds = new Set<string>(props.shrines.map(record => record.id));
    const towerIds = new Set<string>(props.towers.map(record => record.id));
    for (const [entries, ids] of [[shrineMarkers.current, shrineIds], [towerMarkers.current, towerIds]] as const) {
      for (const [id, entry] of entries) if (!ids.has(id)) { entry.dispose(); group.removeLayer(entry.marker); entries.delete(id); }
    }
    for (const tower of props.towers) {
      const name = localize(tower.name, props.locale);
      const region = props.regionName(tower.regionId);
      const purpose = translate(props.locale, 'towerLocate');
      const description: MarkerDescription = {id: tower.id, kind: 'tower', name, region, badges: [{text: purpose}], label: `${name} · ${region} · ${purpose}`};
      let entry = towerMarkers.current.get(tower.id);
      if (!entry) {
        const marker = L.marker(shrineLatLng(tower), {pane: 'towerMarkers', keyboard: false, icon: L.divIcon({className: 'tower-hit', html: towerOutline, iconSize: [44, 44], iconAnchor: [22, 22]})}).addTo(group);
        marker.on('click', event => selectMarker(instance, event, {kind: 'tower', id: tower.id, position: tower.position}));
        entry = {marker, iconKey: '', descriptionKey: JSON.stringify(description), ...describeMarker(marker, instance, description)};
        towerMarkers.current.set(tower.id, entry);
      } else {
        const descriptionKey = JSON.stringify(description);
        if (entry.descriptionKey !== descriptionKey) { entry.update(description); entry.descriptionKey = descriptionKey; }
      }
      const position = L.latLng(shrineLatLng(tower));
      if (!entry.marker.getLatLng().equals(position)) entry.marker.setLatLng(position);
    }
    for (const shrine of props.shrines) {
      const complete = props.completed.has(shrine.id);
      const selected = shrine.id === props.selectedId;
      const iconKey = `${complete}|${selected}`;
      const description: MarkerDescription = {
        id: shrine.id, kind: 'shrine', name: localize(shrine.name, props.locale), region: props.regionName(shrine.regionId),
        badges: [{text: translate(props.locale, shrine.dlc ? 'dlc' : 'base')}, {text: translate(props.locale, complete ? 'completed' : 'incomplete'), completed: complete}],
        label: `${localize(shrine.name, props.locale)} · ${props.regionName(shrine.regionId)} · ${translate(props.locale, shrine.dlc ? 'dlc' : 'base')} · ${translate(props.locale, complete ? 'completed' : 'incomplete')}`
      };
      let entry = shrineMarkers.current.get(shrine.id);
      if (!entry) {
        const marker = L.marker(shrineLatLng(shrine), {pane: 'shrineMarkers', keyboard: false, zIndexOffset: selected ? 1000 : complete ? 100 : 0, icon: markerIcon(complete, selected)}).addTo(group);
        marker.on('click', event => selectMarker(instance, event, {kind: 'shrine', id: shrine.id, position: shrine.position}));
        entry = {marker, iconKey, descriptionKey: JSON.stringify(description), ...describeMarker(marker, instance, description)};
        shrineMarkers.current.set(shrine.id, entry);
      } else {
        const descriptionKey = JSON.stringify(description);
        if (entry.iconKey !== iconKey) {
          entry.marker.setIcon(markerIcon(complete, selected));
          entry.marker.setZIndexOffset(selected ? 1000 : complete ? 100 : 0);
          entry.iconKey = iconKey;
          entry.update(description);
          entry.descriptionKey = descriptionKey;
        } else if (entry.descriptionKey !== descriptionKey) { entry.update(description); entry.descriptionKey = descriptionKey; }
      }
      const position = L.latLng(shrineLatLng(shrine));
      if (!entry.marker.getLatLng().equals(position)) entry.marker.setLatLng(position);
    }
  }, [props.shrines, props.towers, props.locale, props.completed, props.selectedId, props.regionName]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    instance.getPane('shrineMarkers')!.style.display = props.showShrines ? '' : 'none';
    instance.getPane('towerMarkers')!.style.display = near ? 'none' : '';
    if (!props.showShrines) for (const entry of shrineMarkers.current.values()) entry.marker.closeTooltip();
    if (near) for (const entry of towerMarkers.current.values()) entry.marker.closeTooltip();
  }, [near, props.showShrines]);

  useEffect(() => {
    const instance = map.current;
    const target = props.focusTarget;
    const shrine = target && props.shrines.find(record => record.id === target.id);
    if (instance && shrine) focusPosition(instance, shrine);
  }, [props.focusTarget]);

  useEffect(() => {
    if (!props.visible) return;
    const frame = requestAnimationFrame(() => {
      map.current?.invalidateSize({ pan: false });
      if (map.current && !initializedView.current) { if(!restoreInitialView(map.current,current.current.initialView))fitMap(map.current); initializedView.current = true; }
    });
    return () => cancelAnimationFrame(frame);
  }, [props.visible]);

  const t = (key: Parameters<typeof translate>[1]) => translate(props.locale, key);
  const layerLabel = props.showShrines ? (near ? 'mapShrinesOnly' : 'mapShrinesAndTowers') : (near ? 'mapMarkersHidden' : 'mapTowersOnly');
  const markerLayer = props.showShrines ? (near ? 'shrines' : 'shrines-towers') : (near ? 'hidden' : 'towers');
  return <section className="map-stage" aria-label={t('map')} data-layer={markerLayer} data-zoom={zoom}>
    <div className="map-canvas" ref={container} tabIndex={0} aria-label={t('mapAccessible')} />
    <div className="map-layer-label" role="status">
      <span>{t(layerLabel)}</span>
      {!near && <small>{t('towerLayerHint')}</small>}
    </div>
    <div className="map-caption"><span className="map-caption-mark">⌖</span><span>{t('mapHint')}</span></div>
    <div id="map-controls" className="map-controls" tabIndex={-1}>
      <button onClick={() => map.current?.zoomIn(undefined, {animate: false})} aria-label={t('zoomIn')} title={t('zoomIn')}><Icon name="plus" /></button>
      <button onClick={() => map.current?.zoomOut(undefined, {animate: false})} aria-label={t('zoomOut')} title={t('zoomOut')}><Icon name="minus" /></button>
      <span className="control-divider" />
      <button onClick={() => map.current && fitMap(map.current)} aria-label={t('fitMap')} title={t('fitMap')}><Icon name="map" /></button>
    </div>
    {!overviewAvailable && !detailAvailable && <div className={`map-notice ${imageState === 'error' ? 'error' : ''}`} role={imageState === 'error' ? 'alert' : 'status'}>
      <Icon name="map" size={28} /><p>{t(imageState === 'error' ? 'mapError' : 'mapLoading')}</p>
      {imageState === 'error' && <button className="button secondary" onClick={() => setImageRetry(value => value + 1)}>{t('retryMap')}</button>}
    </div>}
    {(detailFailed || overviewAvailable && imageState === 'error') && <div className="map-detail-notice" role="status"><p>{t('mapDetailError')}</p><button onClick={() => setImageRetry(value => value + 1)}>{t('retryMap')}</button></div>}
  </section>;
}
