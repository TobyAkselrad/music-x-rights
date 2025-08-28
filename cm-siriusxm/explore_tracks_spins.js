// Script de exploración de tracks del artista para encontrar spins SiriusXM
// Estrategia: Obtener todos los tracks del artista y buscar spins por track individual

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

async function exploreTracksSpins() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 EXPLORANDO TRACKS DEL ARTISTA PARA ENCONTRAR SPINS SIRIUSXM");
  console.log(
    "================================================================\n"
  );
  console.log(`🎯 Artista ID: ${ARTIST_ID}`);
  console.log(
    "💡 Estrategia: Obtener tracks y buscar spins por track individual\n"
  );

  // 1. OBTENER TODOS LOS TRACKS DEL ARTISTA
  console.log("📡 1. OBTENIENDO TRACKS DEL ARTISTA...");

  try {
    const tracksResponse = await http.get(`/artist/${ARTIST_ID}/tracks`);

    if (tracksResponse.data?.obj?.data) {
      const tracks = tracksResponse.data.obj.data;
      console.log(`✅ Encontrados ${tracks.length} tracks`);

      // Mostrar los primeros tracks
      console.log("\n🎵 PRIMEROS TRACKS ENCONTRADOS:");
      tracks.slice(0, 10).forEach((track, index) => {
        console.log(`   ${index + 1}. ${track.name} (ID: ${track.id})`);
      });

      // 2. BUSCAR SPINS POR TRACK INDIVIDUAL
      console.log("\n📡 2. BUSCANDO SPINS POR TRACK INDIVIDUAL...");

      let totalSpinsFound = 0;
      const tracksWithSpins = [];

      for (const track of tracks.slice(0, 20)) {
        // Limitar a 20 tracks para no sobrecargar la API
        try {
          console.log(`\n🔍 Track: ${track.name} (ID: ${track.id})`);

          // Probar diferentes endpoints para obtener spins del track
          const trackEndpoints = [
            `/track/${track.id}/airplay`,
            `/track/${track.id}/airplay-totals`,
            `/track/${track.id}/radio`,
            `/track/${track.id}/broadcast`,
            `/track/${track.id}/plays`,
            `/track/${track.id}/spins`,
          ];

          for (const endpoint of trackEndpoints) {
            try {
              const response = await http.get(endpoint, {
                params: { since: "2020-01-01", limit: 50 },
              });

              if (response.data?.obj) {
                const data = response.data.obj;

                if (Array.isArray(data)) {
                  // Buscar estaciones SiriusXM en los datos
                  const siriusXMStations = data.filter((item) => {
                    if (item.station) {
                      const stationName = (
                        item.station.name || ""
                      ).toLowerCase();
                      return (
                        stationName.includes("sirius") ||
                        stationName.includes("xm") ||
                        stationName.includes("satellite")
                      );
                    }
                    return false;
                  });

                  if (siriusXMStations.length > 0) {
                    console.log(`   🎯 SIRIUSXM ENCONTRADO en ${endpoint}:`);
                    siriusXMStations.forEach((station) => {
                      const plays = station.plays || station.spins || 0;
                      console.log(
                        `      📻 ${station.station.name}: ${plays} plays`
                      );
                      totalSpinsFound += plays;
                    });

                    tracksWithSpins.push({
                      track: track.name,
                      trackId: track.id,
                      siriusXMData: siriusXMStations,
                    });
                  }
                }
              }

              // Esperar para evitar rate limiting
              await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (e) {
              // Endpoint no existe o error, continuar
              continue;
            }
          }
        } catch (e) {
          console.log(`   ❌ Error procesando track: ${e.message}`);
        }
      }

      // 3. RESUMEN FINAL
      console.log("\n📊 RESUMEN FINAL:");
      console.log(
        `   Total de tracks procesados: ${Math.min(tracks.length, 20)}`
      );
      console.log(`   Tracks con datos SiriusXM: ${tracksWithSpins.length}`);
      console.log(
        `   Total de spins SiriusXM encontrados: ${totalSpinsFound.toLocaleString()}`
      );

      if (tracksWithSpins.length > 0) {
        console.log("\n🎯 TRACKS CON DATOS SIRIUSXM:");
        tracksWithSpins.forEach((item) => {
          console.log(
            `   • ${item.track}: ${item.siriusXMData.length} estaciones SiriusXM`
          );
        });
      }
    } else {
      console.log("❌ No se pudieron obtener los tracks del artista");
    }
  } catch (e) {
    console.error("❌ Error obteniendo tracks:", e.message);
  }

  // 4. PROBAR ENDPOINTS ALTERNATIVOS PARA TRACKS
  console.log("\n📡 3. PROBANDO ENDPOINTS ALTERNATIVOS PARA TRACKS...");

  try {
    const alternativeEndpoints = [
      `/artist/${ARTIST_ID}/tracks/airplay`,
      `/artist/${ARTIST_ID}/tracks/radio`,
      `/artist/${ARTIST_ID}/tracks/broadcast`,
      `/artist/${ARTIST_ID}/tracks/plays`,
      `/artist/${ARTIST_ID}/tracks/spins`,
    ];

    for (const endpoint of alternativeEndpoints) {
      try {
        console.log(`\n🔍 Probando: ${endpoint}`);
        const response = await http.get(endpoint, {
          params: { since: "2020-01-01", limit: 20 },
        });

        if (response.data?.obj) {
          console.log(`✅ ${endpoint} - Status: ${response.status}`);
          const data = response.data.obj;

          if (Array.isArray(data)) {
            console.log(`   Datos: ${data.length} elementos`);

            // Buscar estaciones SiriusXM
            const siriusXMData = data.filter((item) => {
              if (item.station) {
                const stationName = (item.station.name || "").toLowerCase();
                return (
                  stationName.includes("sirius") ||
                  stationName.includes("xm") ||
                  stationName.includes("satellite")
                );
              }
              return false;
            });

            if (siriusXMData.length > 0) {
              console.log(
                `   🎯 SIRIUSXM encontrado: ${siriusXMData.length} elementos`
              );
              siriusXMData.slice(0, 3).forEach((item) => {
                console.log(
                  `      ${item.station?.name}: ${
                    item.plays || item.spins || 0
                  } plays`
                );
              });
            }
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
    console.error("Error probando endpoints alternativos:", e.message);
  }

  console.log("\n✅ EXPLORACIÓN DE TRACKS COMPLETADA");
}

exploreTracksSpins().catch(console.error);
