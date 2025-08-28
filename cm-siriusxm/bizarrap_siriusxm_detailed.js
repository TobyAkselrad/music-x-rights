// Script DETALLADO para obtener TODOS los SiriusXM Spins de BIZARRAP
// Investigando la discrepancia: API muestra 21 vs Dashboard muestra 123
// Basado en la documentación de Chartmetric API

require("dotenv").config();
const axios = require("axios");

const CM_REFRESH_TOKEN = process.env.CM_REFRESH_TOKEN;
const ARTIST_ID = Number(process.env.ARTIST_ID || 648982); // Por defecto Bizarrap, pero configurable

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

async function investigateBizarrapSiriusXM(artistId, token) {
  console.log(`🔍 INVESTIGANDO TODOS LOS SIRIUS XM SPINS DE BIZARRAP`);
  console.log(
    `🎯 Objetivo: Encontrar los 123 spins que aparecen en el dashboard`
  );
  console.log(`📊 API actual muestra: 21 spins`);
  console.log(`📈 Diferencia a investigar: 102 spins\n`);

  let totalMonthly = 0;
  let totalWeekly = 0;
  let totalLatest = 0;
  let trackCount = 0;
  let tracksWithSiriusXM = 0;
  let allTracksData = [];

  // PRIMERA PASADA: Obtener todos los tracks con paginación completa
  console.log(`📡 PASADA 1: Obteniendo TODOS los tracks de Bizarrap...`);

  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const url = `https://api.chartmetric.com/api/track/list/filter?artists[]=${artistId}&limit=${limit}&offset=${offset}`;

      console.log(`📡 GET ${url}`);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      });

      if (response.status !== 200) {
        console.log(`❌ Status: ${response.status}`);
        break;
      }

      const data = response.data;
      const items = data?.obj ?? [];

      if (items.length === 0) {
        console.log(`✅ No hay más tracks (offset: ${offset})`);
        break;
      }

      console.log(`📊 Procesando ${items.length} tracks (offset: ${offset})`);

      // Procesar cada track
      for (const track of items) {
        trackCount++;

        // Obtener datos del track
        const trackName = track.name || "Sin nombre";
        const trackId = track.id || "N/A";
        const isrc = track.isrc || "N/A";

        // SiriusXM Monthly Diff (últimos 28 días)
        const monthlySiriusXM = track?.monthly_diff?.siriusxm_streams ?? 0;

        // SiriusXM Weekly Diff (última semana)
        const weeklySiriusXM = track?.weekly_diff?.siriusxm_streams ?? 0;

        // SiriusXM Latest (snapshot actual)
        const latestSiriusXM = track?.latest?.siriusxm_streams ?? 0;

        // Sumar a los totales
        totalMonthly += monthlySiriusXM;
        totalWeekly += weeklySiriusXM;
        totalLatest += latestSiriusXM;

        // Guardar datos del track
        allTracksData.push({
          name: trackName,
          id: trackId,
          isrc: isrc,
          monthly: monthlySiriusXM,
          weekly: weeklySiriusXM,
          latest: latestSiriusXM,
        });

        // Contar tracks con datos de SiriusXM
        if (monthlySiriusXM > 0 || weeklySiriusXM > 0 || latestSiriusXM > 0) {
          tracksWithSiriusXM++;

          // Mostrar tracks con datos significativos
          if (monthlySiriusXM > 0) {
            console.log(`   🎵 ${trackName}`);
            console.log(
              `      📅 Monthly (28 días): ${monthlySiriusXM.toLocaleString()} spins`
            );
            console.log(
              `      📊 Weekly: ${weeklySiriusXM.toLocaleString()} spins`
            );
            console.log(
              `      🎯 Latest: ${latestSiriusXM.toLocaleString()} spins`
            );
          }
        }
      }

      // Si recibimos menos tracks que el límite, hemos terminado
      if (items.length < limit) {
        console.log(
          `✅ Llegamos al final de los tracks (${items.length} < ${limit})`
        );
        break;
      }

      offset += limit;

      // Esperar un poco para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      if (error.response?.status === 429) {
        console.log(`⏳ Rate limit, esperando 2 segundos...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      } else {
        console.log(`❌ Error: ${error.message}`);
        break;
      }
    }
  }

  // SEGUNDA PASADA: Investigar endpoints alternativos
  console.log(`\n🔍 PASADA 2: Investigando endpoints alternativos...`);

  try {
    // Probar endpoint específico de SiriusXM
    console.log(`\n📡 Probando endpoint específico de SiriusXM...`);
    const siriusXMResponse = await axios.get(
      `https://api.chartmetric.com/api/siriusxm/artist/${artistId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      }
    );

    if (siriusXMResponse.status === 200) {
      console.log(`✅ Endpoint SiriusXM específico disponible`);
      console.log(`📊 Datos:`, JSON.stringify(siriusXMResponse.data, null, 2));
    }
  } catch (error) {
    console.log(
      `❌ Endpoint SiriusXM específico no disponible: ${error.message}`
    );
  }

  try {
    // Probar endpoint de airplay totals
    console.log(`\n📡 Probando endpoint de airplay totals...`);
    const airplayResponse = await axios.get(
      `https://api.chartmetric.com/api/radio/artist/${artistId}/airplay-totals/station`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      }
    );

    if (airplayResponse.status === 200) {
      console.log(`✅ Endpoint airplay totals disponible`);
      console.log(`📊 Datos:`, JSON.stringify(airplayResponse.data, null, 2));
    }
  } catch (error) {
    console.log(`❌ Endpoint airplay totals no disponible: ${error.message}`);
  }

  try {
    // Probar endpoint de plays por estación
    console.log(`\n📡 Probando endpoint de plays por estación...`);
    const playsResponse = await axios.get(
      `https://api.chartmetric.com/api/radio/artist/${artistId}/plays/station`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      }
    );

    if (playsResponse.status === 200) {
      console.log(`✅ Endpoint plays por estación disponible`);
      console.log(`📊 Datos:`, JSON.stringify(playsResponse.data, null, 2));
    }
  } catch (error) {
    console.log(
      `❌ Endpoint plays por estación no disponible: ${error.message}`
    );
  }

  // TERCERA PASADA: Análisis detallado de los tracks
  console.log(`\n🔍 PASADA 3: Análisis detallado de tracks...`);

  // Ordenar tracks por monthly spins
  const sortedTracks = allTracksData.sort((a, b) => b.monthly - a.monthly);

  console.log(`\n📊 TOP 20 TRACKS POR MONTHLY SIRIUS XM SPINS:`);
  sortedTracks.slice(0, 20).forEach((track, index) => {
    if (track.monthly > 0) {
      console.log(`${index + 1}. ${track.name}`);
      console.log(`   📅 Monthly: ${track.monthly} spins`);
      console.log(`   📊 Weekly: ${track.weekly} spins`);
      console.log(`   🎯 Latest: ${track.latest} spins`);
      console.log(`   🆔 ID: ${track.id} | ISRC: ${track.isrc}`);
    }
  });

  // Análisis de tracks con 0 monthly pero con latest > 0
  const tracksWithLatestButNoMonthly = allTracksData.filter(
    (t) => t.monthly === 0 && t.latest > 0
  );
  if (tracksWithLatestButNoMonthly.length > 0) {
    console.log(`\n🔍 TRACKS CON LATEST > 0 PERO MONTHLY = 0:`);
    tracksWithLatestButNoMonthly.slice(0, 10).forEach((track, index) => {
      console.log(`${index + 1}. ${track.name}`);
      console.log(`   🎯 Latest: ${track.latest} spins`);
      console.log(`   📊 Weekly: ${track.weekly} spins`);
    });
  }

  return {
    totalMonthly: totalMonthly,
    totalWeekly: totalWeekly,
    totalLatest: totalLatest,
    trackCount: trackCount,
    tracksWithSiriusXM: tracksWithSiriusXM,
    allTracksData: allTracksData,
  };
}

