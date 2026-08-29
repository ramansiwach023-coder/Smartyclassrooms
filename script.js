const SUPABASE_URL = "https://xkjauqpdmfiugkhqnadc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G-eKruij0iFteXsF6pLEtQ_Txm2anY2";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const CONFIG = {
  acPowerKw: 1.5,
  baselineHoursPerDay: 8,
  electricityTariff: 8,
  referenceHomeMonthlyKwh: 98,
  refreshMs: 10000
};

const state = {
  rooms: [
    {
      id: "AC1",
      name: "Classroom 1",
      capacity: 45,
      occupancy: 18,
      temperature: 28.4,
      motion: true,
      status: "ON",
      mode: "automatic",
      actualKwh: 6.2
    },
    {
      id: "AC2",
      name: "Classroom 1",
      capacity: 45,
      occupancy: 0,
      temperature: 27.1,
      motion: false,
      status: "OFF",
      mode: "automatic",
      actualKwh: 2.1
    },
    {
      id: "AC3",
      name: "Classroom 1",
      capacity: 60,
      occupancy: 31,
      temperature: 29.2,
      motion: true,
      status: "ON",
      mode: "automatic",
      actualKwh: 8.3
    },
    {
      id: "AC4",
      name: "Classroom 1",
      capacity: 50,
      occupancy: 14,
      temperature: 28.8,
      motion: true,
      status: "ON",
      mode: "automatic",
      actualKwh: 7.1
    }
  ],
  activities: []
};

const pageTitles = {
  dashboard: "Smart Classroom Overview",
  monitoring: "Live Sensor Monitoring",
  optimization: "Energy Optimization",
  rooms: "Room Controls",
  reports: "Savings Report",
  sensors: "Sensor Status"
};

function format(value, decimals = 2) {
  return Number(value).toFixed(decimals);
}

function getBaseline() {
  return CONFIG.acPowerKw * CONFIG.baselineHoursPerDay;
}

function getMetrics() {
  const baseline = getBaseline() * state.rooms.length;
  const actual = state.rooms.reduce((sum, room) => {
    return sum + room.actualKwh;
  }, 0);

  const saved = Math.max(0, baseline - actual);
  const percentage = baseline ? (saved / baseline) * 100 : 0;
  const moneySaved = saved * CONFIG.electricityTariff;
  const homes = saved / CONFIG.referenceHomeMonthlyKwh;

  return {
    baseline,
    actual,
    saved,
    percentage,
    moneySaved,
    homes
  };
}

function updateRoomStatus(room) {
  if (room.mode === "manual-on") {
    room.status = "ON";
  } else if (room.mode === "manual-off") {
    room.status = "OFF";
  } else {
    room.mode = "automatic";
    room.status =
      room.occupancy > 0 && room.temperature >= 24
        ? "ON"
        : "OFF";
  }
}

function statusHtml(status) {
  return `
    <span class="status ${status === "ON" ? "on" : "off"}">
      ${status}
    </span>
  `;
}

function simulateSensorData() {
  state.rooms.forEach(room => {
    if (room.mode === "automatic") {
      const change = Math.floor(Math.random() * 7) - 3;
      room.occupancy = Math.max(
        0,
        Math.min(room.capacity, room.occupancy + change)
      );
    }

    room.temperature += Math.random() * 0.5 - 0.25;
    room.temperature = Math.max(
      22,
      Math.min(35, room.temperature)
    );

    room.motion = room.occupancy > 0 && Math.random() > 0.15;

    updateRoomStatus(room);

    if (room.status === "ON") {
      room.actualKwh += CONFIG.acPowerKw * 10 / 3600;
    } else {
      room.actualKwh += 0.01 * 10 / 3600;
    }
  });
}

