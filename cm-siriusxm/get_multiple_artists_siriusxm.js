// Script para obtener SiriusXM Streams de múltiples artistas
// Artistas: Duki, Nicki Nicole, Airbag

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
  { id: 1417553, name: "Nicki Nicole" }, // ID de Nicki Nicole
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

async function getArtistSiriusXMData(artistId, artistName, http) {
  console.log(`\n🎯 ${artistName} (ID: ${artistId})`);
  console.log("=" * (artistName.length + 20));

  try {
    // Obtener tracks del artista
    const tracksResponse = await http.get("/track/list/filter", {
      params: {
        artists: [artistId],
        limit: 100,
        sortColumn: "latest.siriusxm_streams",
        sortOrderDesc: true,
        range_period: "latest",
      },
    });

    if (tracksResponse.data?.obj) {
      const tracks = tracksResponse.data.obj;
      let totalSiriusXMStreams = 0;
      let tracksWithSiriusXM = [];

      // Analizar cada track
      tracks.forEach((track) => {
        const siriusXMStreams = track.latest?.siriusxm_streams || 0;
        if (siriusXMStreams > 0) {
          tracksWithSiriusXM.push({
            name: track.name,
            album: track.album?.[0]?.name || "Sin álbum",
            siriusXMStreams: siriusXMStreams,
          });
          totalSiriusXMStreams += siriusXMStreams;
        }
      });

      // Mostrar resumen
      console.log(`📊 Total de tracks: ${tracks.length}`);
      console.log(`🎵 Tracks con SiriusXM: ${tracksWithSiriusXM.length}`);
      console.log(
        `📻 Total SiriusXM Streams: ${totalSiriusXMStreams.toLocaleString()}`
      );

      if (tracksWithSiriusXM.length > 0) {
        console.log("\n🎯 TOP TRACKS CON SIRIUSXM STREAMS:");
        tracksWithSiriusXM
          .sort((a, b) => b.siriusXMStreams - a.siriusXMStreams)
          .slice(0, 5)
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
        const airplayResponse = await http.get(
          `/radio/artist/${artistId}/airplay-totals/station`,
          {
            params: { since: "2020-01-01", limit: 100 },
          }
        );

        if (airplayResponse.data?.obj) {
          const stations = airplayResponse.data.obj;
          const totalAirplayPlays = stations.reduce(
            (sum, station) => sum + (station.plays || 0),
            0
          );

          console.log(`\n📡 COMPARACIÓN AIRPLAY:`);
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
        totalTracks: tracks.length,
        tracksWithSiriusXM: tracksWithSiriusXM.length,
        totalSiriusXMStreams,
        topTracks: tracksWithSiriusXM
          .sort((a, b) => b.siriusXMStreams - a.siriusXMStreams)
          .slice(0, 3),
      };
    } else {
      console.log("❌ No se pudieron obtener los tracks");
      return null;
    }
  } catch (e) {
    console.error(`❌ Error obteniendo datos de ${artistName}:`, e.message);
    return null;
  }
}

async function getMultipleArtistsSiriusXM() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 OBTENIENDO SIRIUSXM STREAMS DE MÚLTIPLES ARTISTAS");
  console.log("========================================================\n");

  const results = [];

  // Procesar cada artista
  for (const artist of ARTISTS) {
    const result = await getArtistSiriusXMData(artist.id, artist.name, http);
    if (result) {
      results.push(result);
    }

    // Esperar entre artistas para evitar rate limiting
    if (artist !== ARTISTS[ARTISTS.length - 1]) {
      console.log("\n⏳ Esperando 2 segundos...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // RESUMEN FINAL
  console.log("\n" + "=" * 60);
  console.log("📊 RESUMEN FINAL - COMPARACIÓN ENTRE ARTISTAS");
  console.log("=" * 60);

  if (results.length > 0) {
    // Ordenar por total de SiriusXM streams
    results.sort((a, b) => b.totalSiriusXMStreams - a.totalSiriusXMStreams);

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.artistName}`);
      console.log(`   🎵 Tracks con SiriusXM: ${result.tracksWithSiriusXM}`);
      console.log(
        `   📻 Total SiriusXM Streams: ${result.totalSiriusXMStreams.toLocaleString()}`
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

    console.log(`\n📈 ESTADÍSTICAS GENERALES:`);
    console.log(`   Total de artistas analizados: ${results.length}`);
    console.log(
      `   Total de tracks analizados: ${totalTracks.toLocaleString()}`
    );
    console.log(`   Total SiriusXM Streams: ${totalStreams.toLocaleString()}`);
    console.log(`   Promedio por artista: ${avgStreamsPerArtist} streams`);
  }

  console.log("\n✅ ANÁLISIS COMPLETADO");
}

getMultipleArtistsSiriusXM().catch(console.error);
