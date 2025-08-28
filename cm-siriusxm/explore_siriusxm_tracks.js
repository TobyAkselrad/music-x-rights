// Script para obtener tracks del artista y sus siriusxm_streams usando el endpoint correcto
// Endpoint: /track/list/filter con filtro por artista

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

async function exploreSiriusXMTracks() {
  const token = await getAccessToken(CM_REFRESH_TOKEN);
  const http = axios.create({
    baseURL: "https://api.chartmetric.com/api",
    timeout: 20000,
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("🔍 EXPLORANDO SIRIUSXM STREAMS POR TRACK DEL ARTISTA");
  console.log("========================================================\n");
  console.log(`🎯 Artista ID: ${ARTIST_ID}`);
  console.log("💡 Usando endpoint: /track/list/filter\n");

  // 1. OBTENER TRACKS DEL ARTISTA CON FILTRO
  console.log("📡 1. OBTENIENDO TRACKS DEL ARTISTA...");

  try {
    const tracksResponse = await http.get("/track/list/filter", {
      params: {
        artists: [ARTIST_ID], // Filtrar por artista específico
        limit: 100, // Máximo permitido
        sortColumn: "latest.siriusxm_streams", // Ordenar por SiriusXM streams
        sortOrderDesc: true, // Orden descendente
        range_period: "latest", // Usar valores más recientes
      },
    });

    if (tracksResponse.data?.obj) {
      const tracks = tracksResponse.data.obj;
      console.log(`✅ Encontrados ${tracks.length} tracks del artista`);

      // 2. ANALIZAR SIRIUSXM STREAMS POR TRACK
      console.log("\n📡 2. ANALIZANDO SIRIUSXM STREAMS POR TRACK...");

      let totalSiriusXMStreams = 0;
      let tracksWithSiriusXM = [];
      let maxSiriusXMStreams = 0;

      tracks.forEach((track, index) => {
        const siriusXMStreams = track.latest?.siriusxm_streams || 0;
        const trackName = track.name || "Sin nombre";
        const albumName = track.album?.[0]?.name || "Sin álbum";

        console.log(`\n${index + 1}. ${trackName}`);
        console.log(`   Álbum: ${albumName}`);
        console.log(`   SiriusXM Streams: ${siriusXMStreams.toLocaleString()}`);

        if (siriusXMStreams > 0) {
          tracksWithSiriusXM.push({
            name: trackName,
            album: albumName,
            siriusXMStreams: siriusXMStreams,
            trackId: track.cm_track,
          });

          totalSiriusXMStreams += siriusXMStreams;
          if (siriusXMStreams > maxSiriusXMStreams) {
            maxSiriusXMStreams = siriusXMStreams;
          }
        }

        // Mostrar otros stats relevantes
        if (track.latest) {
          const stats = track.latest;
          console.log(
            `   Spotify Plays: ${(stats.spotify_plays || 0).toLocaleString()}`
          );
          console.log(
            `   Airplay Streams: ${(
              stats.airplay_streams || 0
            ).toLocaleString()}`
          );
          console.log(
            `   TikTok Posts: ${(stats.tiktok_posts || 0).toLocaleString()}`
          );
        }
      });

      // 3. RESUMEN DE SIRIUSXM STREAMS
      console.log("\n📊 RESUMEN DE SIRIUSXM STREAMS:");
      console.log(`   Total de tracks: ${tracks.length}`);
      console.log(`   Tracks con SiriusXM: ${tracksWithSiriusXM.length}`);
      console.log(
        `   Total SiriusXM Streams: ${totalSiriusXMStreams.toLocaleString()}`
      );
      console.log(
        `   Máximo SiriusXM por track: ${maxSiriusXMStreams.toLocaleString()}`
      );

      if (tracksWithSiriusXM.length > 0) {
        console.log("\n🎯 TRACKS CON MÁS SIRIUSXM STREAMS:");
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

      // 4. COMPARAR CON DATOS DE AIRPLAY TOTALES
      console.log("\n📡 3. COMPARANDO CON DATOS DE AIRPLAY TOTALES...");

      try {
        const airplayResponse = await http.get(
          `/radio/artist/${ARTIST_ID}/airplay-totals/station`,
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
            console.log(`   Porcentaje SiriusXM del total: ${percentage}%`);
          }
        }
      } catch (e) {
        console.log(`   ❌ Error obteniendo airplay totales: ${e.message}`);
      }

      // 5. PROBAR DIFERENTES PERÍODOS PARA SIRIUSXM
      console.log("\n📡 4. PROBANDO DIFERENTES PERÍODOS PARA SIRIUSXM...");

      const periods = ["latest", "weekly_diff", "monthly_diff"];

      for (const period of periods) {
        try {
          console.log(`\n🔍 Probando período: ${period}`);

          const periodResponse = await http.get("/track/list/filter", {
            params: {
              artists: [ARTIST_ID],
              limit: 20,
              sortColumn: `${period}.siriusxm_streams`,
              sortOrderDesc: true,
              range_period: period,
            },
          });

          if (periodResponse.data?.obj) {
            const periodTracks = periodResponse.data.obj;
            const periodTotal = periodTracks.reduce((sum, track) => {
              const streams = track[period]?.siriusxm_streams || 0;
              return sum + streams;
            }, 0);

            console.log(
              `   Total ${period}: ${periodTotal.toLocaleString()} streams`
            );

            // Mostrar top 3 del período
            periodTracks.slice(0, 3).forEach((track, index) => {
              const streams = track[period]?.siriusxm_streams || 0;
              if (streams > 0) {
                console.log(
                  `     ${index + 1}. ${
                    track.name
                  }: ${streams.toLocaleString()}`
                );
              }
            });
          }

          // Esperar para evitar rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (e) {
          console.log(`   ❌ Error con período ${period}: ${e.message}`);
        }
      }
    } else {
      console.log("❌ No se pudieron obtener los tracks del artista");
    }
  } catch (e) {
    console.error("❌ Error obteniendo tracks:", e.message);
    if (e.response) {
      console.error("Status:", e.response.status);
      console.error("Data:", e.response.data);
    }
  }

  console.log("\n✅ EXPLORACIÓN DE SIRIUSXM TRACKS COMPLETADA");
}

exploreSiriusXMTracks().catch(console.error);
