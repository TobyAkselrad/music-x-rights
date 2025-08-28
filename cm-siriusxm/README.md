# 🎵 Chartmetric Sirius XM Analysis Scripts

Este repositorio contiene una colección completa de scripts para analizar datos de radio, Sirius XM y artistas en Chartmetric API.

## 📋 Tabla de Contenidos

- [🚀 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [📊 Scripts Disponibles](#-scripts-disponibles)
- [🔍 Análisis por Artista](#-análisis-por-artista)
- [📡 Endpoints de Radio](#-endpoints-de-radio)
- [🌍 Broadcast Markets](#-broadcast-markets)
- [🎯 Casos de Uso](#-casos-de-uso)
- [❓ Troubleshooting](#-troubleshooting)

## 🚀 Instalación

### Prerrequisitos

- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta activa en Chartmetric

### Pasos de Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd cm-siriusxm

# Instalar dependencias
npm install

# Verificar instalación
npm list
```

## ⚙️ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```bash
# Credenciales de Chartmetric
CM_REFRESH_TOKEN=tu_refresh_token_aqui

# ID del artista por defecto (Airbag)
ARTIST_ID=127473

# Períodos de tiempo
SINCE=2020-01-01
UNTIL=2024-12-31

# Configuración de concurrencia
CONCURRENCY=3
```

### Obtener Token de Chartmetric

1. Iniciar sesión en [Chartmetric](https://chartmetric.com)
2. Ir a Configuración > API
3. Generar un refresh token
4. Copiar el token al archivo `.env`

## 📊 Scripts Disponibles

### 🎯 **Scripts de Análisis por Artista**

#### `bizarrap_siriusxm_detailed.js`

**Descripción**: Análisis detallado y completo de Sirius XM spins para Bizarrap

- **Funcionalidad**: Obtiene todos los tracks, analiza monthly_diff, weekly_diff y latest
- **Endpoint**: `/track/list/filter`
- **Uso**: Investigar discrepancia entre API y dashboard
- **Ejecutar**: `node bizarrap_siriusxm_detailed.js`

#### `search_broadcast_markets.js`

**Descripción**: Análisis de mercados de broadcast para cualquier artista

- **Funcionalidad**: Busca datos de radio por país y ciudad
- **Endpoint**: `/radio/artist/:id/broadcast-markets`
- **Uso**: Análisis global de presencia radiofónica
- **Ejecutar**: `node search_broadcast_markets.js`

#### `search_artist_charts.js`

**Descripción**: Búsqueda de artistas en charts y rankings

- **Funcionalidad**: Encuentra artistas en diferentes tipos de charts
- **Endpoint**: `/artist/list/filter`
- **Uso**: Análisis de posicionamiento en charts
- **Ejecutar**: `node search_artist_charts.js`

### 📡 **Scripts de Sirius XM**

#### `siriusxm_spins.js`

**Descripción**: Análisis básico de spins de Sirius XM

- **Funcionalidad**: Obtiene spins totales por artista, identifica estaciones SiriusXM
- **Endpoint**: `/radio/artist/:id/airplay-totals/station`
- **Uso**: Conteo rápido de spins Sirius XM, análisis por estación individual
- **Ejecutar**: `node siriusxm_spins.js`
- **📊 Valor específico**:
  - Lista todas las estaciones con plays del artista
  - Identifica cuáles son SiriusXM
  - Muestra total de plays por estación
  - **Diferencia clave**: Usa endpoint de estaciones, no de tracks

#### `search_siriusxm_stations.js`

**Descripción**: Búsqueda detallada de estaciones Sirius XM

- **Funcionalidad**: Analiza estaciones específicas y sus datos
- **Endpoint**: `/radio/artist/:id/airplay-totals/station`
- **Uso**: Análisis por estación individual
- **Ejecutar**: `node search_siriusxm_stations.js`

#### `search_siriusxm_data.js`

**Descripción**: Búsqueda general de datos Sirius XM

- **Funcionalidad**: Obtiene datos agregados de Sirius XM
- **Endpoint**: `/radio/artist/:id/airplay-totals/station`
- **Uso**: Vista general de actividad Sirius XM
- **Ejecutar**: `node search_siriusxm_data.js`

### 🌍 **Scripts de Broadcast Markets**

#### `search_historical_siriusxm.js`

**Descripción**: Análisis histórico de datos Sirius XM

- **Funcionalidad**: Busca datos en diferentes períodos históricos
- **Endpoint**: `/radio/artist/:id/broadcast-markets`
- **Uso**: Análisis temporal de presencia radiofónica
- **Ejecutar**: `node search_historical_siriusxm.js`

#### `search_broadcast_markets.js`

**Descripción**: Análisis de mercados de broadcast

- **Funcionalidad**: Datos por país y ciudad
- **Endpoint**: `/radio/artist/:id/broadcast-markets`
- **Uso**: Análisis geográfico de presencia
- **Ejecutar**: `node search_broadcast_markets.js`

### 🔍 **Scripts de Exploración**

#### `explore_api.js`

**Descripción**: Exploración general de la API de Chartmetric

- **Funcionalidad**: Prueba diferentes endpoints y funcionalidades
- **Endpoint**: Múltiples endpoints
- **Uso**: Familiarizarse con la API
- **Ejecutar**: `node explore_api.js`

#### `explore_all_siriusxm.js`

**Descripción**: Exploración completa de funcionalidades Sirius XM

- **Funcionalidad**: Prueba todos los endpoints relacionados con Sirius XM
- **Endpoint**: Múltiples endpoints Sirius XM
- **Uso**: Descubrir funcionalidades disponibles
- **Ejecutar**: `node explore_all_siriusxm.js`

#### `explore_siriusxm_tracks.js`

**Descripción**: Exploración de tracks en Sirius XM

- **Funcionalidad**: Analiza tracks individuales y sus datos
- **Endpoint**: `/track/list/filter`
- **Uso**: Análisis detallado de tracks
- **Ejecutar**: `node explore_siriusxm_tracks.js`

#### `explore_tracks_spins.js`

**Descripción**: Exploración de spins de tracks

- **Funcionalidad**: Analiza spins por track individual
- **Endpoint**: `/track/list/filter`
- **Uso**: Análisis granular de actividad
- **Ejecutar**: `node explore_tracks_spins.js`

#### `explore_tracks_spins_v2.js`

**Descripción**: Versión mejorada de exploración de spins

- **Funcionalidad**: Análisis avanzado con más métricas
- **Endpoint**: `/track/list/filter`
- **Uso**: Análisis profundo de tracks
- **Ejecutar**: `node explore_tracks_spins_v2.js`

### 📊 **Scripts de Múltiples Artistas**

#### `get_all_tracks_siriusxm.js`

**Descripción**: Obtiene tracks de múltiples artistas

- **Funcionalidad**: Análisis comparativo entre artistas
- **Endpoint**: `/track/list/filter`
- **Uso**: Comparación de artistas
- **Ejecutar**: `node get_all_tracks_siriusxm.js`

#### `get_multiple_artists_siriusxm.js`

**Descripción**: Análisis de múltiples artistas simultáneamente

- **Funcionalidad**: Procesamiento en lote de artistas
- **Endpoint**: `/track/list/filter`
- **Uso**: Análisis masivo de artistas
- **Ejecutar**: `node get_multiple_artists_siriusxm.js`

### 🧪 **Scripts de Testing**

#### `test_airplay_charts.js`

**Descripción**: Testing de charts de airplay

- **Funcionalidad**: Verifica funcionalidad de charts
- **Endpoint**: `/radio/artist/:id/airplay-totals/station`
- **Uso**: Testing y validación
- **Ejecutar**: `node test_airplay_charts.js`

## 🔍 Análisis por Artista

### 🎵 **Artistas que Hemos Analizado**

| **Artista**  | **ID** | **Descripción**     | **Script Principal**            |
| ------------ | ------ | ------------------- | ------------------------------- |
| **Airbag**   | 127473 | Rock argentino      | `search_broadcast_markets.js`   |
| **Bizarrap** | 648982 | Productor argentino | `bizarrap_siriusxm_detailed.js` |
| **Duki**     | 550716 | Rapper argentino    | `search_broadcast_markets.js`   |

### 🔧 **Configuración de Artista**

Todos los scripts son **generales** y funcionan con cualquier artista. Para cambiar de artista:

### Cambiar Artista

```bash
# Opción 1: Modificar .env
ARTIST_ID=648982

# Opción 2: Modificar script directamente
const ARTIST_ID = 648982; // Bizarrap
```

## 📡 Endpoints de Radio

### Principales Endpoints Utilizados

- **`/track/list/filter`**: Lista de tracks con filtros
- **`/radio/artist/:id/broadcast-markets`**: Mercados de broadcast
- **`/radio/artist/:id/airplay-totals/station`**: Totales de airplay por estación
- **`/radio/artist/:id/plays/station`**: Plays por estación
- **`/siriusxm/artist/:id`**: Datos específicos de Sirius XM

### Parámetros Comunes

- **`artists[]`**: ID del artista (array)
- **`limit`**: Número de resultados por página (máx 100)
- **`offset`**: Desplazamiento para paginación
- **`since`**: Fecha de inicio (YYYY-MM-DD)

## 🌍 Broadcast Markets

### Datos Disponibles

- **Países**: Distribución geográfica por país
- **Ciudades**: Análisis por ciudad específica
- **Estaciones**: Número de estaciones por mercado
- **Ratios**: Métricas de población y actividad

### Períodos de Tiempo

- Último año (2024-01-01)
- Últimos 2 años (2023-01-01)
- Últimos 3 años (2022-01-01)
- Últimos 5 años (2020-01-01)
- Período amplio (2018-01-01)
- Período histórico (2010-01-01)
- Todo el historial (2000-01-01)

## 🎯 Casos de Uso

### 1. Análisis de Presencia Radiofónica

```bash
# Analizar presencia global de un artista
node search_broadcast_markets.js
```

**📊 Valor que trae**: Datos por país y ciudad, total global de plays, distribución geográfica, análisis temporal

### 2. Investigación de Sirius XM

```bash
# Análisis detallado de cualquier artista (por defecto Bizarrap)
node bizarrap_siriusxm_detailed.js

# Análisis básico de Sirius XM por estación
node siriusxm_spins.js
```

**📊 Valor que trae**:

- **`bizarrap_siriusxm_detailed.js`**: Tracks individuales, monthly_diff, weekly_diff, latest, análisis completo de discrepancia
- **`siriusxm_spins.js`**: Estaciones con plays, total por estación, identificación SiriusXM, datos por estación individual

### 3. Comparación de Artistas

```bash
# Comparar múltiples artistas
node get_multiple_artists_siriusxm.js
```

**📊 Valor que trae**: Análisis comparativo entre artistas, rankings, métricas, procesamiento en lote

### 4. Exploración de API

```bash
# Familiarizarse con endpoints disponibles
node explore_api.js
```

**📊 Valor que trae**: Descubrimiento de funcionalidades, testing de endpoints, exploración de capacidades

### 5. Análisis de Tracks

```bash
# Análisis detallado de tracks individuales
node explore_tracks_spins_v2.js
```

**📊 Valor que trae**: Spins por track, análisis granular, métricas por canción individual

## ❓ Troubleshooting

### Errores Comunes

#### Rate Limiting (429)

```bash
# El script maneja automáticamente los rate limits
# Espera 2 segundos y reintenta
```

#### Bad Request (400)

```bash
# Verificar formato de parámetros
# Asegurar que artists[] sea un array
```

#### Not Found (404)

```bash
# Verificar que el endpoint existe
# Confirmar que el artista ID es válido
```

#### Token Expirado

```bash
# Regenerar refresh token en Chartmetric
# Actualizar .env con nuevo token
```

### Soluciones

#### Verificar Configuración

```bash
# Revisar archivo .env
cat .env

# Verificar dependencias
npm list
```

#### Debug de API

```bash
# Activar logs detallados
# Los scripts muestran URLs y respuestas
```

#### Limpiar Cache

```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📚 Recursos Adicionales

### Documentación

- [Chartmetric API Documentation](https://api.chartmetric.com/docs)
- [Sirius XM Data Guide](https://chartmetric.com/siriusxm)

### Archivos de Referencia

- **`Chartmetric.txt`**: Lista de estaciones Sirius XM disponibles
- **`package.json`**: Dependencias del proyecto
- **`.env.example`**: Ejemplo de configuración

### Contacto

- **Soporte Chartmetric**: [support@chartmetric.com](mailto:support@chartmetric.com)
- **Documentación API**: [https://api.chartmetric.com/docs](https://api.chartmetric.com/docs)

## 🔍 **Diferencias Clave Entre Scripts**

### **`siriusxm_spins.js` vs `bizarrap_siriusxm_detailed.js`**

| **Aspecto**      | **`siriusxm_spins.js`**                    | **`bizarrap_siriusxm_detailed.js`** |
| ---------------- | ------------------------------------------ | ----------------------------------- |
| **Endpoint**     | `/radio/artist/:id/airplay-totals/station` | `/track/list/filter`                |
| **Datos**        | Estaciones con plays                       | Tracks individuales                 |
| **SiriusXM**     | Identifica estaciones SiriusXM             | Monthly_diff, weekly_diff, latest   |
| **Granularidad** | Por estación                               | Por track                           |
| **Uso**          | Análisis de estaciones                     | Análisis de tracks                  |
| **Resultado**    | Lista de estaciones y plays                | Total de spins por período          |

### **Cuándo Usar Cada Uno**

- **Usar `siriusxm_spins.js`**: Para ver en qué estaciones suena el artista y cuáles son SiriusXM
- **Usar `bizarrap_siriusxm_detailed.js`**: Para obtener el total de spins SiriusXM en los últimos 28 días
- **Usar `search_broadcast_markets.js`**: Para análisis geográfico global de presencia radiofónica

## 🚀 Próximos Pasos

1. **Configurar variables de entorno**
2. **Ejecutar script de exploración básica**
3. **Analizar artista específico**
4. **Investigar discrepancia de datos**
5. **Contactar soporte si es necesario**

---

## ⚠️ **Nota Importante sobre Discrepancia de Datos**

### **Problema Identificado**

Hemos encontrado una **discrepancia significativa** entre los datos de la API y el dashboard de Chartmetric:

- **API pública**: 21 spins (monthly_diff)
- **Dashboard**: 123 spins
- **Diferencia**: 102 spins

### **Posibles Causas**

1. **Datos agregados internamente** por Chartmetric
2. **Endpoints específicos** no accesibles públicamente
3. **Cálculos diferentes** entre API y dashboard
4. **Tracks adicionales** no capturados por la API pública

### **Recomendación**

Para obtener datos exactos, **contactar soporte de Chartmetric** y solicitar aclaración sobre la diferencia entre API pública y dashboard.

---

**Nota**: Este README se actualiza regularmente. Para la versión más reciente, consultar el repositorio principal.
