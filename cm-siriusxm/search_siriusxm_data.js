// Script específico para buscar datos de SiriusXM para nuestro artista
// Basado en que encontramos que está en charts de Argentina pero no de US

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

async function searchSiriusXMData() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 BUSCANDO DATOS ESPECÍFICOS DE SIRIUSXM");
  console.log("==========================================\n");

  // 1. Buscar en charts de US con períodos más amplios
  console.log("📡 1. BUSCANDO EN CHARTS DE US (PERÍODOS AMPLIOS)...");
  
  const usChartConfigs = [
    { since: "2020-01-01", duration: "weekly", limit: 200 },
    { since: "2019-01-01", duration: "weekly", limit: 200 },
    { since: "2018-01-01", duration: "weekly", limit: 200 },
    { since: "2020-01-01", duration: "monthly", limit: 200 }
  ];

  for (const config of usChartConfigs) {
    try {
      console.log(`\n🔍 Probando US Charts: since=${config.since}, duration=${config.duration}, limit=${config.limit}`);
      
      const response = await http.get("/charts/airplay/artists", { 
        params: { ...config, country_code: "US" } 
      });
      
      if (response.data?.obj?.data) {
        const artists = response.data.obj.data;
        const ourArtist = artists.find(a => a.id === ARTIST_ID);
        
        if (ourArtist) {
          console.log(`\n🎯 ARTISTA ENCONTRADO EN US CHARTS:`);
          console.log(`   Nombre: ${ourArtist.name}`);
          console.log(`   Plays: ${ourArtist.plays?.toLocaleString() || 0}`);
          console.log(`   Rank: ${ourArtist.rank || 'N/A'}`);
          console.log(`   Peak Rank: ${ourArtist.peak_rank || 'N/A'}`);
          console.log(`   Config: ${JSON.stringify(config)}`);
          return; // Encontramos lo que buscamos
        }
      }
      
      // Esperar un poco para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (e) {
      if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`❌ Error: ${e.response?.status || e.message}`);
      }
    }
  }

  // 2. Buscar en endpoints específicos de SiriusXM
  console.log("\n📡 2. BUSCANDO EN ENDPOINTS ESPECÍFICOS DE SIRIUSXM...");
  
  const siriusXMEndpoints = [
    "/radio/siriusxm/artist",
    "/radio/siriusxm/artist/plays",
    "/radio/siriusxm/artist/airplay",
    "/radio/siriusxm/plays",
    "/radio/siriusxm/airplay",
    "/radio/siriusxm/stations",
    "/radio/siriusxm/artist/127473",
    "/radio/siriusxm/artist/127473/plays",
    "/radio/siriusxm/artist/127473/airplay"
  ];

  for (const endpoint of siriusXMEndpoints) {
    try {
      console.log(`\n🔍 Probando: ${endpoint}`);
      
      const response = await http.get(endpoint);
      console.log(`✅ Status: ${response.status}`);
      
      if (response.data) {
        console.log(`📊 Datos recibidos:`, JSON.stringify(response.data, null, 2));
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (e) {
      if (e.response?.status === 404) {
        console.log(`❌ Endpoint no existe: ${endpoint}`);
      } else if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`❌ Error ${e.response?.status || 'N/A'}: ${e.message}`);
      }
    }
  }

  // 3. Buscar en datos de radio de US específicamente
  console.log("\n📡 3. BUSCANDO EN DATOS DE RADIO DE US...");
  
  try {
    console.log("🔍 Probando endpoint de radio de US para nuestro artista...");
    
    const response = await http.get(`/radio/artist/${ARTIST_ID}/airplay-totals/station`, {
      params: { since: "2020-01-01", country_code: "US" }
    });
    
    if (response.data?.obj) {
      const stations = response.data.obj;
      console.log(`✅ Encontradas ${stations.length} estaciones en US`);
      
      stations.forEach((station, index) => {
        console.log(`   ${index + 1}. ${station.name} (${station.country}): ${station.plays?.toLocaleString() || 0} plays`);
      });
      
      // Filtrar estaciones que podrían ser SiriusXM
      const siriusXMStations = stations.filter(station => {
        const name = (station.name || '').toLowerCase();
        return name.includes('sirius') || name.includes('xm') || name.includes('satellite');
      });
      
      if (siriusXMStations.length > 0) {
        console.log(`\n🎯 ESTACIONES SIRIUSXM ENCONTRADAS EN US:`);
        siriusXMStations.forEach(station => {
          console.log(`   📻 ${station.name}: ${station.plays?.toLocaleString() || 0} plays`);
        });
      } else {
        console.log(`\n❌ No se encontraron estaciones SiriusXM en US`);
      }
    }
    
  } catch (e) {
    console.log(`❌ Error en radio US: ${e.response?.status || e.message}`);
  }

  console.log("\n✅ BÚSQUEDA COMPLETADA");
}

searchSiriusXMData().catch(console.error);