function renderDashboard() {
  const metrics = getMetrics();

  document.getElementById("usedKwh").textContent =
    `${format(metrics.actual)} kWh`;

  document.getElementById("savedKwh").textContent =
    `${format(metrics.saved)} kWh`;

  document.getElementById("moneySaved").textContent =
    `₹${format(metrics.moneySaved)}`;

  document.getElementById("homesPowered").textContent =
    format(metrics.homes);

  document.getElementById("optimizationPercent").textContent =
    `${format(metrics.percentage, 1)}% better than baseline`;

  document.getElementById("lastUpdated").textContent =
    `Last updated: ${new Date().toLocaleTimeString()}`;

  document.getElementById("roomGrid").innerHTML =
    state.rooms.map(room => `
      <article class="room-card">
        <div class="room-top">
          <div>
            <h4>${room.id}</h4>
            <small>${room.name}</small>
          </div>
          ${statusHtml(room.status)}
        </div>

        <div class="temperature">
          ${format(room.temperature, 1)}°C
        </div>

        <div class="data-row">
          <span>Occupancy</span>
          <strong>${room.occupancy} students</strong>
        </div>

        <div class="data-row">
          <span>Mode</span>
          <strong>${room.mode}</strong>
        </div>
      </article>
    `).join("");

  const emptyRooms = state.rooms.filter(
    room => room.occupancy === 0
  ).length;

  document.getElementById("recommendation").textContent =
    emptyRooms > 0
      ? `${emptyRooms} classroom empty hai. Unnecessary cooling automatically reduce ki ja rahi hai.`
      : "All classrooms occupied hain. Cooling occupancy aur temperature ke according optimize ho rahi hai.";
}

function renderMonitoring() {
  document.getElementById("monitorGrid").innerHTML =
    state.rooms.map(room => `
      <article class="monitor-card">
        <div class="card-top">
          <div>
            <h4>${room.id} · ${room.name}</h4>
            <small>● Live sensor data</small>
          </div>
          ${statusHtml(room.status)}
        </div>

        <div class="metrics">
          <div class="metric">
            <span>Occupancy</span>
            <strong>${room.occupancy}</strong>
          </div>

          <div class="metric">
            <span>Temperature</span>
            <strong>${format(room.temperature, 1)}°C</strong>
          </div>

          <div class="metric">
            <span>Movement</span>
            <strong>${room.motion ? "Yes" : "No"}</strong>
          </div>
        </div>

        <small>Thermal sensor: Online</small><br>
        <small>Movement sensor: Online</small>
      </article>
    `).join("");
}

function renderOptimization() {
  const metrics = getMetrics();

  document.getElementById("bigSavedKwh").textContent =
    `${format(metrics.saved)} kWh`;

  document.getElementById("bigPercent").textContent =
    `${format(metrics.percentage, 1)}% better than baseline`;

  document.getElementById("optimizationTable").innerHTML =
    state.rooms.map(room => {
      const baseline = getBaseline();
      const saved = Math.max(0, baseline - room.actualKwh);
      const percentage = (saved / baseline) * 100;

      return `
        <tr>
          <td><strong>${room.id}</strong></td>
          <td>${room.occupancy}</td>
          <td>${format(room.actualKwh)} kWh</td>
          <td>${format(baseline)} kWh</td>
          <td class="saved">${format(saved)} kWh</td>
          <td class="saved">${format(percentage, 1)}%</td>
        </tr>
      `;
    }).join("");
}

function renderControls() {
  document.getElementById("controlGrid").innerHTML =
    state.rooms.map(room => `
      <article class="control-card">
        <div class="card-top">
          <div>
            <h4>${room.id} · ${room.name}</h4>
            <small>Occupancy: ${room.occupancy}</small>
          </div>
          ${statusHtml(room.status)}
        </div>

        <div class="control-buttons">
          <button class="control-btn ${
            room.mode === "automatic" ? "selected" : ""
          }" data-room="${room.id}" data-mode="automatic">
            Automatic
          </button>

          <button class="control-btn ${
            room.mode === "manual-on" ? "selected" : ""
          }" data-room="${room.id}" data-mode="manual-on">
            Turn ON
          </button>

          <button class="control-btn ${
            room.mode === "manual-off" ? "selected" : ""
          }" data-room="${room.id}" data-mode="manual-off">
            Turn OFF
          </button>
        </div>

        <div class="data-row">
          <span>Temperature</span>
          <strong>${format(room.temperature, 1)}°C</strong>
        </div>
      </article>
    `).join("");
}

