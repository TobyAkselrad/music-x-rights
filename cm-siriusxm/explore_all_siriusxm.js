// Script para explorar TODOS los endpoints posibles relacionados con SiriusXM
// Basado en que los Airplay Charts no contienen los datos que buscamos

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

async function exploreAllSiriusXM() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 EXPLORANDO TODOS LOS ENDPOINTS POSIBLES DE SIRIUSXM");
  console.log("========================================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID} (Airbag)`);
  console.log("📡 Probando todas las variaciones posibles\n");

  // 1. Endpoints específicos de SiriusXM
  console.log("📡 1. ENDPOINTS ESPECÍFICOS DE SIRIUSXM...");

  const siriusXMEndpoints = [
    "/siriusxm/artist",
    "/siriusxm/artist/plays",
    "/siriusxm/artist/airplay",
    "/siriusxm/plays",
    "/siriusxm/airplay",
    "/siriusxm/stations",
    "/siriusxm/artist/127473",
    "/siriusxm/artist/127473/plays",
    "/siriusxm/artist/127473/airplay",
    "/siriusxm/artist/127473/stations",
    "/siriusxm/artist/127473/tracks",
    "/siriusxm/artist/127473/charts",
    "/siriusxm/artist/127473/radio",
    "/siriusxm/artist/127473/broadcast",
    "/siriusxm/artist/127473/streaming",
    "/siriusxm/artist/127473/listening",
    "/siriusxm/artist/127473/audience",
    "/siriusxm/artist/127473/reach",
    "/siriusxm/artist/127473/impressions",
    "/siriusxm/artist/127473/spins",
  ];

  for (const endpoint of siriusXMEndpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint}`);

      const response = await http.get(endpoint);
      console.log(`✅ Status: ${response.status}`);

      if (response.data) {
        console.log(
          `📊 Datos recibidos:`,
          JSON.stringify(response.data, null, 2)
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (e) {
      if (e.response?.status === 404) {
        console.log(`❌ Endpoint no existe: ${endpoint}`);
      } else if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log(`❌ Error ${e.response?.status || "N/A"}: ${e.message}`);
      }
    }
  }

  // 2. Endpoints de radio con filtros específicos
  console.log("\n📡 2. ENDPOINTS DE RADIO CON FILTROS SIRIUSXM...");

  const radioEndpoints = [
    "/radio/artist/127473/airplay-totals/station",
    "/radio/artist/127473/airplay/station",
    "/radio/artist/127473/plays/station",
    "/radio/artist/127473/broadcast/station",
    "/radio/artist/127473/streaming/station",
    "/radio/artist/127473/listening/station",
    "/radio/artist/127473/audience/station",
    "/radio/artist/127473/reach/station",
    "/radio/artist/127473/impressions/station",
    "/radio/artist/127473/spins/station",
  ];

  for (const endpoint of radioEndpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint}`);

      const response = await http.get(endpoint, {
        params: { since: "2020-01-01", country_code: "US" },
      });

      console.log(`✅ Status: ${response.status}`);

      if (response.data?.obj) {
        const stations = response.data.obj;
        console.log(`📊 Encontradas ${stations.length} estaciones`);

        if (stations.length > 0) {
          console.log("📻 Primeras estaciones:");
          stations.slice(0, 5).forEach((station, index) => {
            console.log(
              `   ${index + 1}. ${station.name} (${station.country}): ${
                station.plays?.toLocaleString() || 0
              } plays`
            );
          });

          // Filtrar estaciones SiriusXM
          const siriusXMStations = stations.filter((station) => {
            const name = (station.name || "").toLowerCase();
            return (
              name.includes("sirius") ||
              name.includes("xm") ||
              name.includes("satellite")
            );
          });

          if (siriusXMStations.length > 0) {
            console.log(`\n🎯 ESTACIONES SIRIUSXM ENCONTRADAS:`);
            siriusXMStations.forEach((station) => {
              console.log(
                `   📻 ${station.name}: ${
                  station.plays?.toLocaleString() || 0
                } plays`
              );
            });
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (e) {
      if (e.response?.status === 404) {
        console.log(`❌ Endpoint no existe: ${endpoint}`);
      } else if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log(`❌ Error ${e.response?.status || "N/A"}: ${e.message}`);
      }
    }
  }

  // 3. Endpoints de charts alternativos
  console.log("\n📡 3. ENDPOINTS DE CHARTS ALTERNATIVOS...");

  const chartEndpoints = [
    "/charts/radio/artists",
    "/charts/radio/tracks",
    "/charts/broadcast/artists",
    "/charts/broadcast/tracks",
    "/charts/streaming/artists",
    "/charts/streaming/tracks",
    "/charts/listening/artists",
    "/charts/listening/tracks",
    "/charts/audience/artists",
    "/charts/audience/tracks",
    "/charts/reach/artists",
    "/charts/reach/tracks",
    "/charts/impressions/artists",
    "/charts/impressions/tracks",
    "/charts/spins/artists",
    "/charts/spins/tracks",
  ];

  for (const endpoint of chartEndpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint}`);

      const response = await http.get(endpoint, {
        params: {
          since: "2020-01-01",
          duration: "weekly",
          country_code: "US",
          limit: 50,
        },
      });

      console.log(`✅ Status: ${response.status}`);

      if (response.data?.obj?.data) {
        const data = response.data.obj.data;
        console.log(`📊 Encontrados ${data.length} elementos`);

        // Buscar nuestro artista
        const ourArtist = data.find(
          (item) => item.id === ARTIST_ID || item.cm_artist === ARTIST_ID
        );
        if (ourArtist) {
          console.log(`🎯 NUESTRO ARTISTA ENCONTRADO EN ${endpoint}:`);
          console.log(`   Nombre: ${ourArtist.name || "N/A"}`);
          console.log(
            `   Plays/Spins: ${
              ourArtist.plays?.toLocaleString() ||
              ourArtist.spins?.toLocaleString() ||
              "N/A"
            }`
          );
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (e) {
      if (e.response?.status === 404) {
        console.log(`❌ Endpoint no existe: ${endpoint}`);
      } else if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log(`❌ Error ${e.response?.status || "N/A"}: ${e.message}`);
      }
    }
  }

  console.log("\n✅ EXPLORACIÓN COMPLETADA");
}

exploreAllSiriusXM().catch(console.error);

