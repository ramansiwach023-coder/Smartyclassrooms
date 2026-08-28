require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Smart Zonal AC Calculation Function
function calculateSmartZonalACs(zonesData, tOut) {
  const acCapacityKW = 10.56;
  const studentHeat = 0.115;

  const totalConduction = 0.81;
  const totalInfiltration = 0.47;

  const zoneConduction = totalConduction / 4;
  const zoneInfiltration = totalInfiltration / 4;
  const zoneCoefficient = zoneConduction + zoneInfiltration;

  const acStatuses = [];

  zonesData.forEach((zone) => {
    const nStudents = Number(zone.students);

    // Agar koi student nahi hai, AC OFF
    if (nStudents === 0) {
      acStatuses.push({
        ac_id: zone.id,
        status: 'OFF',
        targetTemp: 'N/A',
        zoneHeatKW: '0.00'
      });

      return;
    }

    // Students ke according target temperature
    let targetTemp;

    if (nStudents <= 4) {
      targetTemp = 25;
    } else if (nStudents <= 15) {
      targetTemp = 21;
    } else {
      targetTemp = 18;
    }

    // Heat calculation
    const structuralHeat =
      zoneCoefficient * (tOut - targetTemp);

    const peopleHeat =
      nStudents * studentHeat;

    const totalZoneHeat =
      structuralHeat + peopleHeat;

    let warning = '';

    if (totalZoneHeat > acCapacityKW) {
      warning = 'Overload! Heat is more than AC capacity.';
    }

    acStatuses.push({
      ac_id: zone.id,
      status: 'ON',
      targetTemp: targetTemp,
      zoneHeatKW: totalZoneHeat.toFixed(2),
      capacityUsedPercent:
        ((totalZoneHeat / acCapacityKW) * 100).toFixed(1) + '%',
      warning: warning
    });
  });

  return acStatuses;
}

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Classroom backend is running'
  });
});

// Supabase se classrooms read karna
app.get('/classrooms', async (req, res) => {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*');

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
});

// AC calculation + Supabase mein save
app.post('/calculate-ac', async (req, res) => {
  const { zonesData, tOut } = req.body;

  if (!Array.isArray(zonesData)) {
    return res.status(400).json({
      error: 'zonesData must be an array'
    });
  }

  if (typeof tOut !== 'number') {
    return res.status(400).json({
      error: 'tOut must be a number'
    });
  }

  // Calculation run karo
  const result = calculateSmartZonalACs(zonesData, tOut);

  // Supabase table ke columns ke according data prepare karo
  const rowsToSave = result.map((zone) => ({
    outdoor_temperature: tOut,
    ac_id: zone.ac_id,
    status: zone.status,
    target_temp:
      zone.targetTemp === 'N/A'
        ? null
        : zone.targetTemp,
    zone_heat_kw: Number(zone.zoneHeatKW),
    capacity_used_percent:
      zone.capacityUsedPercent
        ? parseFloat(zone.capacityUsedPercent)
        : 0,
    warning: zone.warning || ''
  }));

  // Supabase mein rows insert karo
  const { data, error } = await supabase
    .from('ac_calculations')
    .insert(rowsToSave)
    .select();

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.status(201).json({
    message: 'Calculation saved successfully',
    outdoorTemperature: tOut,
    savedCalculations: data
  });
});

// Saved calculations read karna
app.get('/ac-calculations', async (req, res) => {
  const { data, error } = await supabase
    .from('ac_calculations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({
      error: error.message
    });
  }

  res.json(data);
});

// Server start
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});