function renderReports() {
  const metrics = getMetrics();

  document.getElementById("reportUsed").textContent =
    `${format(metrics.actual)} kWh`;

  document.getElementById("reportSaved").textContent =
    `${format(metrics.saved)} kWh`;

  document.getElementById("reportPercent").textContent =
    `${format(metrics.percentage, 1)}%`;

  document.getElementById("reportHomes").textContent =
    format(metrics.homes);

  document.getElementById("activityList").innerHTML =
    state.activities.length
      ? state.activities.slice(0, 8).map(item => `
          <div class="activity">
            ✓ ${item.text}
            <small>${item.time}</small>
          </div>
        `).join("")
      : `<div class="activity">No saved actions yet.</div>`;
}

function renderSensors() {
  const total = state.rooms.length * 2;

  document.getElementById("totalSensors").textContent = total;
  document.getElementById("onlineSensors").textContent = total;

  document.getElementById("sensorGrid").innerHTML =
    state.rooms.map(room => `
      <article class="sensor-card">
        <h4>${room.id} · ${room.name}</h4>

        <div class="sensor-data">
          <div>
            <span>Thermal sensor</span>
            <strong>Online</strong>
          </div>

          <div>
            <span>Movement sensor</span>
            <strong>Online</strong>
          </div>

          <div>
            <span>Privacy mode</span>
            <strong>Anonymous</strong>
          </div>

          <div>
            <span>Last reading</span>
            <strong>${new Date().toLocaleTimeString()}</strong>
          </div>
        </div>
      </article>
    `).join("");
}

function renderAll() {
  renderDashboard();
  renderMonitoring();
  renderOptimization();
  renderControls();
  renderReports();
  renderSensors();
}

function showView(viewName) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.toggle(
      "active",
      view.id === `view-${viewName}`
    );
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === viewName
    );
  });

  document.getElementById("pageTitle").textContent =
    pageTitles[viewName];
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

async function insertOrThrow(table, rows, options = {}) {
  const result = await supabaseClient
    .from(table)
    .insert(rows, options);

  if (result.error) {
    throw new Error(`${table}: ${result.error.message}`);
  }

  return result.data;
}

