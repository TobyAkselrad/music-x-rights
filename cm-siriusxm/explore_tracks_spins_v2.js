// Script de exploración de tracks del artista para encontrar spins SiriusXM - VERSIÓN 2
// Estrategia: Usar endpoints alternativos para obtener tracks y spins

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

async function exploreTracksSpinsV2() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 EXPLORANDO TRACKS DEL ARTISTA PARA ENCONTRAR SPINS SIRIUSXM - V2");
  console.log("========================================================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID}`);
  console.log("💡 Estrategia: Usar endpoints alternativos para tracks y spins\n");

  // 1. PROBAR ENDPOINTS ALTERNATIVOS PARA OBTENER TRACKS
  console.log("📡 1. PROBANDO ENDPOINTS ALTERNATIVOS PARA TRACKS...");

  const trackEndpoints = [
    `/artist/${ARTIST_ID}/tracks`,
    `/artist/${ARTIST_ID}/releases`,
    `/artist/${ARTIST_ID}/songs`,
    `/artist/${ARTIST_ID}/music`,
    `/artist/${ARTIST_ID}/catalog`,
  ];

  let tracks = [];
  let tracksEndpoint = null;

  for (const endpoint of trackEndpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint}`);
      const response = await http.get(endpoint);
      
      if (response.data?.obj?.data && response.data.obj.data.length > 0) {
        tracks = response.data.obj.data;
        tracksEndpoint = endpoint;
        console.log(`✅ ${endpoint} - Encontrados ${tracks.length} tracks`);
        break;
      } else if (response.data?.obj && Array.isArray(response.data.obj)) {
        tracks = response.data.obj;
        tracksEndpoint = endpoint;
        console.log(`✅ ${endpoint} - Encontrados ${tracks.length} tracks (formato alternativo)`);
        break;
      }
    } catch (e) {
      if (e.response) {
        console.log(`❌ ${endpoint} - Status: ${e.response.status}`);
      } else {
        console.log(`❌ ${endpoint} - Error: ${e.message}`);
      }
    }
  }

  if (tracks.length === 0) {
    console.log("\n❌ No se pudieron obtener tracks del artista");
    console.log("💡 Probando estrategia alternativa: buscar en charts...");
    
    // 2. ESTRATEGIA ALTERNATIVA: BUSCAR EN CHARTS
    console.log("\n📡 2. BUSCANDO EN CHARTS DE AIRPLAY...");
    
    try {
      const chartsResponse = await http.get("/charts/airplay/artists", {
        params: { 
          since: "2020-01-01", 
          duration: "weekly", 
          limit: 100,
          cm_artist: ARTIST_ID 
        }
      });

      if (chartsResponse.data?.obj?.data) {
        const chartData = chartsResponse.data.obj.data;
        const ourArtist = chartData.find(a => a.id === ARTIST_ID);
        
        if (ourArtist) {
          console.log(`✅ Artista encontrado en charts: ${ourArtist.name}`);
          console.log(`   Plays totales: ${ourArtist.plays?.toLocaleString() || 0}`);
          
          // Ahora buscar tracks específicos en charts de tracks
          console.log("\n📡 3. BUSCANDO TRACKS EN CHARTS...");
          
          try {
            const tracksChartsResponse = await http.get("/charts/airplay/tracks", {
              params: { 
                since: "2020-01-01", 
                duration: "weekly", 
                limit: 100,
                cm_artist: ARTIST_ID 
              }
            });

            if (tracksChartsResponse.data?.obj?.data) {
              const trackCharts = tracksChartsResponse.data.obj.data;
              console.log(`✅ Encontrados ${trackCharts.length} tracks en charts`);
              
              // Mostrar tracks con más plays
              console.log("\n🎵 TRACKS CON MÁS PLAYS:");
              trackCharts.slice(0, 10).forEach((track, index) => {
                console.log(`   ${index + 1}. ${track.name}: ${track.plays?.toLocaleString() || 0} plays`);
              });

              // 4. BUSCAR SPINS SIRIUSXM POR TRACK ESPECÍFICO
              console.log("\n📡 4. BUSCANDO SPINS SIRIUSXM POR TRACK...");
              
              for (const track of trackCharts.slice(0, 5)) { // Probar solo los 5 primeros
                try {
                  console.log(`\n🔍 Track: ${track.name} (ID: ${track.id})`);
                  
                  // Probar endpoints de track individual
                  const individualTrackEndpoints = [
                    `/track/${track.id}/airplay`,
                    `/track/${track.id}/airplay-totals`,
                    `/track/${track.id}/radio`,
                    `/track/${track.id}/broadcast`,
                  ];

                  for (const endpoint of individualTrackEndpoints) {
                    try {
                      const response = await http.get(endpoint, {
                        params: { since: "2020-01-01", limit: 50 }
                      });

                      if (response.data?.obj) {
                        const data = response.data.obj;
                        
                        if (Array.isArray(data)) {
                          // Buscar estaciones SiriusXM
                          const siriusXMStations = data.filter(item => {
                            if (item.station) {
                              const stationName = (item.station.name || '').toLowerCase();
                              return stationName.includes('sirius') || 
                                     stationName.includes('xm') || 
                                     stationName.includes('satellite');
                            }
                            return false;
                          });

                          if (siriusXMStations.length > 0) {
                            console.log(`   🎯 SIRIUSXM ENCONTRADO en ${endpoint}:`);
                            siriusXMStations.forEach(station => {
                              const plays = station.plays || station.spins || 0;
                              console.log(`      📻 ${station.station.name}: ${plays} plays`);
                            });
                          }
                        }
                      }

                      await new Promise(resolve => setTimeout(resolve, 300));
                      
                    } catch (e) {
                      // Endpoint no existe, continuar
                      continue;
                    }
                  }

                } catch (e) {
                  console.log(`   ❌ Error procesando track: ${e.message}`);
                }
              }
            }
          } catch (e) {
            console.log(`❌ Error obteniendo charts de tracks: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.log(`❌ Error obteniendo charts: ${e.message}`);
    }
  }

  // 5. PROBAR ENDPOINTS DE RADIO ESPECÍFICOS
  console.log("\n📡 5. PROBANDO ENDPOINTS DE RADIO ESPECÍFICOS...");

  try {
    const radioEndpoints = [
      `/radio/artist/${ARTIST_ID}/airplay-totals/station`,
      `/radio/artist/${ARTIST_ID}/airplay/station`,
      `/radio/artist/${ARTIST_ID}/plays/station`,
    ];

    for (const endpoint of radioEndpoints) {
      try {
        console.log(`\n🔍 Probando: ${endpoint}`);
        const response = await http.get(endpoint, {
          params: { since: "2020-01-01", limit: 100 }
        });

        if (response.data?.obj) {
          const stations = response.data.obj;
          console.log(`✅ ${endpoint} - ${stations.length} estaciones`);
          
          // Buscar estaciones SiriusXM
          const siriusXMStations = stations.filter(station => {
            const name = (station.name || '').toLowerCase();
            return name.includes('sirius') || 
                   name.includes('xm') || 
                   name.includes('satellite');
          });

          if (siriusXMStations.length > 0) {
            console.log(`   🎯 SIRIUSXM encontrado: ${siriusXMStations.length} estaciones`);
            siriusXMStations.forEach(station => {
              console.log(`      📻 ${station.name}: ${station.plays?.toLocaleString() || 0} plays`);
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
    console.error("Error probando endpoints de radio:", e.message);
  }

  console.log("\n✅ EXPLORACIÓN DE TRACKS COMPLETADA - V2");
}

exploreTracksSpinsV2().catch(console.error);
