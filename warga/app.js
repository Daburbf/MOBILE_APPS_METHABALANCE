/**
 * METHABALANCE Warga — Frontend Controller
 * Warga hanya dapat memantau status & lokasi katup tertutup (read-only).
 */

(function () {
  'use strict';

  const MBM = window.MBM;
  if (!MBM || !MBM.data) return;

  let wargaMapCtrl = null;
  let currentFilter = 'ALL';

  const el = {
    navBtns: document.querySelectorAll('.nav-tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    hdrAccountId: document.getElementById('hdrAccountId'),
    btnOpenAccountModal: document.getElementById('btnOpenAccountModal'),
    accountModal: document.getElementById('accountModal'),
    btnCloseAccountModal: document.getElementById('btnCloseAccountModal'),
    btnSelectWarga: document.getElementById('btnSelectWarga'),
    btnSelectUmkm: document.getElementById('btnSelectUmkm'),

    // Beranda
    mainStatusBanner: document.getElementById('mainStatusBanner'),
    bannerTitle: document.getElementById('bannerTitle'),
    bannerDesc: document.getElementById('bannerDesc'),
    stoveStatusBadge: document.getElementById('stoveStatusBadge'),
    stoveStatusText: document.getElementById('stoveStatusText'),
    efficiencyBadge: document.getElementById('efficiencyBadge'),
    meterNumber: document.getElementById('meterNumber'),
    prevMonthUsage: document.getElementById('prevMonthUsage'),
    avgDailyUsage: document.getElementById('avgDailyUsage'),
    weeklySvgChart: document.getElementById('weeklySvgChart'),
    billingStatusText: document.getElementById('billingStatusText'),
    billingAmountText: document.getElementById('billingAmountText'),
    btnViewReceipt: document.getElementById('btnViewReceipt'),
    miniSavingsAmount: document.getElementById('miniSavingsAmount'),
    miniSavingsTubes: document.getElementById('miniSavingsTubes'),
    btnEmergencyShutoff: document.getElementById('btnEmergencyShutoff'),
    valveActionText: document.getElementById('valveActionText'),
    btnQuickReport: document.getElementById('btnQuickReport'),

    // Peta GIS (Read-Only)
    gisClosedBadge: document.getElementById('gisClosedBadge'),
    btnFilterAll: document.getElementById('btnFilterAll'),
    btnFilterOpen: document.getElementById('btnFilterOpen'),
    btnFilterClosed: document.getElementById('btnFilterClosed'),
    countOpenValves: document.getElementById('countOpenValves'),
    countClosedValves: document.getElementById('countClosedValves'),
    wargaValveList: document.getElementById('wargaValveList'),
    nodeDetailModal: document.getElementById('nodeDetailModal'),
    btnCloseNodeModal: document.getElementById('btnCloseNodeModal'),
    nodeModalTitle: document.getElementById('nodeModalTitle'),
    nodeModalBody: document.getElementById('nodeModalBody'),

    // Telemetri
    telemetryNodeTitle: document.getElementById('telemetryNodeTitle'),
    telemetryNodeSub: document.getElementById('telemetryNodeSub'),
    telemPressureVal: document.getElementById('telemPressureVal'),
    telemPressureBar: document.getElementById('telemPressureBar'),
    svgPressureCurve: document.getElementById('svgPressureCurve'),

    // Help Desk
    btnSegChat: document.getElementById('btnSegChat'),
    btnSegLapor: document.getElementById('btnSegLapor'),
    helpdeskChatView: document.getElementById('helpdeskChatView'),
    helpdeskLaporView: document.getElementById('helpdeskLaporView'),
    chatThread: document.getElementById('chatThread'),
    chatForm: document.getElementById('chatForm'),
    chatInput: document.getElementById('chatInput'),
    quickChips: document.querySelectorAll('.quick-chip'),
    helpStaffGrid: document.getElementById('helpStaffGrid'),
    btnOpenReportModal: document.getElementById('btnOpenReportModal'),
    reportModal: document.getElementById('reportModal'),
    btnCloseReportModal: document.getElementById('btnCloseReportModal'),
    incidentReportForm: document.getElementById('incidentReportForm'),
    formGeotagCoord: document.getElementById('formGeotagCoord'),
    reportCategorySelect: document.getElementById('reportCategorySelect'),
    reportLocationInput: document.getElementById('reportLocationInput'),
    reportDescTextarea: document.getElementById('reportDescTextarea'),
    reportsHistoryContainer: document.getElementById('reportsHistoryContainer'),

    // Profil
    profAvatarInitials: document.getElementById('profAvatarInitials'),
    profCustomerName: document.getElementById('profCustomerName'),
    profCustomerRole: document.getElementById('profCustomerRole'),
    profAddress: document.getElementById('profAddress'),
    profNodeSegment: document.getElementById('profNodeSegment'),
    profMeterSerial: document.getElementById('profMeterSerial'),
    profValveStatus: document.getElementById('profValveStatus'),
    prefNotifyCutoff: document.getElementById('prefNotifyCutoff'),
    prefNotifyDrain: document.getElementById('prefNotifyDrain'),
    prefNotifySavings: document.getElementById('prefNotifySavings'),

    // Local Valve Modal
    valveModal: document.getElementById('valveModal'),
    btnCloseValveModal: document.getElementById('btnCloseValveModal'),
    btnCancelValveAction: document.getElementById('btnCancelValveAction'),
    btnConfirmValveAction: document.getElementById('btnConfirmValveAction'),
    valveModalHeadText: document.getElementById('valveModalHeadText'),
    valveModalBodyText: document.getElementById('valveModalBodyText'),

    appToast: document.getElementById('appToast'),
    toastMessage: document.getElementById('toastMessage')
  };

  let toastTimer = null;
  function showToast(msg) {
    if (!el.appToast || !el.toastMessage) return;
    el.toastMessage.textContent = msg;
    el.appToast.classList.add('active');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.appToast.classList.remove('active'), 2800);
  }

  function bindModalClose(modal, closeBtn) {
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  }

  /* ==========================================================================
     TAB NAVIGATION
     ========================================================================== */
  function switchTab(tabId) {
    el.navBtns.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId));
    el.tabPanes.forEach((pane) => pane.classList.toggle('active', pane.id === tabId));
    if (tabId === 'tab-peta' && wargaMapCtrl) {
      wargaMapCtrl.invalidate();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initTabNavigation() {
    el.navBtns.forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
    const hdrProfBtn = document.getElementById('btnHeaderProfile');
    if (hdrProfBtn) {
      hdrProfBtn.addEventListener('click', () => switchTab('tab-profil'));
    }

    const btnSearch = document.getElementById('btnHeaderSearch');
    const searchBar = document.getElementById('headerSearchBar');
    const searchInput = document.getElementById('headerSearchInput');
    if (btnSearch && searchBar && searchInput) {
      btnSearch.addEventListener('click', () => {
        searchBar.classList.toggle('active');
        if (searchBar.classList.contains('active')) searchInput.focus();
      });
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (q) switchTab('tab-peta');
        if (el.wargaValveList) {
          el.wargaValveList.querySelectorAll('.valve-row').forEach((row) => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? 'flex' : 'none';
          });
        }
      });
    }
  }

  /* ==========================================================================
     ACCOUNT SWITCHER
     ========================================================================== */
  function updateOptionSelection(btn, isSelected) {
    if (!btn) return;
    btn.classList.toggle('selected', isSelected);
    const tag = btn.querySelector('.option-tag');
    if (tag) {
      tag.className = isSelected ? 'option-tag active' : 'option-tag';
      tag.textContent = isSelected ? 'Aktif' : 'Pilih';
    }
  }

  function updateAccountUI() {
    const account = MBM.data.getActiveAccount();
    const isWarga = account.key === 'warga';

    if (el.hdrAccountId) el.hdrAccountId.textContent = account.id;
    updateOptionSelection(el.btnSelectWarga, isWarga);
    updateOptionSelection(el.btnSelectUmkm, !isWarga);

    if (el.meterNumber) el.meterNumber.textContent = account.currentMonthUsage.toFixed(1).replace('.', ',');
    if (el.prevMonthUsage) el.prevMonthUsage.textContent = account.previousMonthUsage.toFixed(1).replace('.', ',') + ' m³';

    const pctDiff = (((account.previousMonthUsage - account.currentMonthUsage) / account.previousMonthUsage) * 100).toFixed(1).replace('.', ',');
    if (el.efficiencyBadge) el.efficiencyBadge.textContent = `-${pctDiff}% vs bln lalu`;

    const totalWeekly = account.weeklyUsage.reduce((s, d) => s + d.val, 0);
    if (el.avgDailyUsage) el.avgDailyUsage.textContent = (totalWeekly / account.weeklyUsage.length).toFixed(1).replace('.', ',') + ' m³/hr';

    if (el.billingAmountText) el.billingAmountText.textContent = MBM.data.formatRupiah(account.monthlyBilling);
    if (el.billingStatusText) el.billingStatusText.textContent = account.billingStatus;
    if (el.miniSavingsAmount) el.miniSavingsAmount.textContent = MBM.data.formatRupiah(account.monthlyLpgSavings);
    if (el.miniSavingsTubes) {
      el.miniSavingsTubes.textContent = `${account.lpgTubesEquivalent} tabung 3kg · -${account.carbonOffsetKg.toFixed(1).replace('.', ',')} kg CO₂e`;
    }

    if (el.telemetryNodeTitle) el.telemetryNodeTitle.textContent = account.nodeSegment;
    if (el.formGeotagCoord) el.formGeotagCoord.textContent = `${account.coordinates} · ${isWarga ? 'RT 23' : 'RT 22 UMKM'}`;
    if (el.reportLocationInput) el.reportLocationInput.value = account.address;

    if (el.profCustomerName) el.profCustomerName.textContent = account.customerName;
    if (el.profCustomerRole) el.profCustomerRole.textContent = `${account.type} · ${account.id}`;
    if (el.profAddress) el.profAddress.textContent = account.address;
    if (el.profNodeSegment) el.profNodeSegment.textContent = account.nodeSegment;
    if (el.profMeterSerial) el.profMeterSerial.textContent = account.meterSerial;

    if (el.profAvatarInitials) {
      const parts = account.customerName.replace(/Ibu|Bpk\./g, '').trim().split(' ');
      el.profAvatarInitials.textContent = ((parts[0] ? parts[0][0] : 'S') + (parts[1] ? parts[1][0] : 'A')).toUpperCase();
    }

    renderWeeklyChart(account.weeklyUsage);
    syncNetworkAndValveUI();
  }

  function initAccountSwitcher() {
    if (el.btnOpenAccountModal) el.btnOpenAccountModal.addEventListener('click', () => el.accountModal.classList.add('active'));
    bindModalClose(el.accountModal, el.btnCloseAccountModal);

    if (el.btnSelectWarga) {
      el.btnSelectWarga.addEventListener('click', () => {
        MBM.data.setActiveAccountKey('warga');
        updateAccountUI();
        el.accountModal.classList.remove('active');
        showToast('Akun: Ibu Siti Aminah');
      });
    }

    if (el.btnSelectUmkm) {
      el.btnSelectUmkm.addEventListener('click', () => {
        MBM.data.setActiveAccountKey('umkm');
        updateAccountUI();
        el.accountModal.classList.remove('active');
        showToast('Akun: Tahu & Tempe Manggar');
      });
    }
  }

  /* ==========================================================================
     READ-ONLY GIS MAP & VALVE STATUS SYNC (WARGA)
     ========================================================================== */
  function openNodeReadOnlyModal(node) {
    if (!el.nodeDetailModal || !el.nodeModalBody) return;
    const isClosed = node.valveStatus === 'CLOSED';
    el.nodeModalTitle.textContent = `${node.code} · ${node.name}`;
    el.nodeModalBody.innerHTML = `
      <div class="kv-row">
        <span class="kv-key">Status Katup</span>
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
      ${isClosed && node.reasonClosed ? `
      <div class="kv-row">
        <span class="kv-key">Keterangan</span>
        <span class="kv-val" style="color:var(--danger);">${node.reasonClosed}</span>
      </div>` : ''}
      <div class="kv-row">
        <span class="kv-key">Diperbarui</span>
        <span class="kv-val">${node.updatedAt}</span>
      </div>
    `;
    el.nodeDetailModal.classList.add('active');
  }

  function renderWargaValveList() {
    if (!el.wargaValveList) return;
    const nodes = MBM.data.getNodesGis();
    const filtered = nodes.filter((n) => {
      if (currentFilter === 'OPEN') return n.valveStatus === 'OPEN';
      if (currentFilter === 'CLOSED') return n.valveStatus === 'CLOSED';
      return true;
    });

    el.wargaValveList.innerHTML = filtered.map((n) => {
      const isClosed = n.valveStatus === 'CLOSED';
      return `
        <div class="valve-row ${isClosed ? 'closed' : ''}" data-node-id="${n.id}">
          <div class="valve-row-info">
            <div class="valve-row-title">${n.code} · ${n.name}</div>
            <div class="valve-row-sub">${n.zone} · ${n.pressure.toFixed(1).replace('.', ',')} kPa</div>
          </div>
          <span class="valve-badge ${isClosed ? 'closed' : 'open'}">${isClosed ? 'Tertutup' : 'Terbuka'}</span>
        </div>
      `;
    }).join('');

    el.wargaValveList.querySelectorAll('.valve-row').forEach((row) => {
      row.addEventListener('click', () => {
        const node = nodes.find((n) => n.id === row.getAttribute('data-node-id'));
        if (node) openNodeReadOnlyModal(node);
      });
    });
  }

  function syncNetworkAndValveUI() {
    const nodes = MBM.data.getNodesGis();
    const openCount = nodes.filter((n) => n.valveStatus === 'OPEN').length;
    const closedCount = nodes.filter((n) => n.valveStatus === 'CLOSED').length;

    const account = MBM.data.getActiveAccount();
    const myNode = nodes.find((n) => n.id === account.nodeId) || nodes[0];
    const isMyNodeClosed = myNode && myNode.valveStatus === 'CLOSED';
    const isUserValveClosed = MBM.data.isUserValveClosed();

    if (el.btnFilterAll) el.btnFilterAll.textContent = `Semua (${nodes.length})`;
    if (el.countOpenValves) el.countOpenValves.textContent = openCount;
    if (el.countClosedValves) el.countClosedValves.textContent = closedCount;
    if (el.gisClosedBadge) {
      el.gisClosedBadge.textContent = `${closedCount} Tertutup`;
      el.gisClosedBadge.className = closedCount > 0 ? 'status-chip danger' : 'status-chip';
    }

    if (el.mainStatusBanner) {
      el.mainStatusBanner.className = isMyNodeClosed ? 'status-strip isolated' : 'status-strip normal';
    }
    if (el.bannerTitle) {
      el.bannerTitle.textContent = isMyNodeClosed ? 'Katup Sektor Anda Tertutup' : 'Aliran Gas Normal';
    }
    if (el.bannerDesc) {
      el.bannerDesc.textContent = isMyNodeClosed
        ? `${myNode.code} sedang ditutup · Cek Peta GIS`
        : `4,2 kPa · CH₄ 56,4% · ${closedCount} katup sektor lain tertutup`;
    }

    if (el.stoveStatusBadge && el.stoveStatusText) {
      if (isMyNodeClosed) {
        el.stoveStatusBadge.className = 'status-chip danger';
        el.stoveStatusText.textContent = 'Sektor Tertutup';
      } else if (isUserValveClosed) {
        el.stoveStatusBadge.className = 'status-chip warning';
        el.stoveStatusText.textContent = 'Katup Terkunci';
      } else {
        el.stoveStatusBadge.className = 'status-chip';
        el.stoveStatusText.textContent = 'Kompor Aktif';
      }
    }

    if (el.telemPressureVal) el.telemPressureVal.textContent = isMyNodeClosed ? '0,0' : '4,2';
    const arcPressure = document.getElementById('arcPressure');
    if (arcPressure) arcPressure.setAttribute('stroke-dashoffset', isMyNodeClosed ? '138.23' : '30.4');
    if (el.telemPressureBar) {
      el.telemPressureBar.textContent = isMyNodeClosed ? 'Terisolasi' : 'Kondisi Prima';
    }

    if (el.profValveStatus) {
      if (isMyNodeClosed) {
        el.profValveStatus.textContent = 'Tertutup (Sektor)';
        el.profValveStatus.style.color = 'var(--danger)';
      } else if (isUserValveClosed) {
        el.profValveStatus.textContent = 'Terkunci Manual';
        el.profValveStatus.style.color = 'var(--warning)';
      } else {
        el.profValveStatus.textContent = 'Terbuka (Normal)';
        el.profValveStatus.style.color = 'var(--emerald-deep)';
      }
    }

    if (el.btnEmergencyShutoff && el.valveActionText) {
      el.btnEmergencyShutoff.className = isUserValveClosed
        ? 'action-btn action-btn-reopen'
        : 'action-btn action-btn-danger';
      el.valveActionText.textContent = isUserValveClosed ? 'Buka Katup Rumah' : 'Tutup Katup Rumah';
    }

    if (wargaMapCtrl) wargaMapCtrl.refreshMarkers(currentFilter);
    renderWargaValveList();
  }

  function initGisTab() {
    if (MBM.gis) {
      wargaMapCtrl = MBM.gis.createGisMap('gisMapLeaflet', {
        onNodeClick: (node) => openNodeReadOnlyModal(node)
      });
    }
    bindModalClose(el.nodeDetailModal, el.btnCloseNodeModal);

    const setFilter = (mode, activeBtn) => {
      currentFilter = mode;
      [el.btnFilterAll, el.btnFilterOpen, el.btnFilterClosed].forEach((b) => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
      if (wargaMapCtrl) wargaMapCtrl.refreshMarkers(mode);
      renderWargaValveList();
    };

    if (el.btnFilterAll) el.btnFilterAll.addEventListener('click', () => setFilter('ALL', el.btnFilterAll));
    if (el.btnFilterOpen) el.btnFilterOpen.addEventListener('click', () => setFilter('OPEN', el.btnFilterOpen));
    if (el.btnFilterClosed) el.btnFilterClosed.addEventListener('click', () => setFilter('CLOSED', el.btnFilterClosed));
  }

  /* ==========================================================================
     LOCAL VALVE & RECEIPT
     ========================================================================== */
  function initValveControls() {
    if (el.btnEmergencyShutoff) {
      el.btnEmergencyShutoff.addEventListener('click', () => {
        const isClosed = MBM.data.isUserValveClosed();
        el.valveModalHeadText.textContent = isClosed ? 'Buka Katup Rumah' : 'Tutup Katup Rumah';
        el.valveModalBodyText.textContent = isClosed
          ? 'Aliran biogas ke kompor rumah Anda akan dibuka kembali.'
          : 'Aliran biogas ke kompor rumah Anda akan dikunci sementara.';
        el.btnConfirmValveAction.textContent = isClosed ? 'Ya, Buka' : 'Ya, Tutup';
        el.btnConfirmValveAction.className = isClosed ? 'btn-primary' : 'btn-primary btn-danger';
        el.valveModal.classList.add('active');
      });
    }

    bindModalClose(el.valveModal, el.btnCloseValveModal);
    if (el.btnCancelValveAction) el.btnCancelValveAction.addEventListener('click', () => el.valveModal.classList.remove('active'));

    if (el.btnConfirmValveAction) {
      el.btnConfirmValveAction.addEventListener('click', () => {
        const nextClosed = !MBM.data.isUserValveClosed();
        MBM.data.setUserValveClosed(nextClosed);
        syncNetworkAndValveUI();
        el.valveModal.classList.remove('active');
        showToast(nextClosed ? 'Katup rumah dikunci' : 'Katup rumah dibuka');
      });
    }

    if (el.btnQuickReport) {
      el.btnQuickReport.addEventListener('click', () => {
        switchTab('tab-helpdesk');
        setHelpdeskSegment('lapor');
        el.reportModal.classList.add('active');
      });
    }

    if (el.btnViewReceipt) {
      el.btnViewReceipt.addEventListener('click', () => {
        const account = MBM.data.getActiveAccount();
        showToast(`Lunas: ${MBM.data.formatRupiah(account.monthlyBilling)} (${account.billingPeriod})`);
      });
    }
  }

  /* ==========================================================================
     CHARTS
     ========================================================================== */
  function renderWeeklyChart(weeklyData) {
    if (!el.weeklySvgChart || !weeklyData || !weeklyData.length) return;
    const w = 340, h = 90, padX = 14, padTop = 10, padBot = 20, plotH = h - padTop - padBot;
    const vals = weeklyData.map((d) => d.val);
    const minVal = Math.min(...vals) * 0.88;
    const maxVal = Math.max(...vals) * 1.1;
    const range = maxVal - minVal || 1;

    const pts = weeklyData.map((d, i) => ({
      x: padX + (i / (weeklyData.length - 1)) * (w - padX * 2),
      y: padTop + plotH - ((d.val - minVal) / range) * plotH,
      day: d.day
    }));

    let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      linePath += ` C ${cx.toFixed(1)} ${pts[i - 1].y.toFixed(1)}, ${cx.toFixed(1)} ${pts[i].y.toFixed(1)}, ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    const baseY = padTop + plotH;
    const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;

    let svg = `
      <defs>
        <linearGradient id="weeklyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#weeklyFill)"/>
      <path d="${linePath}" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
    `;

    pts.forEach((p, idx) => {
      const isLast = idx === pts.length - 1;
      svg += `<text x="${p.x.toFixed(1)}" y="${h - 4}" text-anchor="middle" font-size="9" fill="${isLast ? '#059669' : '#94a3b8'}" font-weight="${isLast ? '700' : '500'}">${p.day}</text>`;
      if (isLast) svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#059669" stroke="#ffffff" stroke-width="1.5"/>`;
    });

    el.weeklySvgChart.innerHTML = svg;
  }

  function renderPressureCurve() {
    if (!el.svgPressureCurve) return;
    const curveData = MBM.data.PRESSURE_HOURLY_CURVE;
    const w = 360, h = 115, padL = 28, padR = 12, padT = 12, padB = 22;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const getX = (i) => padL + (i / (curveData.length - 1)) * plotW;
    const getY = (p) => padT + plotH - ((p - 2.0) / 3.5) * plotH;

    let svg = '';
    [3.0, 4.0, 5.0].forEach((val) => {
      const y = getY(val);
      svg += `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
      svg += `<text x="${padL - 5}" y="${y + 3}" text-anchor="end" font-size="9" fill="#94a3b8">${val.toFixed(0)}</text>`;
    });

    let linePath = `M ${getX(0).toFixed(1)} ${getY(curveData[0].pressure).toFixed(1)}`;
    for (let i = 1; i < curveData.length; i++) {
      const cx = (getX(i - 1) + getX(i)) / 2;
      linePath += ` C ${cx.toFixed(1)} ${getY(curveData[i - 1].pressure).toFixed(1)}, ${cx.toFixed(1)} ${getY(curveData[i].pressure).toFixed(1)}, ${getX(i).toFixed(1)} ${getY(curveData[i].pressure).toFixed(1)}`;
    }
    const baseY = padT + plotH;
    const areaPath = `${linePath} L ${getX(curveData.length - 1).toFixed(1)} ${baseY} L ${getX(0).toFixed(1)} ${baseY} Z`;

    svg += `
      <defs>
        <linearGradient id="pressureFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#pressureFill)"/>
      <path d="${linePath}" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
    `;

    ['00:00', '06:30', '12:00', '17:30', '23:00'].forEach((hr) => {
      const idx = curveData.findIndex((d) => d.hour === hr);
      if (idx !== -1) svg += `<text x="${getX(idx).toFixed(1)}" y="${h - 5}" text-anchor="middle" font-size="9" fill="#94a3b8">${hr}</text>`;
    });

    el.svgPressureCurve.innerHTML = svg;
  }

  /* ==========================================================================
     HELP DESK (CHAT & LAPOR)
     ========================================================================== */
  function setHelpdeskSegment(mode) {
    const isChat = mode === 'chat';
    if (el.btnSegChat) el.btnSegChat.classList.toggle('active', isChat);
    if (el.btnSegLapor) el.btnSegLapor.classList.toggle('active', !isChat);
    if (el.helpdeskChatView) el.helpdeskChatView.classList.toggle('active', isChat);
    if (el.helpdeskLaporView) el.helpdeskLaporView.classList.toggle('active', !isChat);
  }

  function renderChatThread() {
    if (!el.chatThread) return;
    const msgs = MBM.data.getChatMessages();
    el.chatThread.innerHTML = msgs.map((m) => `
      <div class="chat-bubble ${m.sender === 'user' ? 'user' : 'posko'}">
        <span>${m.text}</span>
        <span class="chat-time">${m.time}</span>
      </div>
    `).join('');
    el.chatThread.scrollTop = el.chatThread.scrollHeight;
  }

  function sendChatMsg(text) {
    if (!text.trim()) return;
    MBM.data.addChatMessage('user', text.trim());
    renderChatThread();
    setTimeout(() => {
      MBM.data.addChatMessage('posko', 'Terima kasih, pesan Anda sudah diterima Posko TPAS Manggar dan diteruskan ke teknisi sektor.');
      renderChatThread();
    }, 450);
  }

  function renderStaffGrid() {
    if (!el.helpStaffGrid) return;
    el.helpStaffGrid.innerHTML = MBM.data.HELP_STAFF.slice(0, 2).map((s) => `
      <a class="contact-tile" href="tel:${s.phone.replace(/[^0-9]/g, '')}">
        <span class="contact-role">${s.role}</span>
        <span class="contact-name">${s.name}</span>
        <span class="contact-phone">${s.phone}</span>
      </a>
    `).join('');
  }

  function renderReportsHistory() {
    if (!el.reportsHistoryContainer) return;
    const reports = MBM.data.getReports();
    el.reportsHistoryContainer.innerHTML = reports.map((r) => {
      const isPending = r.status !== 'Selesai';
      return `
        <div class="report-item">
          <div class="report-item-top">
            <span class="report-item-cat">${r.category}</span>
            <span class="report-status-tag ${isPending ? 'pending' : ''}">${r.status}</span>
          </div>
          <div class="report-item-meta">${r.id} &middot; ${r.timestamp}</div>
        </div>
      `;
    }).join('');
  }

  function initHelpdesk() {
    if (el.btnSegChat) el.btnSegChat.addEventListener('click', () => setHelpdeskSegment('chat'));
    if (el.btnSegLapor) el.btnSegLapor.addEventListener('click', () => setHelpdeskSegment('lapor'));

    if (el.chatForm) {
      el.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendChatMsg(el.chatInput.value);
        el.chatInput.value = '';
      });
    }

    el.quickChips.forEach((chip) => {
      chip.addEventListener('click', () => sendChatMsg(chip.getAttribute('data-msg')));
    });

    if (el.btnOpenReportModal) el.btnOpenReportModal.addEventListener('click', () => el.reportModal.classList.add('active'));
    bindModalClose(el.reportModal, el.btnCloseReportModal);

    if (el.incidentReportForm) {
      el.incidentReportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = el.reportDescTextarea.value.trim();
        if (!desc) return;
        const entry = MBM.data.addReport({
          category: el.reportCategorySelect.value,
          location: el.reportLocationInput.value.trim(),
          description: desc
        });
        renderReportsHistory();
        el.reportDescTextarea.value = '';
        el.reportModal.classList.remove('active');
        showToast(`Laporan ${entry.id} terkirim`);
      });
    }

    renderChatThread();
    renderStaffGrid();
    renderReportsHistory();
  }

  function initPreferences() {
    const prefs = MBM.data.getPreferences();
    [['prefNotifyCutoff', 'notifyCutoff'], ['prefNotifyDrain', 'notifyDrain'], ['prefNotifySavings', 'notifySavings']].forEach(([elKey, prefKey]) => {
      if (el[elKey]) {
        el[elKey].checked = prefs[prefKey];
        el[elKey].addEventListener('change', (e) => {
          MBM.data.setPreference(prefKey, e.target.checked);
          showToast('Pengaturan disimpan');
        });
      }
    });
  }

  function init() {
    initTabNavigation();
    initAccountSwitcher();
    initGisTab();
    initValveControls();
    initHelpdesk();
    initPreferences();

    updateAccountUI();
    renderPressureCurve();

    window.addEventListener('storage', () => {
      syncNetworkAndValveUI();
      renderChatThread();
      renderReportsHistory();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
