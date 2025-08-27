// Script para buscar nuestro artista específico en Airplay Charts
// Usando el parámetro cm_artist para filtrar por ID específico

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

async function searchArtistCharts() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 BUSCANDO NUESTRO ARTISTA EN AIRPLAY CHARTS");
  console.log("==============================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID} (Airbag)`);
  console.log("📡 Usando parámetro cm_artist para búsqueda específica\n");

  // Configuraciones para buscar nuestro artista específico
  const searchConfigs = [
    {
      name: "Artistas Globales - Filtrado por cm_artist",
      params: {
        cm_artist: ARTIST_ID,
        since: "2020-01-01",
        duration: "weekly",
        limit: 100,
      },
    },
    {
      name: "Artistas US - Filtrado por cm_artist",
      params: {
        cm_artist: ARTIST_ID,
        since: "2020-01-01",
        duration: "weekly",
        country_code: "US",
        limit: 100,
      },
    },
    {
      name: "Artistas Argentina - Filtrado por cm_artist",
      params: {
        cm_artist: ARTIST_ID,
        since: "2020-01-01",
        duration: "weekly",
        country_code: "AR",
        limit: 100,
      },
    },
    {
      name: "Artistas Uruguay - Filtrado por cm_artist",
      params: {
        cm_artist: ARTIST_ID,
        since: "2020-01-01",
        duration: "weekly",
        country_code: "UY",
        limit: 100,
      },
    },
    {
      name: "Artistas Globales - Período amplio",
      params: {
        cm_artist: ARTIST_ID,
        since: "2018-01-01",
        duration: "weekly",
        limit: 100,
      },
    },
    {
      name: "Artistas US - Período amplio",
      params: {
        cm_artist: ARTIST_ID,
        since: "2018-01-01",
        duration: "weekly",
        country_code: "US",
        limit: 100,
      },
    },
  ];

  for (const config of searchConfigs) {
    try {
      console.log(`\n🔍 Probando: ${config.name}`);
      console.log(`📡 GET /charts/airplay/artists con params:`, config.params);

      const response = await http.get("/charts/airplay/artists", {
        params: config.params,
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Total de resultados: ${response.data?.obj?.length || 0}`);

      if (response.data?.obj?.data && response.data.obj.data.length > 0) {
        const artists = response.data.obj.data;
        console.log(`🎯 NUESTRO ARTISTA ENCONTRADO:`);

        artists.forEach((artist, index) => {
          console.log(
            `   ${index + 1}. ${artist.name} (${
              artist.code2?.toUpperCase() || "N/A"
            })`
          );
          console.log(`      Plays: ${artist.plays?.toLocaleString() || 0}`);
          console.log(`      Rank: ${artist.rank || "N/A"}`);
          console.log(`      Peak Rank: ${artist.peak_rank || "N/A"}`);
          console.log(
            `      Tiempo en chart: ${artist.time_on_chart || "N/A"} días`
          );
          console.log(`      Fecha peak: ${artist.peak_date || "N/A"}`);
          console.log(`      Velocity: ${artist.velocity || "N/A"}`);
          console.log(`      Pre Rank: ${artist.pre_rank || "N/A"}`);
        });

        // Si encontramos datos, mostrar también las estadísticas de ranking
        if (artists[0]?.rankStats && artists[0].rankStats.length > 0) {
          console.log(`\n📈 HISTORIAL DE RANKING:`);
          artists[0].rankStats.slice(0, 10).forEach((stat, index) => {
            console.log(
              `   ${index + 1}. Rank: ${stat.rank}, Plays: ${
                stat.plays?.toLocaleString() || 0
              }, Fecha: ${stat.timestp || "N/A"}`
            );
          });
        }

        return; // Encontramos lo que buscamos
      } else {
        console.log(`❌ No se encontraron resultados para esta configuración`);
      }

      // Esperar un poco para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (e) {
      if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (e.response?.status === 400) {
        console.log(`❌ Bad Request: ${JSON.stringify(e.response.data)}`);
      } else {
        console.log(`❌ Error ${e.response?.status || "N/A"}: ${e.message}`);
      }
    }
  }

  // Si no encontramos nada con cm_artist, probar sin filtro pero buscando manualmente
  console.log("\n🔍 BÚSQUEDA ALTERNATIVA: Sin filtro cm_artist...");

  try {
    console.log("📡 GET /charts/airplay/artists (US, weekly, limit 500)");

    const response = await http.get("/charts/airplay/artists", {
      params: {
        since: "2020-01-01",
        duration: "weekly",
        country_code: "US",
        limit: 500,
      },
    });

    if (response.data?.obj?.data) {
      const artists = response.data.obj.data;
      const ourArtist = artists.find((a) => a.id === ARTIST_ID);

      if (ourArtist) {
        console.log(`\n🎯 ARTISTA ENCONTRADO EN BÚSQUEDA MANUAL:`);
        console.log(`   Nombre: ${ourArtist.name}`);
        console.log(`   Plays: ${ourArtist.plays?.toLocaleString() || 0}`);
        console.log(`   Rank: ${ourArtist.rank || "N/A"}`);
        console.log(`   Peak Rank: ${ourArtist.peak_rank || "N/A"}`);
      } else {
        console.log(`\n❌ Artista no encontrado en top 500 de US`);
      }
    }
  } catch (e) {
    console.log(
      `❌ Error en búsqueda alternativa: ${e.response?.status || e.message}`
    );
  }

  console.log("\n✅ BÚSQUEDA COMPLETADA");
}

searchArtistCharts().catch(console.error);

