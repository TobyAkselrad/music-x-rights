// Script de exploración de la API de Chartmetric
// Para encontrar los endpoints correctos de SiriusXM

require("dotenv").config();
const axios = require("axios");

const CM_REFRESH_TOKEN = process.env.CM_REFRESH_TOKEN;
const ARTIST_ID = Number(process.env.ARTIST_ID || 127473);

if (!CM_REFRESH_TOKEN) {
  console.error("ERROR: Exportá CM_REFRESH_TOKEN");
  process.exit(1);
}

async function getAccessToken(refreshToken) {
  try {
    const response = await axios.post("https://api.chartmetric.com/api/token", {
      refreshtoken: refreshToken,
    });

    if (response.data && response.data.token) {
      console.log("✅ Token obtenido");
      return response.data.token;
    }
  } catch (error) {
    console.error("❌ Error obteniendo token:", error.message);
    throw error;
  }
}

async function exploreAPI() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 EXPLORANDO API DE CHARTMETRIC");
  console.log("==================================\n");

  // 1. Explorar endpoints de radio disponibles
  console.log("📡 1. EXPLORANDO ENDPOINTS DE RADIO...");

  try {
    // Probar diferentes endpoints de radio
    const radioEndpoints = [
      "/radio/artist",
      "/radio/track",
      "/radio/station",
      "/radio/airplay",
      "/radio/siriusxm",
      "/radio/satellite",
    ];

    for (const endpoint of radioEndpoints) {
      try {
        console.log(`\n🔍 Probando: ${endpoint}`);
        const response = await http.get(endpoint);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        if (response.data && response.data.obj) {
          console.log(`   Datos: ${response.data.obj.length} elementos`);
        }
      } catch (e) {
        if (e.response) {
          console.log(`❌ ${endpoint} - Status: ${e.response.status}`);
          if (e.response.status === 404) {
            console.log("   Endpoint no existe");
          } else if (e.response.status === 400) {
            console.log("   Endpoint existe pero requiere parámetros");
          }
        } else {
          console.log(`❌ ${endpoint} - Error: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.error("Error explorando endpoints:", e.message);
  }

  // 2. Explorar estaciones disponibles
  console.log("\n📡 2. EXPLORANDO ESTACIONES DISPONIBLES...");

  try {
    // Probar diferentes endpoints de estaciones
    const stationEndpoints = [
      "/radio/station",
      "/radio/stations",
      "/radio/station/list",
      "/radio/station/search",
    ];

    for (const endpoint of stationEndpoints) {
      try {
        console.log(`\n🔍 Probando: ${endpoint}`);
        const response = await http.get(endpoint);
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        if (response.data && response.data.obj) {
          console.log(`   Estaciones: ${response.data.obj.length}`);
          if (response.data.obj.length > 0) {
            console.log("   Primeras 3 estaciones:");
            response.data.obj.slice(0, 3).forEach((s) => {
              console.log(`     ID: ${s.id}, Nombre: ${s.name || "N/A"}`);
            });
          }
        }
      } catch (e) {
        if (e.response) {
          console.log(`❌ ${endpoint} - Status: ${e.response.status}`);
        } else {
          console.log(`❌ ${endpoint} - Error: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.error("Error explorando estaciones:", e.message);
  }

  // 3. Buscar estaciones SiriusXM específicamente
  console.log("\n📡 3. BUSCANDO ESTACIONES SIRIUSXM...");

  try {
    // Probar búsqueda de estaciones SiriusXM
    const searchQueries = ["siriusxm", "sirius", "xm", "satellite"];

    for (const query of searchQueries) {
      try {
        console.log(`\n🔍 Buscando: "${query}"`);
        const response = await http.get("/radio/station/search", {
          params: { q: query, limit: 20 },
        });

        if (response.data && response.data.obj) {
          console.log(`✅ Encontradas: ${response.data.obj.length} estaciones`);
          response.data.obj.forEach((s) => {
            console.log(`   ID: ${s.id}, Nombre: ${s.name || "N/A"}`);
          });
        }
      } catch (e) {
        if (e.response) {
          console.log(`❌ Búsqueda "${query}" - Status: ${e.response.status}`);
        } else {
          console.log(`❌ Búsqueda "${query}" - Error: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.error("Error buscando estaciones SiriusXM:", e.message);
  }

  // 4. Probar endpoint de airplay por estación con diferentes parámetros
  console.log("\n📡 4. PROBANDO ENDPOINTS DE AIRPLAY...");

  try {
    // Probar diferentes variaciones del endpoint de airplay
    const airplayEndpoints = [
      `/radio/artist/${ARTIST_ID}/airplay-totals/station`,
      `/radio/artist/${ARTIST_ID}/airplay/station`,
      `/radio/artist/${ARTIST_ID}/airplay-totals`,
      `/radio/artist/${ARTIST_ID}/airplay`,
    ];

    for (const endpoint of airplayEndpoints) {
      try {
        console.log(`\n🔍 Probando: ${endpoint}`);
        const response = await http.get(endpoint, {
          params: { since: "2024-01-01", limit: 10 },
        });

        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        if (response.data && response.data.obj) {
          console.log(`   Datos: ${response.data.obj.length} elementos`);
          if (response.data.obj.length > 0) {
            console.log("   Primeros elementos:");
            response.data.obj.slice(0, 3).forEach((item) => {
              console.log(`     ${JSON.stringify(item)}`);
            });
          }
        }
      } catch (e) {
        if (e.response) {
          console.log(`❌ ${endpoint} - Status: ${e.response.status}`);
          if (e.response.data) {
            console.log(`   Error: ${JSON.stringify(e.response.data)}`);
          }
        } else {
          console.log(`❌ ${endpoint} - Error: ${e.message}`);
        }
      }
    }
  } catch (e) {
    console.error("Error explorando airplay:", e.message);
  }

  console.log("\n✅ EXPLORACIÓN COMPLETADA");
}

exploreAPI().catch(console.error);

