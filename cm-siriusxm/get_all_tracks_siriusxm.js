// Script para obtener TODOS los tracks de múltiples artistas y sus SiriusXM Streams
// Usa paginación para obtener más de 100 tracks por artista

require("dotenv").config();
const axios = require("axios");

const CM_REFRESH_TOKEN = process.env.CM_REFRESH_TOKEN;

if (!CM_REFRESH_TOKEN) {
  console.error("ERROR: Exportá CM_REFRESH_TOKEN");
  process.exit(1);
}

// IDs de los artistas
const ARTISTS = [
  { id: 550716, name: "Duki" },
  { id: 127473, name: "Airbag" },
  { id: 1417553, name: "Nicki Nicole" },
];

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

async function getAllTracksForArtist(artistId, artistName, http) {
  console.log(`\n🎯 ${artistName} (ID: ${artistId})`);
  console.log("=" * (artistName.length + 20));

  let allTracks = [];
  let offset = 0;
  const limit = 100; // Máximo permitido por request
  let hasMoreTracks = true;

  console.log("📡 Obteniendo TODOS los tracks del artista...");

  // Obtener tracks en lotes de 100
  while (hasMoreTracks) {
    try {
      console.log(`   📥 Obteniendo tracks ${offset + 1}-${offset + limit}...`);

      const tracksResponse = await http.get("/track/list/filter", {
        params: {
          artists: [artistId],
          limit: limit,
          offset: offset,
          sortColumn: "latest.siriusxm_streams",
          sortOrderDesc: true,
          range_period: "latest",
        },
      });

      if (tracksResponse.data?.obj && tracksResponse.data.obj.length > 0) {
        const tracks = tracksResponse.data.obj;
        allTracks = allTracks.concat(tracks);

        console.log(
          `   ✅ Obtenidos ${tracks.length} tracks (Total acumulado: ${allTracks.length})`
        );

        // Si obtenemos menos de 100 tracks, hemos llegado al final
        if (tracks.length < limit) {
          hasMoreTracks = false;
        } else {
          offset += limit;
        }
      } else {
        hasMoreTracks = false;
      }

      // Esperar entre requests para evitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.error(
        `   ❌ Error obteniendo tracks ${offset + 1}-${offset + limit}:`,
        e.message
      );
      hasMoreTracks = false;
    }
  }

  console.log(`\n📊 RESUMEN DE TRACKS:`);
  console.log(`   Total de tracks obtenidos: ${allTracks.length}`);

  // Analizar SiriusXM streams
  let totalSiriusXMStreams = 0;
  let tracksWithSiriusXM = [];
  let maxSiriusXMStreams = 0;

  allTracks.forEach((track) => {
    const siriusXMStreams = track.latest?.siriusxm_streams || 0;
    if (siriusXMStreams > 0) {
      tracksWithSiriusXM.push({
        name: track.name,
        album: track.album?.[0]?.name || "Sin álbum",
        siriusXMStreams: siriusXMStreams,
        trackId: track.cm_track,
      });
      totalSiriusXMStreams += siriusXMStreams;
      if (siriusXMStreams > maxSiriusXMStreams) {
        maxSiriusXMStreams = siriusXMStreams;
      }
    }
  });

  console.log(`   Tracks con SiriusXM: ${tracksWithSiriusXM.length}`);
  console.log(
    `   Total SiriusXM Streams: ${totalSiriusXMStreams.toLocaleString()}`
  );
  console.log(
    `   Máximo SiriusXM por track: ${maxSiriusXMStreams.toLocaleString()}`
  );

  if (tracksWithSiriusXM.length > 0) {
    console.log("\n🎯 TOP 10 TRACKS CON SIRIUSXM STREAMS:");
    tracksWithSiriusXM
      .sort((a, b) => b.siriusXMStreams - a.siriusXMStreams)
      .slice(0, 10)
      .forEach((track, index) => {
        console.log(
          `   ${index + 1}. ${track.name} (${
            track.album
          }): ${track.siriusXMStreams.toLocaleString()} streams`
        );
      });
  }

  // Comparar con airplay totales
  try {
    console.log("\n📡 COMPARANDO CON AIRPLAY TOTALES...");
    const airplayResponse = await http.get(
      `/radio/artist/${artistId}/airplay-totals/station`,
      {
        params: { since: "2020-01-01", limit: 1000 }, // Aumentar límite
      }
    );

    if (airplayResponse.data?.obj) {
      const stations = airplayResponse.data.obj;
      const totalAirplayPlays = stations.reduce(
        (sum, station) => sum + (station.plays || 0),
        0
      );

      console.log(
        `   Total Airplay Plays: ${totalAirplayPlays.toLocaleString()}`
      );
      console.log(
        `   Total SiriusXM Streams: ${totalSiriusXMStreams.toLocaleString()}`
      );

      if (totalSiriusXMStreams > 0) {
        const percentage = (
          (totalSiriusXMStreams / totalAirplayPlays) *
          100
        ).toFixed(2);
        console.log(`   Porcentaje SiriusXM: ${percentage}%`);
      }
    }
  } catch (e) {
    console.log(`   ❌ Error obteniendo airplay: ${e.message}`);
  }

  return {
    artistName,
    artistId,
    totalTracks: allTracks.length,
    tracksWithSiriusXM: tracksWithSiriusXM.length,
    totalSiriusXMStreams,
    maxSiriusXMStreams,
    topTracks: tracksWithSiriusXM
      .sort((a, b) => b.siriusXMStreams - a.siriusXMStreams)
      .slice(0, 5),
  };
}