async function analyzeBizarrapDetailed() {
  try {
    const token = await getAccessToken(CM_REFRESH_TOKEN);

    console.log("🔍 INVESTIGACIÓN DETALLADA DE SIRIUS XM SPINS - BIZARRAP");
    console.log("==========================================================\n");
    console.log(`🎯 Artista: Bizarrap (ID: ${ARTIST_ID})`);
    console.log(`📅 Período: Últimos 28 días (monthly_diff)`);
    console.log(`🎯 Objetivo: Encontrar los 123 spins del dashboard\n`);

    const result = await investigateBizarrapSiriusXM(ARTIST_ID, token);

    console.log("\n" + "=".repeat(80));
    console.log("📊 RESULTADOS FINALES DE LA INVESTIGACIÓN");
    console.log("=".repeat(80));

    console.log(
      `🎵 Total de tracks procesados: ${result.trackCount.toLocaleString()}`
    );
    console.log(
      `📡 Tracks con datos SiriusXM: ${result.tracksWithSiriusXM.toLocaleString()}`
    );
    console.log(
      `🎯 SiriusXM Monthly Spins (28 días): ${result.totalMonthly.toLocaleString()}`
    );
    console.log(
      `📊 SiriusXM Weekly Spins: ${result.totalWeekly.toLocaleString()}`
    );
    console.log(
      `🎯 SiriusXM Latest Total: ${result.totalLatest.toLocaleString()}`
    );

    // Análisis de la discrepancia
    const dashboardValue = 123;
    const apiValue = result.totalMonthly;
    const difference = dashboardValue - apiValue;

    console.log(`\n🔍 ANÁLISIS DE LA DISCREPANCIA:`);
    console.log(`   - Dashboard muestra: ${dashboardValue} spins`);
    console.log(`   - API muestra: ${apiValue} spins`);
    console.log(`   - Diferencia: ${difference} spins`);

    if (difference > 0) {
      console.log(`\n💡 POSIBLES CAUSAS DE LA DISCREPANCIA:`);
      console.log(`   1. Los datos del dashboard pueden incluir más endpoints`);
      console.log(
        `   2. Puede haber tracks adicionales no capturados por la API`
      );
      console.log(`   3. El dashboard puede usar cálculos diferentes`);
      console.log(
        `   4. Puede haber datos agregados internamente por Chartmetric`
      );
      console.log(
        `   5. Los datos pueden venir de endpoints específicos de SiriusXM`
      );
    }

    console.log(`\n📋 RECOMENDACIONES:`);
    console.log(
      `   - Verificar el endpoint específico de SiriusXM: /siriusxm/artist/:id`
    );
    console.log(
      `   - Revisar endpoints de airplay totals y plays por estación`
    );
    console.log(
      `   - Contactar soporte de Chartmetric para aclarar la diferencia`
    );
    console.log(
      `   - Verificar si hay tracks adicionales con diferentes filtros`
    );
  } catch (error) {
    console.error("❌ Error en el análisis:", error.message);
  }
}

// Ejecutar el análisis detallado
analyzeBizarrapDetailed().catch(console.error);
