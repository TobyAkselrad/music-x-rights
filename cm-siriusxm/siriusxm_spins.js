// SiriusXM Spins Aggregator for Chartmetric - VERSIÓN CORREGIDA
// Usage: node siriusxm_spins.js
// Env vars:
//   CM_REFRESH_TOKEN=... (Chartmetric Refresh token)
//   ARTIST_ID=127473 (Chartmetric Artist ID)
//   SINCE=2020-01-01 (inclusive)
//   UNTIL=2024-12-31 (opcional; por defecto hoy)
//   CONCURRENCY=1 (opcional, requests paralelas controladas)

// Load environment variables from .env file
require("dotenv").config();

const axios = require("axios");

// ---------- Config ----------
const CM_REFRESH_TOKEN = process.env.CM_REFRESH_TOKEN;
const ARTIST_ID = Number(process.env.ARTIST_ID || 127473);
const SINCE_STR = process.env.SINCE || "2020-01-01";
const UNTIL_STR = process.env.UNTIL || new Date().toISOString().slice(0, 10);
const CONCURRENCY = Number(process.env.CONCURRENCY || 1);

// ---------- Helpers ----------
if (!CM_REFRESH_TOKEN) {
  console.error(
    "ERROR: faltan credenciales. Exportá CM_REFRESH_TOKEN con tu Refresh token de Chartmetric."
  );
  process.exit(1);
}

// Función para obtener el token de acceso usando el refresh token
async function getAccessToken(refreshToken) {
  try {
    const response = await axios.post("https://api.chartmetric.com/api/token", {
      refreshtoken: refreshToken,
    });

    if (response.data && response.data.token) {
      console.log("✅ Token de acceso obtenido exitosamente");
      return response.data.token;
    } else {
      throw new Error("Respuesta inválida de la API de token");
    }
  } catch (error) {
    console.error("❌ Error obteniendo token de acceso:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    throw error;
  }
}

// Variable global para el token de acceso
let accessToken = null;

// Función para obtener el token de acceso (con cache)
async function getValidAccessToken() {
  if (!accessToken) {
    accessToken = await getAccessToken(CM_REFRESH_TOKEN);
  }
  return accessToken;
}

// Función para crear cliente HTTP con token válido
async function createHttpClient() {
  const token = await getValidAccessToken();
  return axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------- NUEVO ENDPOINT: Obtener todas las estaciones con plays del artista ----------
async function fetchArtistStationPlays(artistId, sinceStr) {
  const http = await createHttpClient();

  console.log(
    `🔍 Consultando estaciones con plays para artista ${artistId} desde ${sinceStr}...`
  );

  // Endpoint correcto que descubrimos en la exploración
  const url = `/radio/artist/${artistId}/airplay-totals/station`;
  const params = { since: sinceStr };

  console.log(`📡 GET ${url} con params:`, params);

  const resp = await http.get(url, { params });
  const stations = resp.data?.obj || [];

  console.log(`📊 Encontradas ${stations.length} estaciones con plays`);

  // Mostrar TODAS las estaciones encontradas para análisis
  console.log("\n📻 TODAS LAS ESTACIONES ENCONTRADAS:");
  stations.forEach((station, index) => {
    console.log(
      `   ${index + 1}. ${station.name} (${
        station.country
      }): ${station.plays.toLocaleString()} plays`
    );
  });

  // Filtrar solo estaciones SiriusXM (por nombre o ID)
  const siriusXMStations = stations.filter((station) => {
    const name = (station.name || "").toLowerCase();
    return (
      name.includes("sirius") ||
      name.includes("xm") ||
      name.includes("satellite") ||
      // También podemos filtrar por país si es necesario
      station.country === "United States"
    );
  });

  console.log(
    `\n🎯 Estaciones SiriusXM encontradas: ${siriusXMStations.length}`
  );

  if (siriusXMStations.length > 0) {
    siriusXMStations.forEach((station) => {
      console.log(
        `   📻 ${station.name} (${station.country}): ${station.plays} plays`
      );
    });
  }

  return siriusXMStations;
}

async function main() {
  console.log("🚀 INICIANDO SIRIUSXM SPINS CON ENDPOINT CORREGIDO");
  console.log("==================================================");
  console.log(`Artist ID: ${ARTIST_ID}`);
  console.log(`Window: ${SINCE_STR} → ${UNTIL_STR}`);
  console.log("==================================================\n");

  // Usar el endpoint correcto que descubrimos
  console.log("📡 Obteniendo estaciones con plays del artista...");
  const siriusXMStations = await fetchArtistStationPlays(ARTIST_ID, SINCE_STR);

  if (siriusXMStations.length === 0) {
    console.log(
      "\n❌ No se encontraron estaciones SiriusXM con plays para este artista."
    );
    console.log("💡 Esto puede significar:");
    console.log("   - El artista no suena en SiriusXM");
    console.log("   - Los datos de SiriusXM vienen de otro endpoint");
    console.log("   - El período especificado no tiene datos");
    return;
  }

  // Calcular total de SiriusXM Spins
  const totalSiriusXMSpins = siriusXMStations.reduce((total, station) => {
    return total + (station.plays || 0);
  }, 0);

  console.log("\n=======================================");
  console.log(`🎯 RESULTADO FINAL:`);
  console.log(
    `SiriusXM Spins (artist ${ARTIST_ID}) = ${totalSiriusXMSpins.toLocaleString()}`
  );
  console.log(`Estaciones SiriusXM: ${siriusXMStations.length}`);
  console.log("=======================================\n");

  // Mostrar desglose por estación
  console.log("📊 DESGLOSE POR ESTACIÓN:");
  siriusXMStations.forEach((station) => {
    console.log(`   ${station.name}: ${station.plays.toLocaleString()} plays`);
  });
}

main().catch((err) => {
  console.error(
    "❌ ERROR:",
    err?.response?.status,
    err?.response?.data || err?.message
  );
  process.exit(1);
});

