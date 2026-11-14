/**
 * METHABALANCE Teknisi — Independent Controller
 * SCADA + Peta GIS, Pipa & Katup (Buka/Tutup + Siphon), Pelanggan, Tiket.
 */

(function () {
  'use strict';

  const MBM = window.MBM;
  if (!MBM || !MBM.data) return;

  let techMapCtrl = null;
  let currentFilter = 'ALL';
  let custFilter = 'ALL';
  let custQuery = '';
  let ticketFilter = 'ALL';
  let selectedNodeId = null;

  const el = {
    navBtns: document.querySelectorAll('.nav-tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    techClosedChip: document.getElementById('techClosedChip'),
    techFilterAll: document.getElementById('techFilterAll'),
    techFilterOpen: document.getElementById('techFilterOpen'),
    techFilterClosed: document.getElementById('techFilterClosed'),
    techCountOpen: document.getElementById('techCountOpen'),
    techCountClosed: document.getElementById('techCountClosed'),

    scadaOpenCount: document.getElementById('scadaOpenCount'),
    scadaOpenPct: document.getElementById('scadaOpenPct'),
    techOpenArc: document.getElementById('techOpenArc'),
    scadaClosedNote: document.getElementById('scadaClosedNote'),

    btnEmergencyAllBranches: document.getElementById('btnEmergencyAllBranches'),
    btnRestoreAllBranches: document.getElementById('btnRestoreAllBranches'),
    btnDrainSiphon: document.getElementById('btnDrainSiphon'),
    siphonStatusText: document.getElementById('siphonStatusText'),

    techValveList: document.getElementById('techValveList'),
    custSearchInput: document.getElementById('custSearchInput'),
    custFilterBtns: document.querySelectorAll('[data-cust-filter]'),
    techCustomerList: document.getElementById('techCustomerList'),

    ticketFilterBtns: document.querySelectorAll('[data-ticket-filter]'),
    scadaTicketSub: document.getElementById('scadaTicketSub'),
    techTicketsList: document.getElementById('techTicketsList'),

    techValveModal: document.getElementById('techValveModal'),
    btnCloseTechValveModal: document.getElementById('btnCloseTechValveModal'),
    btnCancelTechValve: document.getElementById('btnCancelTechValve'),
    btnToggleTechValve: document.getElementById('btnToggleTechValve'),
    techValveModalTitle: document.getElementById('techValveModalTitle'),
    techValveInfo: document.getElementById('techValveInfo'),
    techReasonField: document.getElementById('techReasonField'),
    techValveReason: document.getElementById('techValveReason'),

    appToast: document.getElementById('appToast'),
    toastMessage: document.getElementById('toastMessage')
  };

  let toastTimer = null;
  function showToast(msg) {
    if (!el.appToast || !el.toastMessage) return;
    el.appToast.classList.add('active');
    el.toastMessage.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.appToast.classList.remove('active'), 2800);
  }

  function switchTab(tabId) {
    el.navBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
    el.tabPanes.forEach((p) => p.classList.toggle('active', p.id === tabId));
    if (tabId === 'tab-scada' && techMapCtrl) {
      techMapCtrl.invalidate();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openValveControlModal(node) {
    selectedNodeId = node.id;
    const isClosed = node.valveStatus === 'CLOSED';

    el.techValveModalTitle.textContent = `${node.code} · ${node.name}`;
    el.techValveInfo.innerHTML = `
      <div class="kv-row">
        <span class="kv-key">Status Saat Ini</span>
        <span class="kv-val" style="color:${isClosed ? 'var(--danger)' : 'var(--emerald-deep)'};font-weight:700;">
          ${isClosed ? 'TERTUTUP' : 'TERBUKA'}
        </span>
      </div>
      <div class="kv-row">
        <span class="kv-key">Zona</span>
        <span class="kv-val">${node.zone}</span>
      </div>
      <div class="kv-row">
        <span class="kv-key">Tekanan</span>
        <span class="kv-val tabular-nums">${node.pressure.toFixed(1).replace('.', ',')} kPa</span>
      </div>
      <div class="kv-row">
        <span class="kv-key">Terdampak</span>
        <span class="kv-val">${node.affectedSectors}</span>
      </div>
    `;

    el.techReasonField.style.display = isClosed ? 'none' : 'flex';
    el.techValveReason.value = '';
    el.btnToggleTechValve.textContent = isClosed ? 'Buka Katup' : 'Tutup Katup';
    el.btnToggleTechValve.className = isClosed ? 'btn-primary' : 'btn-primary btn-danger';

    el.techValveModal.classList.add('active');
  }

  function renderCustomers() {
    if (!el.techCustomerList) return;
    const q = custQuery.toLowerCase();
    const list = MBM.data.CUSTOMERS.filter((c) => {
      if (custFilter === 'UNPAID' && c.status === 'Lunas') return false;
      if (custFilter !== 'ALL' && custFilter !== 'UNPAID' && c.type !== custFilter) return false;
      if (q && !(c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q))) return false;
      return true;
    });

    el.techCustomerList.innerHTML = list.map((c) => {
      const isPaid = c.status === 'Lunas';
      return `
        <div class="valve-row" data-cust-id="${c.id}">
          <div class="valve-row-info">
            <div class="valve-row-title">${c.name} (${c.id})</div>
            <div class="valve-row-sub">${c.type} · ${c.zone} · ${c.usage}</div>
          </div>
          <span class="valve-badge ${isPaid ? 'open' : 'closed'}">${c.status}</span>
        </div>
      `;
    }).join('') || '<div class="report-item-meta">Tidak ada pelanggan ditemukan.</div>';

    el.techCustomerList.querySelectorAll('[data-cust-id]').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-cust-id');
        MBM.data.toggleCustomerPaid(id);
        renderCustomers();
        showToast(`Status iuran ${id} diperbarui`);
      });
    });
  }

  function renderTickets() {
    if (!el.techTicketsList) return;
    const all = MBM.data.getReports();
    const activeCount = all.filter((r) => r.status !== 'Selesai').length;
    if (el.scadaTicketSub) {
      el.scadaTicketSub.textContent = `${activeCount} tiket aktif menunggu penanganan`;
    }

    const list = all.filter((r) => {
      if (ticketFilter === 'ACTIVE') return r.status !== 'Selesai';
      if (ticketFilter === 'DONE') return r.status === 'Selesai';
      return true;
    });

    el.techTicketsList.innerHTML = list.map((r) => {
      const isPending = r.status !== 'Selesai';
      return `
        <div class="report-item">
          <div class="report-item-top">
            <span class="report-item-cat">${r.category}</span>
            <span class="report-status-tag ${isPending ? 'pending' : ''}">${r.status}</span>
          </div>
          <div class="report-item-meta">${r.id} · ${r.location}</div>
          <div class="report-item-meta" style="margin-top:2px;">${r.description}</div>
          ${isPending ? `<button class="link-btn" style="margin-top:6px;" data-resolve-id="${r.id}" type="button">Tandai Selesai</button>` : ''}
        </div>
      `;
    }).join('') || '<div class="report-item-meta">Tidak ada tiket.</div>';

    el.techTicketsList.querySelectorAll('[data-resolve-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        MBM.data.resolveReport(btn.getAttribute('data-resolve-id'));
        renderTickets();
        showToast('Tiket ditandai selesai');
      });
    });
  }

  function refreshAll() {
    const nodes = MBM.data.getNodesGis();
    const openCount = nodes.filter((n) => n.valveStatus === 'OPEN').length;
    const closedCount = nodes.filter((n) => n.valveStatus === 'CLOSED').length;
    const openPct = Math.round((openCount / nodes.length) * 100);

    if (el.techFilterAll) el.techFilterAll.textContent = `Semua (${nodes.length})`;
    if (el.techCountOpen) el.techCountOpen.textContent = openCount;
    if (el.techCountClosed) el.techCountClosed.textContent = closedCount;
    if (el.techClosedChip) {
      el.techClosedChip.textContent = `${closedCount} Tertutup`;
      el.techClosedChip.className = closedCount > 0 ? 'status-chip danger' : 'status-chip';
    }

    if (el.scadaOpenCount) el.scadaOpenCount.textContent = openCount;
    if (el.scadaOpenPct) el.scadaOpenPct.textContent = openPct;
    if (el.techOpenArc) {
      el.techOpenArc.setAttribute('stroke-dashoffset', (138.23 * (1 - openCount / nodes.length)).toFixed(1));
    }
    if (el.scadaClosedNote) el.scadaClosedNote.textContent = `${closedCount} Terisolasi`;

    if (techMapCtrl) techMapCtrl.refreshMarkers(currentFilter);

    const filtered = nodes.filter((n) => {
      if (currentFilter === 'OPEN') return n.valveStatus === 'OPEN';
      if (currentFilter === 'CLOSED') return n.valveStatus === 'CLOSED';
      return true;
    });

    el.techValveList.innerHTML = filtered.map((n) => {
      const isClosed = n.valveStatus === 'CLOSED';
      return `
        <div class="valve-row ${isClosed ? 'closed' : ''}" data-node-id="${n.id}">
          <div class="valve-row-info">
            <div class="valve-row-title">${n.code} · ${n.name}</div>
            <div class="valve-row-sub">${n.zone} · ${n.pressure.toFixed(1).replace('.', ',')} kPa</div>
          </div>
          <span class="valve-badge ${isClosed ? 'closed' : 'open'}">${isClosed ? 'Buka' : 'Tutup'}</span>
        </div>
      `;
    }).join('');

    el.techValveList.querySelectorAll('.valve-row').forEach((row) => {
      row.addEventListener('click', () => {
        const node = nodes.find((n) => n.id === row.getAttribute('data-node-id'));
        if (node) openValveControlModal(node);
      });
    });

    renderCustomers();
    renderTickets();
  }

  function init() {
    el.navBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    const btnSearch = document.getElementById('btnHeaderSearch');
    const searchBar = document.getElementById('headerSearchBar');
    const searchInput = document.getElementById('headerSearchInput');
    if (btnSearch && searchBar && searchInput) {
      btnSearch.addEventListener('click', () => {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) searchInput.focus();
      });
      searchInput.addEventListener('input', (e) => {
        custQuery = e.target.value;
        if (custQuery.trim()) switchTab('tab-pelanggan');
        renderCustomers();
      });
    }

    if (MBM.gis) {
      techMapCtrl = MBM.gis.createGisMap('techGisMap', {
        onNodeClick: (node) => openValveControlModal(node)
      });
    }

    let leakCircle = null;
    if (techMapCtrl && techMapCtrl.map && typeof L !== 'undefined') {
      leakCircle = L.circle([-1.21039, 116.94352], {
        radius: 90,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.22,
        weight: 2,
        dashArray: '4, 4'
      }).addTo(techMapCtrl.map).bindTooltip('Area Dugaan Kebocoran (18%) · Sekitar Node-03 Poros RT 23');
    }

    const leakBanner = document.getElementById('techLeakBanner');
    const btnFocusLeak = document.getElementById('btnFocusLeakMap');
    const btnClearLeak = document.getElementById('btnClearLeak');
    if (btnFocusLeak && techMapCtrl && techMapCtrl.map) {
      btnFocusLeak.addEventListener('click', () => {
        techMapCtrl.map.setView([-1.21039, 116.94352], 17, { animate: true });
        if (leakCircle) leakCircle.openTooltip();
      });
    }
    if (btnClearLeak && leakBanner) {
      btnClearLeak.addEventListener('click', () => {
        leakBanner.classList.add('hidden');
        if (leakCircle && techMapCtrl && techMapCtrl.map) {
          techMapCtrl.map.removeLayer(leakCircle);
        }
        showToast('Peringatan kebocoran ditandai aman');
      });
    }

    const setFilter = (mode, activeBtn) => {
      currentFilter = mode;
      [el.techFilterAll, el.techFilterOpen, el.techFilterClosed].forEach((b) => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
      refreshAll();
    };

    if (el.techFilterAll) el.techFilterAll.addEventListener('click', () => setFilter('ALL', el.techFilterAll));
    if (el.techFilterOpen) el.techFilterOpen.addEventListener('click', () => setFilter('OPEN', el.techFilterOpen));
    if (el.techFilterClosed) el.techFilterClosed.addEventListener('click', () => setFilter('CLOSED', el.techFilterClosed));

    if (el.btnEmergencyAllBranches) {
      el.btnEmergencyAllBranches.addEventListener('click', () => {
        MBM.data.emergencyCloseAllBranches();
        refreshAll();
        showToast('Seluruh katup cabang diisolasi darurat');
      });
    }

    if (el.btnRestoreAllBranches) {
      el.btnRestoreAllBranches.addEventListener('click', () => {
        MBM.data.restoreAllBranches();
        refreshAll();
        showToast('Seluruh katup jaringan dibuka kembali');
      });
    }

    if (el.btnDrainSiphon) {
      el.btnDrainSiphon.addEventListener('click', () => {
        const t = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        if (el.siphonStatusText) el.siphonStatusText.textContent = `Terakhir dikuras: Hari ini, ${t} WITA`;
        showToast('Log kuras siphon water-trap dicatat');
      });
    }

    if (el.custSearchInput) {
      el.custSearchInput.addEventListener('input', (e) => {
        custQuery = e.target.value;
        renderCustomers();
      });
    }

    el.custFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        custFilter = btn.getAttribute('data-cust-filter');
        el.custFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderCustomers();
      });
    });

    el.ticketFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        ticketFilter = btn.getAttribute('data-ticket-filter');
        el.ticketFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderTickets();
      });
    });

    if (el.btnCloseTechValveModal) el.btnCloseTechValveModal.addEventListener('click', () => el.techValveModal.classList.remove('active'));
    if (el.btnCancelTechValve) el.btnCancelTechValve.addEventListener('click', () => el.techValveModal.classList.remove('active'));
    if (el.techValveModal) {
      el.techValveModal.addEventListener('click', (e) => {
        if (e.target === el.techValveModal) el.techValveModal.classList.remove('active');
      });
    }

    if (el.btnToggleTechValve) {
      el.btnToggleTechValve.addEventListener('click', () => {
        if (!selectedNodeId) return;
        const node = MBM.data.getNodesGis().find((n) => n.id === selectedNodeId);
        if (!node) return;
        const nextStatus = node.valveStatus === 'CLOSED' ? 'OPEN' : 'CLOSED';
        MBM.data.setNodeValveStatus(selectedNodeId, nextStatus, el.techValveReason.value.trim());
        el.techValveModal.classList.remove('active');
        refreshAll();
        showToast(`${node.code} berhasil ${nextStatus === 'CLOSED' ? 'ditutup' : 'dibuka'}`);
      });
    }

    refreshAll();
    window.addEventListener('storage', refreshAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
