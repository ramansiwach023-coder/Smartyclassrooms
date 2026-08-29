const SUPABASE_URL = "https://xkjauqpdmfiugkhqnadc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G-eKruij0iFteXsF6pLEtQ_Txm2anY2";

const supabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_ANON_KEY.includes("PASTE_");

const supabaseClient = supabaseConfigured
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    )
  : null;

const CONFIG = {
  acPowerKw: 1.5,
  baselineHoursPerDay: 8,
  electricityTariff: 8,
  referenceHomeMonthlyKwh: 98,
  refreshMs: 10000
};

const state = {
  classroomOccupancy: 18,
  classroomTemperature: 28.4,

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
      occupancy: 18,
      temperature: 28.4,
      motion: true,
      status: "ON",
      mode: "automatic",
      actualKwh: 6.2
    },
    {
      id: "AC3",
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
      id: "AC4",
      name: "Classroom 1",
      capacity: 45,
      occupancy: 18,
      temperature: 28.4,
      motion: true,
      status: "ON",
      mode: "automatic",
      actualKwh: 6.2
    }
  ],

  activities: [],

  recommendationIndex: 0
};

const pageTitles = {
  dashboard: "Smart Classroom Overview",
  monitoring: "Live Sensor Monitoring",
  optimization: "Energy Optimization",
  rooms: "Room Controls",
  reports: "Savings Report",
  sensors: "Sensor Status"
};

const recommendationMessages = [
  {
    title: "Smart cooling is active",
    text: "The system is adjusting AC operation according to live occupancy and temperature data."
  },
  {
    title: "Energy usage is being optimized",
    text: "Cooling is reduced automatically when the classroom is empty or does not require full cooling."
  },
  {
    title: "Efficient classroom management",
    text: "The current AC plan balances student comfort with lower electricity consumption."
  },
  {
    title: "Unnecessary cooling reduced",
    text: "The system is avoiding unnecessary AC operation while keeping the occupied classroom comfortable."
  },
  {
    title: "Automatic optimization running",
    text: "Classroom conditions are being monitored continuously to select the most efficient cooling mode."
  },
  {
    title: "Energy-saving recommendation",
    text: "Keep automatic mode enabled so the system can respond to changing occupancy levels."
  },
  {
    title: "Cooling performance is stable",
    text: "Current classroom temperature and occupancy readings are within the optimization range."
  }
];

function format(value, decimals = 2) {
  return Number(value).toFixed(decimals);
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getBaselineForOneAC() {
  return CONFIG.acPowerKw * CONFIG.baselineHoursPerDay;
}

function getMetrics() {
  const baseline =
    getBaselineForOneAC() * state.rooms.length;

  const actual =
    state.rooms.reduce((total, room) => {
      return total + room.actualKwh;
    }, 0);

  const saved = Math.max(0, baseline - actual);

  const percentage = baseline > 0
    ? (saved / baseline) * 100
    : 0;

  const moneySaved =
    saved * CONFIG.electricityTariff;

  const equivalentHomes =
    saved / CONFIG.referenceHomeMonthlyKwh;

  return {
    baseline,
    actual,
    saved,
    percentage,
    moneySaved,
    equivalentHomes
  };
}

function updateRoomStatus(room) {
  if (room.mode === "manual-on") {
    room.status = "ON";
    return;
  }

  if (room.mode === "manual-off") {
    room.status = "OFF";
    return;
  }

  room.mode = "automatic";

  room.status =
    room.occupancy > 0 &&
    room.temperature >= 24
      ? "ON"
      : "OFF";
}

function statusHTML(status) {
  return `
    <span class="status ${status === "ON" ? "on" : "off"}">
      ${status}
    </span>
  `;
}

function addActivity(text) {
  state.activities.unshift({
    text,
    time: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short"
    })
  });

  state.activities =
    state.activities.slice(0, 10);
}

function simulateSensorData() {
  const occupancyChange =
    Math.floor(Math.random() * 7) - 3;

  state.classroomOccupancy = clamp(
    state.classroomOccupancy + occupancyChange,
    0,
    45
  );

  const temperatureChange =
    Math.random() * 0.5 - 0.25;

  state.classroomTemperature = clamp(
    state.classroomTemperature + temperatureChange,
    22,
    35
  );

  const motionDetected =
    state.classroomOccupancy > 0 &&
    Math.random() > 0.12;

  state.rooms.forEach(room => {
    room.occupancy =
      state.classroomOccupancy;

    room.temperature =
      state.classroomTemperature;

    room.motion =
      motionDetected;

    updateRoomStatus(room);

    if (room.status === "ON") {
      room.actualKwh +=
        CONFIG.acPowerKw * CONFIG.refreshMs / 3600000;
    } else {
      room.actualKwh +=
        0.01 * CONFIG.refreshMs / 3600000;
    }
  });
}

