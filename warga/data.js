/**
 * METHABALANCE Mobile — Shared Frontend Data & State (Warga & Teknisi)
 * Persisted in localStorage so Teknisi valve actions sync with Warga view.
 */

window.MBM = window.MBM || {};

(function (MBM) {
  'use strict';

  const STORAGE_KEY_VALVES = 'mbm_valve_states_v1';
  const STORAGE_KEY_REPORTS = 'mbm_reports_v1';
  const STORAGE_KEY_CHAT = 'mbm_helpdesk_chat_v1';

  const ACCOUNTS = {
    warga: {
      key: 'warga',
      type: 'Rumah Tangga',
      roleBadge: 'Warga RT 23',
      id: 'SR-0142',
      customerName: 'Ibu Siti Aminah',
      phone: '0812-5814-9921',
      address: 'Jl. Mulawarman Gang TPA Manggar RT 23 No. 14',
      coordinates: '-1.2152° S, 116.9304° E',
      nodeSegment: 'Jalur Node-03 Poros RT 23',
      nodeId: 'MB-HD-02',
      meterSerial: 'MTR-MGR-SR-0142-AW',
      currentMonthUsage: 18.4,
      previousMonthUsage: 19.1,
      monthlyBilling: 10000,
      billingPeriod: 'November 2026',
      billingStatus: 'Lunas',
      monthlyLpgSavings: 80000,
      lpgTubesEquivalent: 4,
      carbonOffsetKg: 14.2,
      weeklyUsage: [
        { day: 'Sen', val: 2.4 },
        { day: 'Sel', val: 2.8 },
        { day: 'Rab', val: 2.5 },
        { day: 'Kam', val: 2.7 },
        { day: 'Jum', val: 2.3 },
        { day: 'Sab', val: 3.1 },
        { day: 'Min', val: 2.6 }
      ]
    },
    umkm: {
      key: 'umkm',
      type: 'UMKM',
      roleBadge: 'UMKM Klaster C',
      id: 'UMKM-008',
      customerName: 'Bpk. Sukirman (Tahu & Tempe)',
      phone: '0813-4720-3345',
      address: 'Jl. TPAS Manggar KM 12 RT 22 No. 08',
      coordinates: '-1.2140° S, 116.9315° E',
      nodeSegment: 'Jalur Node-02 Gang Swadaya',
      nodeId: 'MB-HD-01',
      meterSerial: 'MTR-MGR-UMKM-008-AW',
      currentMonthUsage: 94.2,
      previousMonthUsage: 96.5,
      monthlyBilling: 25000,
      billingPeriod: 'November 2026',
      billingStatus: 'Lunas',
      monthlyLpgSavings: 420000,
      lpgTubesEquivalent: 21,
      carbonOffsetKg: 72.8,
      weeklyUsage: [
        { day: 'Sen', val: 13.2 },
        { day: 'Sel', val: 14.5 },
        { day: 'Rab', val: 13.8 },
        { day: 'Kam', val: 14.1 },
        { day: 'Jum', val: 12.9 },
        { day: 'Sab', val: 15.2 },
        { day: 'Min', val: 10.5 }
      ]
    }
  };

  const PRESSURE_HOURLY_CURVE = [
    { hour: '00:00', pressure: 4.6 },
    { hour: '02:00', pressure: 4.7 },
    { hour: '04:00', pressure: 4.5 },
    { hour: '05:30', pressure: 3.8 },
    { hour: '06:30', pressure: 3.4 },
    { hour: '08:00', pressure: 4.0 },
    { hour: '10:00', pressure: 4.4 },
    { hour: '12:00', pressure: 3.9 },
    { hour: '14:00', pressure: 4.3 },
    { hour: '16:00', pressure: 4.2 },
    { hour: '17:30', pressure: 3.5 },
    { hour: '19:00', pressure: 3.7 },
    { hour: '21:00', pressure: 4.4 },
    { hour: '23:00', pressure: 4.6 }
  ];

  // Exact GIS Topology from WEB_METHABALANCE (gis_topology_data.json)
  const PIPELINE_TOPOLOGY = {
    trunkCoords: [
      [-1.211254, 116.93679], [-1.2111, 116.93705], [-1.21075, 116.9374],
      [-1.21035, 116.93775], [-1.20995, 116.9381], [-1.2094, 116.93845],
      [-1.208884, 116.938774], [-1.208388, 116.93886], [-1.208388, 116.93886],
      [-1.208393, 116.939021], [-1.208382, 116.939174], [-1.208354, 116.939379],
      [-1.20846, 116.94052], [-1.208564, 116.940694], [-1.208646, 116.940938],
      [-1.208731, 116.941355], [-1.208775, 116.941455], [-1.209029, 116.941816],
      [-1.209273, 116.942081], [-1.209416, 116.942158], [-1.210076, 116.942316],
      [-1.210163, 116.942383], [-1.210302, 116.942537], [-1.210369, 116.942755],
      [-1.210397, 116.942898], [-1.210424, 116.943191]
    ],
    branches: [
      {
        name: 'Distribusi Zona 1: Gang Swadaya Pemukiman Utara (32 SR)',
        nodeId: 'MB-HD-01',
        coords: [
          [-1.20846, 116.94052], [-1.208203, 116.940579], [-1.207991, 116.940636],
          [-1.207839, 116.940654], [-1.207689, 116.940651], [-1.207508, 116.940644],
          [-1.207236, 116.940667], [-1.206981, 116.940718], [-1.206903, 116.940736],
          [-1.206724, 116.940775], [-1.206551, 116.94083], [-1.206497, 116.940877],
          [-1.206453, 116.940952], [-1.206437, 116.941031], [-1.206434, 116.941093],
          [-1.206419, 116.941135], [-1.206401, 116.941156], [-1.206323, 116.941203],
          [-1.206217, 116.941273], [-1.206116, 116.941359], [-1.206056, 116.941415],
          [-1.206017, 116.941498], [-1.206006, 116.94157], [-1.205998, 116.94167],
          [-1.205953, 116.941745], [-1.205872, 116.94178], [-1.205758, 116.941793],
          [-1.205703, 116.941818], [-1.205654, 116.94186], [-1.205614, 116.941895],
          [-1.205526, 116.941891], [-1.205348, 116.941823]
        ]
      },
      {
        name: 'Distribusi Zona 2: Poros Utama Pemukiman RT 36 Manggar (45 SR)',
        nodeId: 'MB-HD-02',
        coords: [
          [-1.210391, 116.943523], [-1.21055, 116.943596], [-1.210684, 116.943646],
          [-1.2108, 116.943637], [-1.211032, 116.943624], [-1.211177, 116.943591],
          [-1.211332, 116.943516], [-1.211442, 116.943466], [-1.211579, 116.943425],
          [-1.211654, 116.943444], [-1.211796, 116.943519], [-1.21207, 116.943726],
          [-1.212322, 116.943881], [-1.21252, 116.943994], [-1.212611, 116.944053],
          [-1.212705, 116.944088], [-1.212788, 116.944098], [-1.212887, 116.944082],
          [-1.212932, 116.944067], [-1.212982, 116.944053], [-1.213035, 116.944039],
          [-1.213075, 116.944023], [-1.213132, 116.943999], [-1.213209, 116.943984],
          [-1.213274, 116.943979], [-1.213341, 116.943969], [-1.213418, 116.943958],
          [-1.213479, 116.943946], [-1.213518, 116.94394], [-1.213564, 116.943932],
          [-1.213609, 116.943935], [-1.213666, 116.943935], [-1.213708, 116.943939],
          [-1.213775, 116.943943], [-1.213838, 116.943948], [-1.2139, 116.943954]
        ]
      },
      {
        name: 'Distribusi Zona 3: Gang Padaidi & Permukiman Timur (28 SR)',
        nodeId: 'MB-HD-03',
        coords: [
          [-1.209273, 116.942081], [-1.208774, 116.942189], [-1.208385, 116.942318],
          [-1.208047, 116.942442], [-1.207827, 116.942521], [-1.207603, 116.942592],
          [-1.207032, 116.942737], [-1.206689, 116.942835]
        ]
      },
      {
        name: 'Distribusi Zona 4: Kluster Pemukiman Sisi Selatan TPA (35 SR)',
        nodeId: 'MB-HD-04',
        coords: [
          [-1.210424, 116.943191], [-1.210789, 116.942629], [-1.211095, 116.942206],
          [-1.211241, 116.942076], [-1.211386, 116.941976], [-1.211571, 116.941843],
          [-1.21159, 116.941814], [-1.211639, 116.941739], [-1.211968, 116.941045],
          [-1.211993, 116.94093], [-1.211969, 116.940883], [-1.211825, 116.940738],
          [-1.211718, 116.940614], [-1.211678, 116.940501], [-1.21169, 116.940404],
          [-1.211721, 116.940372], [-1.211827, 116.940347]
        ]
      }
    ]
  };

  // Exact 5 Motorized Valve Nodes from WEB_METHABALANCE
  const DEFAULT_NODES_GIS = [
    {
      id: 'MB-HU-01',
      code: 'Node-01',
      name: 'Stasiun Ekstraksi Utama TPA',
      type: 'Hulu (Upstream)',
      zone: 'Zona Ekstraksi Landfill',
      lat: -1.211254,
      lng: 116.93679,
      valveModel: 'Ball Valve SS304 NC 3"',
      valveStatus: 'OPEN',
      pressure: 4.8,
      flow: 124.5,
      ch4: 58.2,
      affectedSectors: 'Seluruh Jaringan (380 SR + 29 UMKM)',
      reasonClosed: null,
      updatedAt: '14 Nov 2026, 13:45 WITA'
    },
    {
      id: 'MB-HD-01',
      code: 'Node-02',
      name: 'Header Transmisi Gang Swadaya RT 22',
      type: 'Transmisi Hilir',
      zone: 'Zona 1 (Gang Swadaya RT 22)',
      lat: -1.20846,
      lng: 116.94052,
      valveModel: 'Ball Valve SS304 NC',
      valveStatus: 'OPEN',
      pressure: 4.5,
      flow: 32.1,
      ch4: 57.4,
      affectedSectors: '98 Sambungan Rumah RT 22',
      reasonClosed: null,
      updatedAt: '14 Nov 2026, 13:45 WITA'
    },
    {
      id: 'MB-HD-02',
      code: 'Node-03',
      name: 'Katup Distribusi Poros RT 23',
      type: 'Distribusi Sektor',
      zone: 'Zona 2 (Poros RT 23 Manggar)',
      lat: -1.21039,
      lng: 116.94352,
      valveModel: 'Ball Valve SS304 NC (Fail-Safe)',
      valveStatus: 'CLOSED',
      pressure: 0.0,
      flow: 0.0,
      ch4: 0.0,
      affectedSectors: '95 Sambungan Rumah RT 23',
      reasonClosed: 'Pemeliharaan pipa cabang RT 23 oleh Regu Siaga DLH.',
      updatedAt: '14 Nov 2026, 14:30 WITA'
    },
    {
      id: 'MB-HD-03',
      code: 'Node-04',
      name: 'Katup Distribusi Gang Padaidi RT 24',
      type: 'Distribusi Sektor & UMKM',
      zone: 'Zona 3 (Gang Padaidi Timur)',
      lat: -1.20927,
      lng: 116.94208,
      valveModel: 'Ball Valve SS304 NC',
      valveStatus: 'CLOSED',
      pressure: 0.0,
      flow: 0.0,
      ch4: 0.0,
      affectedSectors: '92 SR RT 24 & Sentra UMKM',
      reasonClosed: 'Penggantian gasket flange pipa inlet sentra UMKM RT 24.',
      updatedAt: '14 Nov 2026, 14:30 WITA'
    },
    {
      id: 'MB-HD-04',
      code: 'Node-05',
      name: 'Ujung Distribusi Kluster Selatan RT 25',
      type: 'Distribusi Ujung',
      zone: 'Zona 4 (Kluster Selatan RT 25)',
      lat: -1.21042,
      lng: 116.94319,
      valveModel: 'Ball Valve SS304 NC',
      valveStatus: 'OPEN',
      pressure: 4.1,
      flow: 26.5,
      ch4: 55.9,
      affectedSectors: '95 Sambungan Rumah RT 25',
      reasonClosed: null,
      updatedAt: '14 Nov 2026, 13:45 WITA'
    }
  ];

  const HELP_STAFF = [
    {
      id: 'st-01',
      name: 'Bpk. Bambang Sutrisno',
      role: 'Koordinator Lapangan RT 23',
      phone: '0812-5489-2210',
      status: 'Bertugas'
    },
    {
      id: 'st-02',
      name: 'Bpk. Agus Priyanto',
      role: 'Teknisi Katup & Pipa DLH',
      phone: '0821-4876-3391',
      status: 'Siaga'
    },
    {
      id: 'st-03',
      name: 'Posko TPAS Manggar',
      role: 'SCADA & Layanan 24 Jam',
      phone: '0542-745812',
      status: 'Online'
    }
  ];

  const DEFAULT_REPORTS = [
    {
      id: 'TKT-2611-04',
      category: 'Tekanan Gas Melemah',
      location: 'Jl. Mulawarman Gang TPA Manggar RT 23',
      description: 'Nyala api kompor sempat mengecil saat jam masak pagi.',
      status: 'Diproses',
      timestamp: '14 Nov 2026, 07:15'
    },
    {
      id: 'TKT-2611-01',
      category: 'Kuras Water-Trap',
      location: 'Simpang Node-03 Poros RT 23',
      description: 'Kondensat air sudah dikuras oleh teknisi.',
      status: 'Selesai',
      timestamp: '10 Nov 2026, 10:20'
    }
  ];

  const DEFAULT_CHAT = [
    {
      sender: 'posko',
      text: 'Halo, Posko Siaga TPAS Manggar siap membantu. Ada kendala aliran gas atau katup?',
      time: '14:00'
    }
  ];

  let activeAccountKey = 'warga';
  let userValveClosed = false;
  let preferences = {
    notifyCutoff: true,
    notifyDrain: true,
    notifySavings: true
  };

  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  function getNodesGis() {
    const saved = readStorage(STORAGE_KEY_VALVES, {});
    return DEFAULT_NODES_GIS.map((node) => {
      const override = saved[node.id];
      if (!override) return Object.assign({}, node);
      return Object.assign({}, node, override);
    });
  }

  function setNodeValveStatus(nodeId, nextStatus, reason) {
    const saved = readStorage(STORAGE_KEY_VALVES, {});
    const base = DEFAULT_NODES_GIS.find((n) => n.id === nodeId);
    if (!base) return null;

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';
    const isClosed = nextStatus === 'CLOSED';

    saved[nodeId] = {
      valveStatus: nextStatus,
      pressure: isClosed ? 0.0 : (base.pressure || 4.2),
      flow: isClosed ? 0.0 : (base.flow || 28.0),
      ch4: isClosed ? 0.0 : (base.ch4 || 56.4),
      reasonClosed: isClosed ? (reason || 'Ditutup oleh Teknisi Lapangan via App Teknisi.') : null,
      updatedAt: `14 Nov 2026, ${nowStr}`
    };

    writeStorage(STORAGE_KEY_VALVES, saved);
    return getNodesGis().find((n) => n.id === nodeId);
  }

  function getReports() {
    return readStorage(STORAGE_KEY_REPORTS, DEFAULT_REPORTS.slice());
  }

  function addReport(item) {
    const list = getReports();
    const num = String(list.length + 5).padStart(2, '0');
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const entry = {
      id: `TKT-2611-${num}`,
      category: item.category,
      location: item.location,
      description: item.description,
      status: 'Menunggu',
      timestamp: `14 Nov 2026, ${nowTime}`
    };
    list.unshift(entry);
    writeStorage(STORAGE_KEY_REPORTS, list);
    return entry;
  }

  function resolveReport(reportId) {
    const list = getReports().map((r) => (r.id === reportId ? Object.assign({}, r, { status: 'Selesai' }) : r));
    writeStorage(STORAGE_KEY_REPORTS, list);
    return list;
  }

  function getChatMessages() {
    return readStorage(STORAGE_KEY_CHAT, DEFAULT_CHAT.slice());
  }

  function addChatMessage(sender, text) {
    const msgs = getChatMessages();
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    msgs.push({ sender, text, time });
    writeStorage(STORAGE_KEY_CHAT, msgs);
    return msgs;
  }

  function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  }

  MBM.data = {
    PRESSURE_HOURLY_CURVE,
    HELP_STAFF,
    getActiveAccount: () => ACCOUNTS[activeAccountKey] || ACCOUNTS.warga,
    setActiveAccountKey: (k) => { if (ACCOUNTS[k]) activeAccountKey = k; },
    isUserValveClosed: () => userValveClosed,
    setUserValveClosed: (v) => { userValveClosed = !!v; },
    getPipelineTopology: () => PIPELINE_TOPOLOGY,
    getNodesGis,
    setNodeValveStatus,
    getReports,
    addReport,
    resolveReport,
    getChatMessages,
    addChatMessage,
    getPreferences: () => Object.assign({}, preferences),
    setPreference: (k, v) => { if (k in preferences) preferences[k] = !!v; },
    formatRupiah
  };
})(window.MBM);
