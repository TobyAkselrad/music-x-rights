// Script para buscar datos de radio en mercados de broadcast
// Usando el endpoint /radio/artist/:id/broadcast-markets
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

async function searchBroadcastMarkets() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 BUSCANDO DATOS DE RADIO EN MERCADOS DE BROADCAST");
  console.log("====================================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID} (Airbag)`);
  console.log("📡 Endpoint: /radio/artist/:id/broadcast-markets");
  console.log(
    "💡 Probando períodos históricos para encontrar los 5,43 mil SiriusXM Spins\n"
  );

  // Probar diferentes períodos de tiempo - PERÍODOS EXTENDIDOS
  const timePeriods = [
    { name: "Último año", since: "2024-01-01" },
    { name: "Últimos 2 años", since: "2023-01-01" },
    { name: "Últimos 3 años", since: "2022-01-01" },
    { name: "Últimos 5 años", since: "2020-01-01" },
    { name: "Período amplio", since: "2018-01-01" },
    { name: "Período muy amplio", since: "2015-01-01" },
    { name: "Período histórico", since: "2010-01-01" },
    { name: "Todo el historial", since: "2000-01-01" },
    { name: "Desde el inicio", since: "1990-01-01" },
  ];

  for (const period of timePeriods) {
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

        // Analizar datos por país
        if (data.countryRatios && data.countryRatios.length > 0) {
          console.log(
            `\n🌍 DATOS POR PAÍS (${data.countryRatios.length} países):`
          );

          // Ordenar por count (mayor a menor)
          const sortedCountries = data.countryRatios.sort(
            (a, b) => (b.count || 0) - (a.count || 0)
          );

          sortedCountries.slice(0, 10).forEach((country, index) => {
            console.log(
              `   ${index + 1}. ${country.market} (${
                country.code2?.toUpperCase() || "N/A"
              })`
            );
            console.log(`      Total Count: ${country.market_count_data || 0}`);
            console.log(`      Estaciones: ${country.count_of_stations || 0}`);
            console.log(
              `      Población: ${
                country.population?.toLocaleString() || "N/A"
              }`
            );
            console.log(`      Ratio: ${country.count?.toFixed(4) || "N/A"}`);
          });

          // Buscar específicamente Estados Unidos
          const usData = data.countryRatios.find((c) => c.code2 === "US");
          if (usData) {
            console.log(`\n🇺🇸 ESTADOS UNIDOS ENCONTRADO:`);
            console.log(`   Total Count: ${usData.market_count_data || 0}`);
            console.log(`   Estaciones: ${usData.count_of_stations || 0}`);
            console.log(
              `   Población: ${usData.population?.toLocaleString() || "N/A"}`
            );
            console.log(`   Ratio: ${usData.count?.toFixed(4) || "N/A"}`);

            // Verificar si encontramos los 5,43 mil spins
            const usCount = parseInt(usData.market_count_data) || 0;
            if (usCount >= 5000) {
              console.log(`🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
              console.log(`   Total US: ${usCount.toLocaleString()} plays`);
              console.log(`   Período: ${period.name} (desde ${period.since})`);
              return; // ¡Éxito!
            }
          } else {
            console.log(`❌ Estados Unidos no encontrado en este período`);
          }
        }

        // Analizar datos por ciudad
        if (data.cityRatios && data.cityRatios.length > 0) {
          console.log(
            `\n🏙️ DATOS POR CIUDAD (${data.cityRatios.length} ciudades):`
          );

          // Ordenar por count (mayor a menor)
          const sortedCities = data.cityRatios.sort(
            (a, b) => (b.count || 0) - (a.count || 0)
          );

          // Mostrar top 10 ciudades
          sortedCities.slice(0, 10).forEach((city, index) => {
            console.log(
              `   ${index + 1}. ${city.display_name || city.market} (${
                city.code2?.toUpperCase() || "N/A"
              })`
            );
            console.log(`      Total Count: ${city.market_count_data || 0}`);
            console.log(`      Estaciones: ${city.count_of_stations || 0}`);
            console.log(
              `      Población: ${city.population?.toLocaleString() || "N/A"}`
            );
            console.log(`      Ratio: ${city.count?.toFixed(4) || "N/A"}`);
          });

          // Buscar ciudades de Estados Unidos
          const usCities = data.cityRatios.filter((c) => c.code2 === "US");
          if (usCities.length > 0) {
            console.log(
              `\n🇺🇸 CIUDADES DE ESTADOS UNIDOS (${usCities.length} ciudades):`
            );

            // Ordenar ciudades de US por count
            const sortedUSCities = usCities.sort(
              (a, b) => (b.count || 0) - (a.count || 0)
            );

            sortedUSCities.slice(0, 15).forEach((city, index) => {
              console.log(
                `   ${index + 1}. ${city.display_name || city.market}`
              );
              console.log(`      Total Count: ${city.market_count_data || 0}`);
              console.log(`      Estaciones: ${city.count_of_stations || 0}`);
              console.log(`      Ratio: ${city.count?.toFixed(4) || "N/A"}`);
            });

            // Calcular total de US
            const totalUSCount = usCities.reduce(
              (sum, city) => sum + (parseInt(city.market_count_data) || 0),
              0
            );
            console.log(
              `\n📊 TOTAL ESTADOS UNIDOS: ${totalUSCount.toLocaleString()} plays`
            );

            // Verificar si encontramos los 5,43 mil spins
            if (totalUSCount >= 5000) {
              console.log(`🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
              console.log(
                `   Total US: ${totalUSCount.toLocaleString()} plays`
              );
              console.log(`   Período: ${period.name} (desde ${period.since})`);
              return; // ¡Éxito!
            } else if (totalUSCount > 0) {
              console.log(
                `💡 Datos encontrados pero insuficientes para 5,43 mil spins`
              );
            }
          } else {
            console.log(
              `❌ No se encontraron ciudades de Estados Unidos en este período`
            );
          }
        }

        // Si encontramos datos significativos, continuar buscando en períodos más amplios
        const hasSignificantData =
          (data.countryRatios && data.countryRatios.length > 0) ||
          (data.cityRatios && data.cityRatios.length > 0);

        if (hasSignificantData) {
          console.log(
            `✅ PERÍODO ${period.name} TIENE DATOS - CONTINUANDO BÚSQUEDA`
          );
        }
      } else {
        console.log(`❌ No se encontraron datos para este período`);
      }

      // Esperar un poco para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (e) {
      if (e.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else if (e.response?.status === 400) {
        console.log(`❌ Bad Request: ${JSON.stringify(e.response.data)}`);
      } else if (e.response?.status === 404) {
        console.log(`❌ Endpoint no existe o artista no encontrado`);
      } else {
        console.log(`❌ Error ${e.response?.status || "N/A"}: ${e.message}`);
      }
    }
  }

  console.log("\n❌ NO SE ENCONTRARON LOS 5,43 MIL SIRIUSXM SPINS");
  console.log(
    "💡 Los datos pueden estar en otro endpoint o ser agregados internamente por Chartmetric"
  );
  console.log("\n✅ BÚSQUEDA COMPLETADA");
}

searchBroadcastMarkets().catch(console.error);