function renderRecommendation() {
  const recommendation =
    recommendationMessages[
      state.recommendationIndex %
      recommendationMessages.length
    ];

  state.recommendationIndex++;

  const element =
    document.getElementById("recommendation");

  if (!element) {
    return;
  }

  element.innerHTML = `
    <strong>${recommendation.title}</strong>
    <span>${recommendation.text}</span>
  `;
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
    format(metrics.equivalentHomes);

  document.getElementById("optimizationPercent").textContent =
    `${format(metrics.percentage, 1)}% better than baseline`;

  document.getElementById("lastUpdated").textContent =
    `Last updated: ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "medium"
    })}`;

  document.getElementById("roomGrid").innerHTML =
    state.rooms.map(room => `
      <article class="room-card">
        <div class="room-top">
          <div>
            <h4>${room.id}</h4>
            <small>${room.name}</small>
          </div>

          ${statusHTML(room.status)}
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

  renderRecommendation();
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

          ${statusHTML(room.status)}
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
            <strong>${room.motion ? "Detected" : "None"}</strong>
          </div>
        </div>

        <small>Thermal sensor: Online</small>
        <br>
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
      const baseline =
        getBaselineForOneAC();

      const saved =
        Math.max(0, baseline - room.actualKwh);

      const percentage =
        baseline > 0
          ? (saved / baseline) * 100
          : 0;

      return `
        <tr>
          <td>
            <strong>${room.id}</strong>
            <br>
            <small>${room.name}</small>
          </td>

          <td>${room.occupancy}</td>

          <td>${format(room.actualKwh)} kWh</td>

          <td>${format(baseline)} kWh</td>

          <td class="saved">
            ${format(saved)} kWh
          </td>

          <td class="saved">
            ${format(percentage, 1)}%
          </td>
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

          ${statusHTML(room.status)}
        </div>

        <div class="control-buttons">
          <button
            class="control-btn ${
              room.mode === "automatic"
                ? "selected"
                : ""
            }"
            data-room="${room.id}"
            data-mode="automatic">
            Automatic
          </button>

          <button
            class="control-btn ${
              room.mode === "manual-on"
                ? "selected"
                : ""
            }"
            data-room="${room.id}"
            data-mode="manual-on">
            Turn ON
          </button>

          <button
            class="control-btn ${
              room.mode === "manual-off"
                ? "selected"
                : ""
            }"
            data-room="${room.id}"
            data-mode="manual-off">
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
    format(metrics.equivalentHomes);

  const activityList =
    document.getElementById("activityList");

  if (!state.activities.length) {
    activityList.innerHTML = `
      <div class="activity">
        No optimization actions saved yet.
      </div>
    `;

    return;
  }

  activityList.innerHTML =
    state.activities.map(item => `
      <div class="activity">
        ${item.text}
        <small>${item.time}</small>
      </div>
    `).join("");
}

function renderSensors() {
  const totalSensors =
    state.rooms.length * 2;

  document.getElementById("totalSensors").textContent =
    totalSensors;

  document.getElementById("onlineSensors").textContent =
    totalSensors;

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
            <strong>
              ${new Date().toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata"
              })}
            </strong>
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

  const title =
    document.getElementById("pageTitle");

  if (title && pageTitles[viewName]) {
    title.textContent =
      pageTitles[viewName];
  }
}

function showToast(message) {
  const toast =
    document.getElementById("toast");

  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

async function insertRows(tableName, rows) {
  const result =
    await supabaseClient
      .from(tableName)
      .insert(rows);

  if (result.error) {
    throw new Error(
      `${tableName}: ${result.error.message}`
    );
  }

  return result.data;
}

async function optimizeAndSave() {
  const button =
    document.getElementById("optimizeSaveBtn");

  if (!supabaseConfigured) {
    showToast(
      "Please add your Supabase URL and publishable key in script.js."
    );

    return;
  }

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    state.rooms.forEach(room => {
      room.mode = "automatic";
      updateRoomStatus(room);
    });

    const currentTime =
      new Date().toISOString();

    const metrics =
      getMetrics();

    const classroomRows =
      state.rooms.map(room => ({
        room_code: room.id,
        room_name: "Classroom 1",
        capacity: room.capacity,
        mode: room.mode,
        ac_status: room.status,
        updated_at: currentTime
      }));

    const sensorRows =
      state.rooms.map(room => ({
        room_code: room.id,
        occupancy: room.occupancy,
        temperature: Number(
          format(room.temperature, 2)
        ),
        motion_detected: room.motion,
        thermal_status: "Online",
        motion_status: "Online",
        recorded_at: currentTime
      }));

    const energyRows =
      state.rooms.map(room => {
        const baseline =
          getBaselineForOneAC();

        const saved =
          Math.max(
            0,
            baseline - room.actualKwh
          );

        return {
          room_code: room.id,
          used_kwh: Number(
            format(room.actualKwh, 3)
          ),
          baseline_kwh: Number(
            format(baseline, 3)
          ),
          saved_kwh: Number(
            format(saved, 3)
          ),
          tariff: CONFIG.electricityTariff,
          cost_saved: Number(
            format(
              saved * CONFIG.electricityTariff,
              2
            )
          ),
          equivalent_homes: Number(
            format(
              saved /
              CONFIG.referenceHomeMonthlyKwh,
              4
            )
          ),
          recorded_at: currentTime
        };
      });

    const actionRows =
      state.rooms.map(room => ({
        room_code: room.id,
        action:
          room.status === "ON"
            ? "AC_ON"
            : "AC_OFF",
        reason:
          room.occupancy > 0
            ? "Occupied classroom with automatic cooling"
            : "Classroom empty, unnecessary cooling reduced",
        mode: "automatic",
        created_at: currentTime
      }));

    const classroomResult =
      await supabaseClient
        .from("classrooms")
        .upsert(classroomRows, {
          onConflict: "room_code"
        });

    if (classroomResult.error) {
      throw new Error(
        `classrooms: ${
          classroomResult.error.message
        }`
      );
    }

    await insertRows(
      "sensor_readings",
      sensorRows
    );

    await insertRows(
      "energy_readings",
      energyRows
    );

    await insertRows(
      "optimization_actions",
      actionRows
    );

    addActivity(
      "Optimization completed and all classroom information was saved to Supabase."
    );

    renderAll();

    showToast(
      `${format(metrics.saved)} kWh optimized and saved successfully.`
    );
  } catch (error) {
    console.error("Save failed:", error);

    showToast(
      `Save failed: ${error.message}`
    );
  } finally {
    button.disabled = false;
    button.textContent = "⚡ Optimize & Save";
  }
}

