// Script de prueba para el endpoint de Airplay Charts
// Este endpoint puede contener los datos de SiriusXM que buscamos

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

async function testAirplayCharts() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 PROBANDO ENDPOINT DE AIRPLAY CHARTS");
  console.log("=======================================\n");

  // Probar diferentes configuraciones del endpoint
  const testConfigs = [
    {
      name: "Artistas Globales (diario)",
      params: { since: "2024-01-01", duration: "daily", limit: 100 }
    },
    {
      name: "Artistas US (diario)",
      params: { since: "2024-01-01", duration: "daily", country_code: "US", limit: 100 }
    },
    {
      name: "Artistas US (semanal)",
      params: { since: "2024-01-01", duration: "weekly", country_code: "US", limit: 100 }
    },
    {
      name: "Artistas Globales (semanal)",
      params: { since: "2024-01-01", duration: "weekly", limit: 100 }
    },
    {
      name: "Artistas Argentina (diario)",
      params: { since: "2024-01-01", duration: "daily", country_code: "AR", limit: 100 }
    },
    {
      name: "Artistas Uruguay (diario)",
      params: { since: "2024-01-01", duration: "daily", country_code: "UY", limit: 100 }
    },
    {
      name: "Artistas Argentina (semanal)",
      params: { since: "2024-01-01", duration: "weekly", country_code: "AR", limit: 100 }
    },
    {
      name: "Artistas Uruguay (semanal)",
      params: { since: "2024-01-01", duration: "weekly", country_code: "UY", limit: 100 }
    },
    {
      name: "Período más amplio - Argentina (2020-2024)",
      params: { since: "2020-01-01", duration: "weekly", country_code: "AR", limit: 100 }
    }
  ];

  for (const config of testConfigs) {
    try {
      console.log(`\n🔍 Probando: ${config.name}`);
      console.log(`📡 GET /charts/airplay/artists con params:`, config.params);
      
      const response = await http.get("/charts/airplay/artists", { params: config.params });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Total de artistas: ${response.data?.obj?.length || 0}`);
      
      if (response.data?.obj?.data && response.data.obj.data.length > 0) {
        const artists = response.data.obj.data;
        console.log(`📝 Primeros 5 artistas:`);
        
        artists.slice(0, 5).forEach((artist, index) => {
          console.log(`   ${index + 1}. ${artist.name} (${artist.code2?.toUpperCase() || 'N/A'}): ${artist.plays?.toLocaleString() || 0} plays, Rank: ${artist.rank || 'N/A'}`);
        });
        
        // Buscar si nuestro artista está en la lista
        const ourArtist = artists.find(a => a.id === ARTIST_ID);
        if (ourArtist) {
          console.log(`\n🎯 NUESTRO ARTISTA ENCONTRADO:`);
          console.log(`   Nombre: ${ourArtist.name}`);
          console.log(`   País: ${ourArtist.code2?.toUpperCase() || 'N/A'}`);
          console.log(`   Plays: ${ourArtist.plays?.toLocaleString() || 0}`);
          console.log(`   Rank: ${ourArtist.rank || 'N/A'}`);
          console.log(`   Peak Rank: ${ourArtist.peak_rank || 'N/A'}`);
          console.log(`   Tiempo en chart: ${ourArtist.time_on_chart || 'N/A'} días`);
        } else {
          console.log(`❌ Nuestro artista (ID: ${ARTIST_ID}) no está en esta lista`);
        }
      }
      
    } catch (e) {
      if (e.response) {
        console.log(`❌ Status: ${e.response.status}`);
        if (e.response.data) {
          console.log(`   Error: ${JSON.stringify(e.response.data)}`);
        }
      } else {
        console.log(`❌ Error: ${e.message}`);
      }
    }
  }

  // Probar también el endpoint de tracks
  console.log("\n🔍 PROBANDO ENDPOINT DE TRACKS AIRPLAY CHARTS");
  console.log("===============================================\n");

  try {
    console.log("📡 GET /charts/airplay/tracks con params: { since: '2024-01-01', duration: 'weekly', country_code: 'AR', limit: 50 }");
    
    const tracksResponse = await http.get("/charts/airplay/tracks", { 
      params: { since: "2024-01-01", duration: "weekly", country_code: "AR", limit: 50 } 
    });
    
    console.log(`✅ Status: ${tracksResponse.status}`);
    console.log(`📊 Total de tracks: ${tracksResponse.data?.obj?.length || 0}`);
    
    if (tracksResponse.data?.obj?.data && tracksResponse.data.obj.data.length > 0) {
      const tracks = tracksResponse.data.obj.data;
      console.log(`📝 Primeros 5 tracks:`);
      
      tracks.slice(0, 5).forEach((track, index) => {
        console.log(`   ${index + 1}. ${track.name} - ${track.artist_name || 'N/A'} (${track.code2?.toUpperCase() || 'N/A'}): ${track.plays?.toLocaleString() || 0} plays, Rank: ${track.rank || 'N/A'}`);
      });
    }
    
  } catch (e) {
    if (e.response) {
      console.log(`❌ Status: ${e.response.status}`);
      if (e.response.data) {
        console.log(`   Error: ${JSON.stringify(e.response.data)}`);
      }
    } else {
      console.log(`❌ Error: ${e.message}`);
    }
  }

  console.log("\n✅ PRUEBA COMPLETADA");
}

testAirplayCharts().catch(console.error);

