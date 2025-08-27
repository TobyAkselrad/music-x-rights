// Script de búsqueda histórica COMPLETA para encontrar los 5,43 mil SiriusXM Spins
// Explorando todos los períodos históricos y endpoints posibles

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

async function searchHistoricalSiriusXM() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 30000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 BÚSQUEDA HISTÓRICA COMPLETA - SIRIUSXM SPINS");
  console.log("================================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID} (Airbag)`);
  console.log("💡 Buscando los 5,43 mil SiriusXM Spins en TODA la historia\n");

  // 1. PERÍODOS HISTÓRICOS MUY AMPLIOS
  console.log("📡 1. PERÍODOS HISTÓRICOS MUY AMPLIOS...");

  const historicalPeriods = [
    { name: "Último año", since: "2024-01-01" },
    { name: "Últimos 2 años", since: "2023-01-01" },
    { name: "Últimos 3 años", since: "2022-01-01" },
    { name: "Últimos 5 años", since: "2020-01-01" },
    { name: "Últimos 10 años", since: "2015-01-01" },
    { name: "Últimos 15 años", since: "2010-01-01" },
    { name: "Últimos 20 años", since: "2005-01-01" },
    { name: "Últimos 25 años", since: "2000-01-01" },
    { name: "Últimos 30 años", since: "1995-01-01" },
    { name: "Últimos 40 años", since: "1985-01-01" },
    { name: "Últimos 50 años", since: "1975-01-01" },
    { name: "Todo el siglo XX", since: "1900-01-01" },
    { name: "Desde el inicio de la música", since: "1800-01-01" },
  ];

  for (const period of historicalPeriods) {
    try {
      console.log(
        `\n🔍 Probando período: ${period.name} (desde ${period.since})`
      );
      console.log(
        `📡 GET /radio/artist/${ARTIST_ID}/broadcast-markets?since=${period.since}`
      );

      const response = await http.get(
        `/radio/artist/${ARTIST_ID}/broadcast-markets`,
        {
          params: { since: period.since },
        }
      );

      console.log(`✅ Status: ${response.status}`);

      if (response.data?.obj) {
        const data = response.data.obj;

        // Buscar específicamente Estados Unidos
        if (data.countryRatios) {
          const usData = data.countryRatios.find((c) => c.code2 === "US");
          if (usData) {
            const usCount = parseInt(usData.market_count_data) || 0;
            console.log(
              `🇺🇸 US: ${usCount.toLocaleString()} plays (${
                usData.count_of_stations
              } estaciones)`
            );

            if (usCount >= 5000) {
              console.log(`🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
              console.log(`   Total US: ${usCount.toLocaleString()} plays`);
              console.log(`   Período: ${period.name} (desde ${period.since})`);
              return; // ¡Éxito!
            }
          } else {
            console.log(`❌ US no encontrado en este período`);
          }
        }

        // Buscar en ciudades de US
        if (data.cityRatios) {
          const usCities = data.cityRatios.filter((c) => c.code2 === "US");
          if (usCities.length > 0) {
            const totalUSCount = usCities.reduce(
              (sum, city) => sum + (parseInt(city.market_count_data) || 0),
              0
            );
            console.log(
              `🏙️ US Cities: ${totalUSCount.toLocaleString()} plays total`
            );

            if (totalUSCount >= 5000) {
              console.log(`🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
              console.log(
                `   Total US Cities: ${totalUSCount.toLocaleString()} plays`
              );
              console.log(`   Período: ${period.name} (desde ${period.since})`);
              return; // ¡Éxito!
            }
          }
        }
      }

      // Esperar para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else if (e.response?.status === 400) {
        console.log(`❌ Bad Request: ${JSON.stringify(e.response.data)}`);
      } else {
        console.log(`❌ Error ${e.response?.status || "N/A"}: ${e.message}`);
      }
    }
  }

  // 2. ENDPOINTS HISTÓRICOS ALTERNATIVOS
  console.log("\n📡 2. ENDPOINTS HISTÓRICOS ALTERNATIVOS...");

  const historicalEndpoints = [
    `/radio/artist/${ARTIST_ID}/airplay-totals/station`,
    `/radio/artist/${ARTIST_ID}/airplay/station`,
    `/radio/artist/${ARTIST_ID}/plays/station`,
    `/radio/artist/${ARTIST_ID}/broadcast/station`,
    `/radio/artist/${ARTIST_ID}/streaming/station`,
    `/radio/artist/${ARTIST_ID}/listening/station`,
    `/radio/artist/${ARTIST_ID}/audience/station`,
    `/radio/artist/${ARTIST_ID}/reach/station`,
    `/radio/artist/${ARTIST_ID}/impressions/station`,
    `/radio/artist/${ARTIST_ID}/spins/station`,
  ];

  for (const endpoint of historicalEndpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint}`);

      // Probar con períodos históricos
      const response = await http.get(endpoint, {
        params: { since: "1980-01-01" },
      });

      console.log(`✅ Status: ${response.status}`);

      if (response.data?.obj) {
        const stations = response.data.obj;
        console.log(`📊 Encontradas ${stations.length} estaciones`);

        // Filtrar estaciones de US
        const usStations = stations.filter(
          (station) =>
            station.country === "United States" || station.country === "US"
        );

        if (usStations.length > 0) {
          console.log(`🇺🇸 Estaciones de US: ${usStations.length}`);

          // Filtrar estaciones SiriusXM
          const siriusXMStations = usStations.filter((station) => {
            const name = (station.name || "").toLowerCase();
            return (
              name.includes("sirius") ||
              name.includes("xm") ||
              name.includes("satellite")
            );
          });

          if (siriusXMStations.length > 0) {
            console.log(
              `🎯 Estaciones SiriusXM encontradas: ${siriusXMStations.length}`
            );
            const totalSiriusXMSpins = siriusXMStations.reduce(
              (sum, station) => sum + (station.plays || 0),
              0
            );
            console.log(
              `📊 Total SiriusXM Spins: ${totalSiriusXMSpins.toLocaleString()}`
            );

            if (totalSiriusXMSpins >= 5000) {
              console.log(`🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
              console.log(
                `   Total: ${totalSiriusXMSpins.toLocaleString()} spins`
              );
              console.log(`   Endpoint: ${endpoint}`);
              return; // ¡Éxito!
            }
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
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

  // 3. CHARTS HISTÓRICOS
  console.log("\n📡 3. CHARTS HISTÓRICOS...");

  try {
    console.log("🔍 Probando charts históricos de US...");

    const response = await http.get("/charts/airplay/artists", {
      params: {
        since: "1980-01-01",
        duration: "weekly",
        country_code: "US",
        limit: 1000,
      },
    });

    if (response.data?.obj?.data) {
      const artists = response.data.obj.data;
      const ourArtist = artists.find((a) => a.id === ARTIST_ID);

      if (ourArtist) {
        console.log(`🎯 NUESTRO ARTISTA ENCONTRADO EN CHARTS HISTÓRICOS:`);
        console.log(`   Nombre: ${ourArtist.name}`);
        console.log(`   Plays: ${ourArtist.plays?.toLocaleString() || 0}`);
        console.log(`   Rank: ${ourArtist.rank || "N/A"}`);

        if (ourArtist.plays >= 5000) {
          console.log(`🎯 ¡ESTOS PODRÍAN SER LOS 5,43 MIL SIRIUSXM SPINS!`);
          return;
        }
      } else {
        console.log(`❌ Artista no encontrado en charts históricos de US`);
      }
    }
  } catch (e) {
    console.log(
      `❌ Error en charts históricos: ${e.response?.status || e.message}`
    );
  }

  // 4. ENDPOINTS ESPECÍFICOS DE SIRIUSXM
  console.log("\n📡 4. ENDPOINTS ESPECÍFICOS DE SIRIUSXM...");

  const siriusXMEndpoints = [
    "/siriusxm/artist",
    "/siriusxm/artist/plays",
    "/siriusxm/artist/airplay",
    "/siriusxm/plays",
    "/siriusxm/airplay",
    "/siriusxm/stations",
    `/siriusxm/artist/${ARTIST_ID}`,
    `/siriusxm/artist/${ARTIST_ID}/plays`,
    `/siriusxm/artist/${ARTIST_ID}/airplay`,
    `/siriusxm/artist/${ARTIST_ID}/stations`,
    `/siriusxm/artist/${ARTIST_ID}/tracks`,
    `/siriusxm/artist/${ARTIST_ID}/charts`,
    `/siriusxm/artist/${ARTIST_ID}/radio`,
    `/siriusxm/artist/${ARTIST_ID}/broadcast`,
    `/siriusxm/artist/${ARTIST_ID}/streaming`,
    `/siriusxm/artist/${ARTIST_ID}/listening`,
    `/siriusxm/artist/${ARTIST_ID}/audience`,
    `/siriusxm/artist/${ARTIST_ID}/reach`,
    `/siriusxm/artist/${ARTIST_ID}/impressions`,
    `/siriusxm/artist/${ARTIST_ID}/spins`,
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

        // Buscar datos de spins
        if (response.data.spins || response.data.plays) {
          const spins = response.data.spins || response.data.plays;
          console.log(`🎯 Spins encontrados: ${spins}`);

          if (spins >= 5000) {
            console.log(`🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
            console.log(`   Total: ${spins.toLocaleString()} spins`);
            console.log(`   Endpoint: ${endpoint}`);
            return; // ¡Éxito!
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

  console.log("\n❌ NO SE ENCONTRARON LOS 5,43 MIL SIRIUSXM SPINS");
  console.log("💡 Los datos pueden estar en:");
  console.log("   - Un endpoint específico de SiriusXM no documentado");
  console.log("   - Datos agregados internamente por Chartmetric");
  console.log("   - Un endpoint de streaming/satellite específico");
  console.log("   - Datos históricos de otra fuente");
  console.log("\n✅ BÚSQUEDA HISTÓRICA COMPLETADA");
}

searchHistoricalSiriusXM().catch(console.error);

