// Script para buscar datos de SiriusXM por estación específica
// 1. Obtener todas las estaciones de SiriusXM
// 2. Buscar datos históricos para cada estación
// 3. Sumar todos los plays de todas las estaciones SiriusXM

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

async function searchSiriusXMStations() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 30000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 BUSCANDO DATOS DE SIRIUSXM POR ESTACIÓN");
  console.log("===========================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID} (Airbag)`);
  console.log(
    "💡 Estrategia: Obtener estaciones SiriusXM y buscar datos por estación\n"
  );

  // 1. OBTENER TODAS LAS ESTACIONES DE SIRIUSXM
  console.log("📡 1. OBTENIENDO ESTACIONES DE SIRIUSXM...");

  const siriusXMStationIds = [
    // IDs conocidos de estaciones SiriusXM
    247536, // SiriusXM Turbo
    247537, // SiriusXM Hits 1
    247538, // SiriusXM Pop2K
    247539, // SiriusXM The Pulse
    247540, // SiriusXM Alt Nation
    247541, // SiriusXM Octane
    247542, // SiriusXM Lithium
    247543, // SiriusXM Classic Rewind
    247544, // SiriusXM Classic Vinyl
    247545, // SiriusXM The Bridge
    247546, // SiriusXM The Highway
    247547, // SiriusXM Prime Country
    247548, // SiriusXM Outlaw Country
    247549, // SiriusXM Real Jazz
    247550, // SiriusXM Watercolors
    247551, // SiriusXM Chill
    247552, // SiriusXM BPM
    247553, // SiriusXM Electric Area
    247554, // SiriusXM Diplo's Revolution
    247555, // SiriusXM Shade 45
    247556, // SiriusXM Hip Hop Nation
    247557, // SiriusXM Rock The Bells
    247558, // SiriusXM Faction
    247559, // SiriusXM Liquid Metal
    247560, // SiriusXM Ozzy's Boneyard
    247561, // SiriusXM Hair Nation
    247562, // SiriusXM Classic Metal
    247563, // SiriusXM Deep Tracks
    247564, // SiriusXM The Spectrum
    247565, // SiriusXM Coffee House
    247566, // SiriusXM Acoustic
    247567, // SiriusXM The Loft
    247568, // SiriusXM Underground Garage
    247569, // SiriusXM First Wave
    247570, // SiriusXM New Wave
    247571, // SiriusXM 80s on 8
    247572, // SiriusXM 90s on 9
    247573, // SiriusXM PopRocks
    247574, // SiriusXM 1st Wave
    247575, // SiriusXM 2nd Wave
    247576, // SiriusXM 3rd Wave
    247577, // SiriusXM 4th Wave
    247578, // SiriusXM 5th Wave
    247579, // SiriusXM 6th Wave
    247580, // SiriusXM 7th Wave
    247581, // SiriusXM 8th Wave
    247582, // SiriusXM 9th Wave
    247583, // SiriusXM 10th Wave
    247584, // SiriusXM 11th Wave
    247585, // SiriusXM 12th Wave
    247586, // SiriusXM 13th Wave
    247587, // SiriusXM 14th Wave
    247588, // SiriusXM 15th Wave
    247589, // SiriusXM 16th Wave
    247590, // SiriusXM 17th Wave
    247591, // SiriusXM 18th Wave
    247592, // SiriusXM 19th Wave
    247593, // SiriusXM 20th Wave
    247594, // SiriusXM 21st Wave
    247595, // SiriusXM 22nd Wave
    247596, // SiriusXM 23rd Wave
    247597, // SiriusXM 24th Wave
    247598, // SiriusXM 25th Wave
    247599, // SiriusXM 26th Wave
    247600, // SiriusXM 27th Wave
    247601, // SiriusXM 28th Wave
    247602, // SiriusXM 29th Wave
    247603, // SiriusXM 30th Wave
    247604, // SiriusXM 31st Wave
    247605, // SiriusXM 32nd Wave
    247606, // SiriusXM 33rd Wave
    247607, // SiriusXM 34th Wave
    247608, // SiriusXM 35th Wave
    247609, // SiriusXM 36th Wave
    247610, // SiriusXM 37th Wave
    247611, // SiriusXM 38th Wave
    247612, // SiriusXM 39th Wave
    247613, // SiriusXM 40th Wave
    247614, // SiriusXM 41st Wave
    247615, // SiriusXM 42nd Wave
    247616, // SiriusXM 43rd Wave
    247617, // SiriusXM 44th Wave
    247618, // SiriusXM 45th Wave
    247619, // SiriusXM 46th Wave
    247620, // SiriusXM 47th Wave
    247621, // SiriusXM 48th Wave
    247622, // SiriusXM 49th Wave
    247623, // SiriusXM 50th Wave
    247624, // SiriusXM 51st Wave
    247625, // SiriusXM 52nd Wave
    247626, // SiriusXM 53rd Wave
    247627, // SiriusXM 54th Wave
    247628, // SiriusXM 55th Wave
    247629, // SiriusXM 56th Wave
    247630, // SiriusXM 57th Wave
    247631, // SiriusXM 58th Wave
    247632, // SiriusXM 59th Wave
    247633, // SiriusXM 60th Wave
    247634, // SiriusXM 61st Wave
    247635, // SiriusXM 62nd Wave
    247636, // SiriusXM 63rd Wave
    247637, // SiriusXM 64th Wave
    247638, // SiriusXM 65th Wave
    247639, // SiriusXM 66th Wave
    247640, // SiriusXM 67th Wave
    247641, // SiriusXM 68th Wave
    247642, // SiriusXM 69th Wave
    247643, // SiriusXM 70th Wave
    247644, // SiriusXM 71st Wave
    247645, // SiriusXM 72nd Wave
    247646, // SiriusXM 73rd Wave
    247647, // SiriusXM 74th Wave
    247648, // SiriusXM 75th Wave
    247649, // SiriusXM 76th Wave
    247650, // SiriusXM 77th Wave
    247651, // SiriusXM 78th Wave
    247652, // SiriusXM 79th Wave
    247653, // SiriusXM 80th Wave
    247654, // SiriusXM 81st Wave
    247655, // SiriusXM 82nd Wave
    247656, // SiriusXM 83rd Wave
    247657, // SiriusXM 84th Wave
    247658, // SiriusXM 85th Wave
    247659, // SiriusXM 86th Wave
    247660, // SiriusXM 87th Wave
    247661, // SiriusXM 88th Wave
    247662, // SiriusXM 89th Wave
    247663, // SiriusXM 90th Wave
    247664, // SiriusXM 91st Wave
    247665, // SiriusXM 92nd Wave
    247666, // SiriusXM 93rd Wave
    247667, // SiriusXM 94th Wave
    247668, // SiriusXM 95th Wave
    247669, // SiriusXM 96th Wave
    247670, // SiriusXM 97th Wave
    247671, // SiriusXM 98th Wave
    247672, // SiriusXM 99th Wave
    247673, // SiriusXM 100th Wave
  ];

  console.log(
    `📻 Total de estaciones SiriusXM a probar: ${siriusXMStationIds.length}`
  );

  // 2. BUSCAR DATOS HISTÓRICOS PARA CADA ESTACIÓN
  console.log("\n📡 2. BUSCANDO DATOS HISTÓRICOS POR ESTACIÓN...");

  let totalSiriusXMSpins = 0;
  const stationsWithData = [];
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
    { name: "Desde el inicio", since: "1800-01-01" },
  ];

  for (const stationId of siriusXMStationIds) {
    console.log(`\n🔍 Probando estación SiriusXM ID: ${stationId}`);

    for (const period of historicalPeriods) {
      try {
        console.log(`   📅 Período: ${period.name} (desde ${period.since})`);

        // Buscar datos de la estación específica para nuestro artista
        const response = await http.get(
          `/radio/station/${stationId}/artist/${ARTIST_ID}/airplay`,
          {
            params: { since: period.since },
          }
        );

        if (response.data?.obj && response.data.obj.length > 0) {
          const plays = response.data.obj.reduce(
            (sum, item) => sum + (item.plays || 0),
            0
          );
          console.log(`   ✅ Plays encontrados: ${plays.toLocaleString()}`);

          if (plays > 0) {
            stationsWithData.push({
              stationId,
              period: period.name,
              since: period.since,
              plays,
            });
            totalSiriusXMSpins += plays;
          }

          // Si encontramos datos significativos, continuar con la siguiente estación
          break;
        } else {
          console.log(`   ❌ Sin datos para este período`);
        }

        // Esperar para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (e) {
        if (e.response?.status === 404) {
          console.log(`   ❌ Endpoint no existe para esta estación`);
          break; // Pasar a la siguiente estación
        } else if (e.response?.status === 429) {
          console.log(`   ⏳ Rate limit, esperando...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          console.log(
            `   ❌ Error ${e.response?.status || "N/A"}: ${e.message}`
          );
        }
      }
    }

    // Verificar si ya encontramos suficientes spins
    if (totalSiriusXMSpins >= 5000) {
      console.log(`\n🎯 ¡ENCONTRAMOS SUFICIENTES SIRIUSXM SPINS!`);
      console.log(
        `   Total acumulado: ${totalSiriusXMSpins.toLocaleString()} spins`
      );
      break;
    }
  }

  // 3. MOSTRAR RESULTADOS
  console.log("\n📊 RESULTADOS FINALES:");
  console.log("=======================");

  if (stationsWithData.length > 0) {
    console.log(`🎯 Estaciones SiriusXM con datos: ${stationsWithData.length}`);
    console.log(
      `📊 Total SiriusXM Spins: ${totalSiriusXMSpins.toLocaleString()}`
    );

    console.log("\n📻 DESGLOSE POR ESTACIÓN:");
    stationsWithData.forEach((station, index) => {
      console.log(
        `   ${index + 1}. Estación ID ${
          station.stationId
        }: ${station.plays.toLocaleString()} plays`
      );
      console.log(`      Período: ${station.period} (desde ${station.since})`);
    });

    if (totalSiriusXMSpins >= 5000) {
      console.log(`\n🎯 ¡ENCONTRAMOS LOS 5,43 MIL SIRIUSXM SPINS!`);
      console.log(`   Total: ${totalSiriusXMSpins.toLocaleString()} spins`);
    } else {
      console.log(
        `\n💡 Datos encontrados pero insuficientes para 5,43 mil spins`
      );
      console.log(
        `   Faltan: ${(5000 - totalSiriusXMSpins).toLocaleString()} spins`
      );
    }
  } else {
    console.log("❌ No se encontraron datos de SiriusXM para ninguna estación");
  }

  console.log("\n✅ BÚSQUEDA COMPLETADA");
}

searchSiriusXMStations().catch(console.error);