async function getAllArtistsCompleteSiriusXM() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 30000, // Aumentar timeout para requests más largos
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 OBTENIENDO TODOS LOS TRACKS Y SIRIUSXM STREAMS");
  console.log("====================================================\n");

  const results = [];

  // Procesar cada artista
  for (const artist of ARTISTS) {
    const result = await getAllTracksForArtist(artist.id, artist.name, http);
    if (result) {
      results.push(result);
    }

    // Esperar entre artistas para evitar rate limiting
    if (artist !== ARTISTS[ARTISTS.length - 1]) {
      console.log("\n⏳ Esperando 3 segundos entre artistas...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // RESUMEN FINAL COMPLETO
  console.log("\n" + "=" * 80);
  console.log("📊 RESUMEN FINAL COMPLETO - TODOS LOS TRACKS ANALIZADOS");
  console.log("=" * 80);

  if (results.length > 0) {
    // Ordenar por total de SiriusXM streams
    results.sort((a, b) => b.totalSiriusXMStreams - a.totalSiriusXMStreams);

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.artistName}`);
      console.log(
        `   📊 Total de tracks: ${result.totalTracks.toLocaleString()}`
      );
      console.log(`   🎵 Tracks con SiriusXM: ${result.tracksWithSiriusXM}`);
      console.log(
        `   📻 Total SiriusXM Streams: ${result.totalSiriusXMStreams.toLocaleString()}`
      );
      console.log(
        `   🏆 Máximo por track: ${result.maxSiriusXMStreams.toLocaleString()} streams`
      );
      console.log(
        `   🎯 Top Track: ${result.topTracks[0]?.name || "N/A"} (${
          result.topTracks[0]?.siriusXMStreams?.toLocaleString() || 0
        } streams)`
      );
    });

    // Estadísticas generales
    const totalStreams = results.reduce(
      (sum, r) => sum + r.totalSiriusXMStreams,
      0
    );
    const totalTracks = results.reduce((sum, r) => sum + r.totalTracks, 0);
    const avgStreamsPerArtist = (totalStreams / results.length).toFixed(0);
    const avgTracksPerArtist = (totalTracks / results.length).toFixed(0);

    console.log(`\n📈 ESTADÍSTICAS GENERALES COMPLETAS:`);
    console.log(`   Total de artistas analizados: ${results.length}`);
    console.log(
      `   Total de tracks analizados: ${totalTracks.toLocaleString()}`
    );
    console.log(`   Promedio de tracks por artista: ${avgTracksPerArtist}`);
    console.log(`   Total SiriusXM Streams: ${totalStreams.toLocaleString()}`);
    console.log(
      `   Promedio SiriusXM por artista: ${avgStreamsPerArtist} streams`
    );

    // Análisis de distribución
    console.log(`\n📊 ANÁLISIS DE DISTRIBUCIÓN:`);
    results.forEach((result) => {
      const percentage = (
        (result.tracksWithSiriusXM / result.totalTracks) *
        100
      ).toFixed(1);
      console.log(
        `   ${result.artistName}: ${percentage}% de tracks tienen SiriusXM (${result.tracksWithSiriusXM}/${result.totalTracks})`
      );
    });
  }

  console.log("\n✅ ANÁLISIS COMPLETO FINALIZADO");
}

getAllArtistsCompleteSiriusXM().catch(console.error);
