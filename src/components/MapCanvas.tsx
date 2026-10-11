import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { ShrineRecord, TowerRecord } from '../types';
import { localize, translate } from '../i18n';
import type { Locale } from '../i18n';
import { shrineLatLng } from '../lib/data';
import { NEAR_FOCUS_ZOOM, SHRINE_ZOOM_THRESHOLD } from '../lib/map';
import { Icon } from './Icon';

type MapShrine = Pick<ShrineRecord, 'id' | 'name' | 'position' | 'regionId' | 'dlc'>;
interface Props {
  shrines: MapShrine[];
  towers: TowerRecord[];
  locale: Locale;
  completed: Set<string>;
  selectedId: string | null;
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
  element.style.setProperty('--tooltip-max-width', `${maxWidth}px`);
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  let left = Math.max(inset, Math.min(anchor.x - width / 2, right - width));
  const above = anchor.y - height - 15;
  const below = anchor.y + 15;
  const preferredTop = above >= inset ? above : below;
  let top = Math.max(inset, Math.min(preferredTop, bottom - height));
  const overlays = map.getContainer().parentElement?.querySelectorAll<HTMLElement>('.map-layer-label, .map-controls, .map-caption');
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

function describeMarker(marker: L.Marker, map: L.Map, description: MarkerDescription) {
  marker.bindTooltip(tooltipContent(description), {
    direction: 'auto', offset: [0, -10], className: 'map-tooltip', interactive: false, opacity: 1
  });
  const reposition = () => positionTooltip(map, marker);
  let observer: ResizeObserver | null = null;
  const cleanup = () => {
    map.off('move zoom resize', reposition);
    observer?.disconnect();
    observer = null;
  };
  marker.on('tooltipopen', () => {
    cleanup();
    reposition();
    if (!marker.isTooltipOpen()) return;
    map.on('move zoom resize', reposition);
    observer = new ResizeObserver(reposition);
    observer.observe(map.getContainer());
    const panel = document.querySelector('.sidebar');
    if (panel) observer.observe(panel);
  });
  marker.on('tooltipclose remove', cleanup);
  const element = marker.getElement();
  if (element) {
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', description.label);
    element.setAttribute(`data-${description.kind}-id`, description.id);
    element.setAttribute('data-marker-id', description.id);
  }
}

export default function MapCanvas(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const current = useRef(props);
  current.current = props;
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [imageRetry, setImageRetry] = useState(0);
  const [zoom, setZoom] = useState(-2);
  const initializedView = useRef(false);
  const near = zoom >= SHRINE_ZOOM_THRESHOLD;

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, {
      crs: L.CRS.Simple, minZoom: -4, maxZoom: 2, zoomSnap: 0.1, zoomDelta: 0.5,
      zoomControl: false, attributionControl: false, keyboard: true, keyboardPanDelta: 100,
      maxBounds: [[-10000, -10000], [10000, 13000]], maxBoundsViscosity: 0.5
    });
    map.current = instance;
    layer.current = L.layerGroup().addTo(instance);
    instance.setView([-1250, 1500], -2);
    if (current.current.visible) { fitMap(instance); initializedView.current = true; }
    setZoom(instance.getZoom());
    const handler = () => {
      const center = instance.getCenter();
      current.current.onView([center.lat, center.lng], instance.getZoom());
      setZoom(instance.getZoom());
    };
    instance.on('moveend zoomend', handler);
    const observer = new ResizeObserver(() => instance.invalidateSize({ pan: false }));
    observer.observe(container.current);
    return () => {
      observer.disconnect(); instance.off('moveend zoomend', handler); instance.remove();
      map.current = null; layer.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    setImageState('loading');
    const image = L.imageOverlay(`/assets/hyrule-base.webp${imageRetry ? '?retry=' + imageRetry : ''}`, bounds, { interactive: false }).addTo(instance);
    image.on('load', () => setImageState('ready'));
    image.on('error', () => setImageState('error'));
    return () => { image.remove(); };
  }, [imageRetry]);

  useEffect(() => {
    const instance = map.current;
    const group = layer.current;
    if (!instance || !group) return;
    group.clearLayers();
    if (!near) {
      for (const tower of props.towers) {
        const marker = L.marker(shrineLatLng(tower), {
          keyboard: false,
          icon: L.divIcon({ className: 'tower-hit', html: towerOutline, iconSize: [44, 44], iconAnchor: [22, 22] })
        }).addTo(group);
        marker.on('click', event => {
          const target = closestMarker(instance, current.current.towers, event, tower);
          current.current.onTowerLocate();
          focusPosition(instance, target);
        });
        const name = localize(tower.name, props.locale);
        const region = props.regionName(tower.regionId);
        const purpose = translate(props.locale, 'towerLocate');
        describeMarker(marker, instance, { id: tower.id, kind: 'tower', name, region, badges: [{ text: purpose }], label: `${name} · ${region} · ${purpose}` });
      }
    } else {
      for (const shrine of props.shrines) {
        const complete = props.completed.has(shrine.id);
        const selected = shrine.id === props.selectedId;
        const marker = L.marker(shrineLatLng(shrine), {
          keyboard: false, zIndexOffset: selected ? 1000 : complete ? 100 : 0,
          icon: L.divIcon({
            className: `shrine-hit ${complete ? 'is-complete' : ''} ${selected ? 'is-selected' : ''}`,
            html: complete ? shrineCheck : shrineOutline, iconSize: [44, 44], iconAnchor: [22, 22]
          })
        }).addTo(group);
        marker.on('click', event => current.current.onSelect(closestMarker(instance, current.current.shrines, event, shrine).id));
        const label = `${localize(shrine.name, props.locale)} · ${props.regionName(shrine.regionId)} · ${translate(props.locale, shrine.dlc ? 'dlc' : 'base')} · ${translate(props.locale, complete ? 'completed' : 'incomplete')}`;
        describeMarker(marker, instance, {
          id: shrine.id, kind: 'shrine', name: localize(shrine.name, props.locale), region: props.regionName(shrine.regionId),
          badges: [{ text: translate(props.locale, shrine.dlc ? 'dlc' : 'base') }, { text: translate(props.locale, complete ? 'completed' : 'incomplete'), completed: complete }],
          label
        });
      }
    }
    return () => { group.clearLayers(); };
  }, [props.shrines, props.towers, props.locale, props.completed, props.selectedId, near]);

  useEffect(() => {
    const instance = map.current;
    const target = props.focusTarget;
    const shrine = target && props.shrines.find(record => record.id === target.id);
    if (instance && shrine) focusPosition(instance, shrine);
  }, [props.focusTarget]);

  useEffect(() => {
    if (props.visible) requestAnimationFrame(() => {
      map.current?.invalidateSize({ pan: false });
      if (map.current && !initializedView.current) { fitMap(map.current); initializedView.current = true; }
    });
  }, [props.visible]);

  const t = (key: Parameters<typeof translate>[1]) => translate(props.locale, key);
  return <section className="map-stage" aria-label={t('map')} data-layer={near ? 'shrines' : 'towers'} data-zoom={zoom}>
    <div className="map-canvas" ref={container} tabIndex={0} aria-label={t('mapAccessible')} />
    <div className="map-layer-label" role="status">
      <span>{t(near ? 'nearLayerLabel' : 'farLayerLabel')}</span>
      {!near && <small>{t('towerLayerHint')}</small>}
    </div>
    <div className="map-caption"><span className="map-caption-mark">⌖</span><span>{t('mapHint')}</span></div>
    <div id="map-controls" className="map-controls" tabIndex={-1}>
      <button onClick={() => map.current?.zoomIn()} aria-label={t('zoomIn')} title={t('zoomIn')}><Icon name="plus" /></button>
      <button onClick={() => map.current?.zoomOut()} aria-label={t('zoomOut')} title={t('zoomOut')}><Icon name="minus" /></button>
      <span className="control-divider" />
      <button onClick={() => map.current && fitMap(map.current)} aria-label={t('fitMap')} title={t('fitMap')}><Icon name="map" /></button>
    </div>
    {imageState !== 'ready' && <div className={`map-notice ${imageState === 'error' ? 'error' : ''}`} role={imageState === 'error' ? 'alert' : 'status'}>
      <Icon name="map" size={28} /><p>{t(imageState === 'error' ? 'mapError' : 'mapLoading')}</p>
      {imageState === 'error' && <button className="button secondary" onClick={() => setImageRetry(value => value + 1)}>{t('retryMap')}</button>}
    </div>}
  </section>;
}