async function optimizeAndSave() {
  const button = document.getElementById("optimizeSaveBtn");

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    state.rooms.forEach(room => {
      room.mode = "automatic";
      updateRoomStatus(room);
    });

    const now = new Date().toISOString();
    const metrics = getMetrics();

    const classroomRows = state.rooms.map(room => ({
      room_code: room.id,
      room_name: room.name,
      capacity: room.capacity,
      mode: room.mode,
      ac_status: room.status,
      updated_at: now
    }));

    const sensorRows = state.rooms.map(room => ({
      room_code: room.id,
      occupancy: room.occupancy,
      temperature: Number(format(room.temperature, 2)),
      motion_detected: room.motion,
      thermal_status: "Online",
      motion_status: "Online",
      recorded_at: now
    }));

    const energyRows = state.rooms.map(room => {
      const baseline = getBaseline();
      const saved = Math.max(0, baseline - room.actualKwh);

      return {
        room_code: room.id,
        used_kwh: Number(format(room.actualKwh, 3)),
        baseline_kwh: Number(format(baseline, 3)),
        saved_kwh: Number(format(saved, 3)),
        tariff: CONFIG.electricityTariff,
        cost_saved: Number(
          format(saved * CONFIG.electricityTariff, 2)
        ),
        equivalent_homes: Number(
          format(saved / CONFIG.referenceHomeMonthlyKwh, 4)
        ),
        recorded_at: now
      };
    });

    const actionRows = state.rooms.map(room => ({
      room_code: room.id,
      action: room.status === "ON" ? "AC_ON" : "AC_OFF",
      reason: room.occupancy > 0
        ? "Occupied room and temperature monitored"
        : "Room empty, unnecessary cooling reduced",
      mode: "automatic",
      created_at: now
    }));

    const classroomResult = await supabaseClient
      .from("classrooms")
      .upsert(classroomRows, {
        onConflict: "room_code"
      });

    if (classroomResult.error) {
      throw new Error(
        `classrooms: ${classroomResult.error.message}`
      );
    }

    await insertOrThrow("sensor_readings", sensorRows);
    await insertOrThrow("energy_readings", energyRows);
    await insertOrThrow("optimization_actions", actionRows);

    state.activities.unshift({
      text: "Optimization completed and all information saved to Supabase.",
      time: new Date().toLocaleTimeString()
    });

    renderAll();

    showToast(
      `${format(metrics.saved)} kWh optimized and saved successfully`
    );
  } catch (error) {
    console.error(error);
    showToast(`Save failed: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "⚡ Optimize & Save";
  }
}

async function loadSavedActions() {
  const result = await supabaseClient
    .from("optimization_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  if (result.error) {
    console.warn("History load failed:", result.error.message);
    return;
  }

  state.activities = result.data.map(row => ({
    text: `${row.room_code}: ${row.action} — ${row.reason}`,
    time: new Date(row.created_at).toLocaleString()
  }));

  renderReports();
}

function exportCSV() {
  const metrics = getMetrics();

  const rows = [
    ["SmartClass Energy Report"],
    ["Electricity Used", `${format(metrics.actual)} kWh`],
    ["Energy Optimized", `${format(metrics.saved)} kWh`],
    ["Cost Saved", `₹${format(metrics.moneySaved)}`],
    ["Equivalent Homes", format(metrics.homes)],
    [],
    ["Room", "Occupancy", "Temperature", "AC Status", "Used kWh"],
    ...state.rooms.map(room => [
      room.id,
      room.occupancy,
      `${format(room.temperature, 1)}°C`,
      room.status,
      format(room.actualKwh)
    ])
  ];

  const csv = rows
    .map(row => row.map(value => `"${value}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "smartclass-energy-report.csv";
  link.click();

  showToast("CSV report downloaded");
}

document.addEventListener("click", event => {
  const navButton = event.target.closest("[data-view]");
  const linkButton = event.target.closest("[data-view-link]");
  const controlButton = event.target.closest("[data-room][data-mode]");

  if (navButton) {
    showView(navButton.dataset.view);
  }

  if (linkButton) {
    showView(linkButton.dataset.viewLink);
  }

  if (controlButton) {
    const room = state.rooms.find(
      item => item.id === controlButton.dataset.room
    );

    if (room) {
      room.mode = controlButton.dataset.mode;
      updateRoomStatus(room);
      renderAll();
      showToast(`${room.id} mode updated`);
    }
  }
});

document
  .getElementById("optimizeSaveBtn")
  .addEventListener("click", optimizeAndSave);

document
  .getElementById("refreshBtn")
  .addEventListener("click", () => {
    simulateSensorData();
    renderAll();
    showToast("Sensor data refreshed");
  });

document
  .getElementById("sensorRefreshBtn")
  .addEventListener("click", () => {
    simulateSensorData();
    renderAll();
    showToast("Sensors refreshed");
  });

document
  .getElementById("allAutoBtn")
  .addEventListener("click", () => {
    state.rooms.forEach(room => {
      room.mode = "automatic";
      updateRoomStatus(room);
    });

    renderAll();
    showToast("Automatic mode enabled for all rooms");
  });

document
  .getElementById("exportBtn")
  .addEventListener("click", exportCSV);

renderAll();

setInterval(() => {
  simulateSensorData();
  renderAll();
}, CONFIG.refreshMs);

loadSavedActions();