async function loadSavedActions() {
  if (!supabaseConfigured) {
    return;
  }

  const result =
    await supabaseClient
      .from("optimization_actions")
      .select("*")
      .order("created_at", {
        ascending: false
      })
      .limit(8);

  if (result.error) {
    console.warn(
      "Could not load saved actions:",
      result.error.message
    );

    return;
  }

  state.activities =
    result.data.map(row => ({
      text:
        `${row.room_code}: ${row.action} — ${row.reason}`,
      time:
        new Date(row.created_at).toLocaleString(
          "en-IN",
          {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short"
          }
        )
    }));

  renderReports();
}

function exportCSV() {
  const metrics =
    getMetrics();

  const rows = [
    ["SmartClass Energy Optimization Report"],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ["Metric", "Value"],
    ["Electricity Used", `${format(metrics.actual)} kWh`],
    ["Energy Optimized", `${format(metrics.saved)} kWh`],
    ["Optimization", `${format(metrics.percentage, 1)}%`],
    ["Estimated Cost Saved", `₹${format(metrics.moneySaved)}`],
    ["Equivalent Homes", format(metrics.equivalentHomes)],
    [],
    [
      "AC",
      "Classroom",
      "Occupancy",
      "Temperature",
      "AC Status",
      "Used kWh"
    ],
    ...state.rooms.map(room => [
      room.id,
      room.name,
      room.occupancy,
      `${format(room.temperature, 1)}°C`,
      room.status,
      format(room.actualKwh)
    ])
  ];

  const csv =
    rows.map(row =>
      row.map(value =>
        `"${String(value).replaceAll('"', '""')}"`
      ).join(",")
    ).join("\n");

  const blob =
    new Blob([csv], {
      type: "text/csv;charset=utf-8"
    });

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(blob);

  link.download =
    "smartclass-energy-report.csv";

  link.click();

  URL.revokeObjectURL(link.href);

  showToast("Energy report downloaded.");
}

document.addEventListener("click", event => {
  const navButton =
    event.target.closest("[data-view]");

  const viewLink =
    event.target.closest("[data-view-link]");

  const controlButton =
    event.target.closest(
      "[data-room][data-mode]"
    );

  if (navButton) {
    showView(navButton.dataset.view);
  }

  if (viewLink) {
    showView(viewLink.dataset.viewLink);
  }

  if (controlButton) {
    const room =
      state.rooms.find(item =>
        item.id === controlButton.dataset.room
      );

    if (!room) {
      return;
    }

    room.mode =
      controlButton.dataset.mode;

    updateRoomStatus(room);
    renderAll();

    addActivity(
      `${room.id} mode changed to ${room.mode}.`
    );

    showToast(
      `${room.id} mode updated.`
    );
  }
});

document
  .getElementById("optimizeSaveBtn")
  .addEventListener(
    "click",
    optimizeAndSave
  );

document
  .getElementById("refreshBtn")
  .addEventListener("click", () => {
    simulateSensorData();
    renderAll();
    showToast("Sensor data refreshed.");
  });

document
  .getElementById("sensorRefreshBtn")
  .addEventListener("click", () => {
    simulateSensorData();
    renderAll();
    showToast("Sensors refreshed.");
  });

document
  .getElementById("allAutoBtn")
  .addEventListener("click", () => {
    state.rooms.forEach(room => {
      room.mode = "automatic";
      updateRoomStatus(room);
    });

    addActivity(
      "Automatic mode enabled for all four AC units."
    );

    renderAll();

    showToast(
      "Automatic mode enabled for all ACs."
    );
  });

document
  .getElementById("exportBtn")
  .addEventListener(
    "click",
    exportCSV
  );

renderAll();

loadSavedActions();

setInterval(() => {
  simulateSensorData();
  renderAll();
}, CONFIG.refreshMs);