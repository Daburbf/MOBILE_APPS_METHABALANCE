/**
 * METHABALANCE Mobile — Shared Leaflet GIS Map Renderer
 * Exact topology & valve markers from WEB_METHABALANCE.
 */

window.MBM = window.MBM || {};

(function (MBM) {
  'use strict';

  function createGisMap(containerId, options) {
    const opts = options || {};
    const container = document.getElementById(containerId);
    if (!container || typeof L === 'undefined') return null;

    const map = L.map(containerId, {
      zoomControl: true,
      attributionControl: false
    }).setView([-1.2105, 116.9405], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 12
    }).addTo(map);

    const bounds = [];
    const topology = MBM.data.getPipelineTopology();

    // 1. Trunk Pipeline (DN80)
    if (topology && topology.trunkCoords && topology.trunkCoords.length) {
      topology.trunkCoords.forEach((pt) => bounds.push(pt));
      L.polyline(topology.trunkCoords, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map).bindTooltip('Pipa Induk Transmisi Utama (DN80)', { sticky: true });

      L.polyline(topology.trunkCoords, {
        color: '#34d399',
        weight: 2,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '6, 12'
      }).addTo(map);
    }

    // 2. 4 Distribution Branches
    if (topology && topology.branches) {
      topology.branches.forEach((b) => {
        b.coords.forEach((pt) => bounds.push(pt));
        L.polyline(b.coords, {
          color: '#059669',
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map).bindTooltip(b.name, { sticky: true });

        L.polyline(b.coords, {
          color: '#34d399',
          weight: 1.8,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '5, 10'
        }).addTo(map);
      });
    }

    const markers = {};

    function renderMarkers(filterMode) {
      Object.values(markers).forEach((m) => map.removeLayer(m));
      const nodes = MBM.data.getNodesGis();

      nodes.forEach((node) => {
        const isClosed = node.valveStatus === 'CLOSED';
        if (filterMode === 'OPEN' && isClosed) return;
        if (filterMode === 'CLOSED' && !isClosed) return;

        const numLabel = node.code.replace('Node-', '');
        const icon = L.divIcon({
          className: 'valve-div-marker-wrapper',
          html: `<div class="valve-marker ${isClosed ? 'closed' : 'open'}" title="${node.code} (${node.valveStatus})"><span>${numLabel}</span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([node.lat, node.lng], { icon }).addTo(map);
        marker.bindTooltip(
          `<strong>${node.code} · ${node.name}</strong><br>Katup: <strong style="color:${isClosed ? '#dc2626' : '#059669'}">${isClosed ? 'TERTUTUP' : 'TERBUKA'}</strong> · ${node.pressure.toFixed(1).replace('.', ',')} kPa`,
          { direction: 'top', offset: [0, -10] }
        );

        marker.on('click', () => {
          if (typeof opts.onNodeClick === 'function') {
            opts.onNodeClick(node);
          }
        });

        markers[node.id] = marker;
      });
    }

    MBM.data.getNodesGis().forEach((n) => bounds.push([n.lat, n.lng]));
    renderMarkers('ALL');

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [24, 24] });
    }

    return {
      map,
      refreshMarkers: renderMarkers,
      invalidate: () => {
        setTimeout(() => {
          map.invalidateSize();
          if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
        }, 180);
      }
    };
  }

  MBM.gis = { createGisMap };
})(window.MBM);
