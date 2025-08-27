# 🎵 SoundExchange Artist Scraper & Google Sheets Sync

Sistema completo para buscar artistas en SoundExchange y sincronizar resultados con Google Sheets automáticamente.

## 🚀 **Características Principales**

- ✅ **Scraper Individual**: Búsqueda de un artista específico
- ✅ **Scraper en Lote**: Procesamiento de múltiples artistas
- ✅ **Sincronización con Google Sheets**: Integración automática
- ✅ **Detección de Duplicados**: Solo agrega registros nuevos
- ✅ **Exportación a CSV**: Archivos en carpeta de Descargas
- ✅ **Manejo de Cookies Cloudflare**: Automático y robusto

## 📋 **Requisitos Previos**

### **1. Configuración de Google Cloud**

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar **Google Sheets API**
3. Crear **Service Account**
4. Descargar archivo JSON de credenciales
5. Compartir Google Sheet con el email del service account

### **2. Dependencias del Sistema**

- Python 3.8+
- Chrome/Chromium browser
- Conexión a internet

## 🔧 **Instalación**

### **1. Clonar y configurar**

```bash
git clone <tu-repositorio>
cd sound-exchange-scrapping

# Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # En macOS/Linux
# venv\Scripts\activate  # En Windows

# Instalar dependencias
pip install -r requirements.txt
```

### **2. Configurar credenciales**

```bash
# Crear carpeta credentials
mkdir credentials

# Mover tu archivo JSON de Google Cloud
mv /ruta/a/tu/archivo.json credentials/google_sheets_credentials.json
```

### **3. Configurar Google Sheet**

1. Crear Google Sheet con nombre: `Sound Exchange Results`
2. La primera hoja debe llamarse: `Hoja 1`
3. Compartir con el email del service account (con permisos de editor)

## 📁 **Estructura del Proyecto**

```
sound-exchange-scrapping/
├── credentials/
│   └── google_sheets_credentials.json    # Tus credenciales de Google
├── artist_scraper.py                     # Scraper individual
├── batch_artist_scraper.py               # Scraper en lote
├── google_sheets_sync.py                 # Sincronización con Google Sheets
├── config.py                             # Configuración del sistema
├── artists_list.txt                      # Lista de ejemplo de artistas
├── README.md                             # Esta documentación
└── venv/                                 # Entorno virtual
```

## 🎯 **Modos de Uso**

### **1. Búsqueda Individual**

```bash
# Buscar un artista específico
python artist_scraper.py "nicki nicole"
python artist_scraper.py "bad bunny"
python artist_scraper.py "drake"
```

**Resultado:** Archivo JSON con resultados detallados

### **2. Búsqueda en Lote (CSV en Descargas)**

```bash
# Procesar lista de artistas desde archivo
python batch_artist_scraper.py --file artists_list.txt

# Procesar artistas específicos
python batch_artist_scraper.py --artists "nicki nicole,emilia,bad bunny"

# Modo interactivo
python batch_artist_scraper.py --interactive

# Con opciones personalizadas
python batch_artist_scraper.py --file artists_list.txt --delay 3.0 --headless
```

**Resultado:** Archivos CSV y JSON en carpeta de Descargas

### **3. Sincronización con Google Sheets**

```bash
# Procesar artistas y sincronizar automáticamente
python google_sheets_sync.py --file artists_list.txt

# Sincronizar desde CSV existente
python google_sheets_sync.py --sync-existing-csv archivo.csv

# Procesar artistas específicos y sincronizar
python google_sheets_sync.py --artists "nicki nicole,emilia"
```

**Resultado:** Datos sincronizados en Google Sheets + CSV en Descargas

## 📊 **Estructura de Datos**

### **Columnas del CSV/Google Sheets:**

| Columna                   | Descripción                                   |
| ------------------------- | --------------------------------------------- |
| `artist_name`             | Nombre del artista                            |
| `timestamp`               | Fecha y hora de la búsqueda                   |
| `total_results`           | Total de resultados encontrados               |
| `categories_with_results` | Número de categorías con resultados           |
| `UA_count`                | Conteo en Unregistered Artists                |
| `PUA_count`               | Conteo en Partially Unregistered Artists      |
| `UP_count`                | Conteo en Unregistered Performers             |
| `USRO_count`              | Conteo en Unregistered Sound Recording Owners |
| `UA_results`              | Resultados detallados UA                      |
| `PUA_results`             | Resultados detallados PUA                     |
| `UP_results`              | Resultados detallados UP                      |
| `USRO_results`            | Resultados detallados USRO                    |
| `status`                  | Estado de la búsqueda                         |

### **Categorías de SoundExchange:**

- **UA**: Unregistered Artists (Artistas no registrados)
- **PUA**: Partially Unregistered Artists (Artistas parcialmente registrados)
- **UP**: Unregistered Performers (Intérpretes no registrados)
- **USRO**: Unregistered Sound Recording Owners (Propietarios no registrados)

## ⚙️ **Configuración Avanzada**

### **Archivo config.py**

```python
# Personalizar comportamiento
SCRAPER_CONFIG = {
    'delay_between_searches': 2.0,        # Delay entre búsquedas
    'headless_mode': True,                # Modo sin interfaz gráfica
    'downloads_folder': '~/Downloads',    # Carpeta de salida
}

SYNC_CONFIG = {
    'check_duplicates': True,             # Verificar duplicados
    'duplicate_key_fields': ['artist_name', 'timestamp'],  # Campos clave
    'update_existing': False,             # Solo agregar nuevos
    'batch_size': 100,                    # Registros por lote
}
```

### **Opciones de Línea de Comandos**

```bash
--delay 3.0          # Delay personalizado entre búsquedas
--headless           # Ejecutar sin interfaz gráfica
--output "nombre"    # Nombre personalizado para archivos
--interactive        # Modo interactivo para ingresar artistas
```

## 🔄 **Flujo de Trabajo Recomendado**

### **1. Configuración Inicial**

```bash
# Crear lista de artistas
echo "nicki nicole" > artists_list.txt
echo "emilia" >> artists_list.txt
echo "bad bunny" >> artists_list.txt
```

### **2. Procesamiento y Sincronización**

```bash
# Procesar y sincronizar en una sola ejecución
python google_sheets_sync.py --file artists_list.txt
```

### **3. Verificación**

- Revisar Google Sheets para confirmar sincronización
- Verificar archivos CSV en Descargas
- Revisar logs para detalles del proceso

## 📝 **Casos de Uso**

### **Agencias de Música**

- Verificar estado de múltiples artistas
- Mantener base de datos actualizada
- Análisis de tendencias de registro

### **Estudios de Grabación**

- Revisar registros de artistas asociados
- Auditorías de cumplimiento
- Gestión de derechos de autor

### **Investigación**

- Análisis masivo de artistas en SoundExchange
- Estudios de mercado musical
- Investigación académica

## 🚨 **Solución de Problemas**

### **Error de Autenticación Google**

```bash
# Verificar archivo de credenciales
ls -la credentials/

# Verificar permisos del Google Sheet
python list_sheets.py
```

### **Error de Cookies Cloudflare**

```bash
# Aumentar delay entre búsquedas
python batch_artist_scraper.py --file artists_list.txt --delay 5.0
```

### **Error de Chrome WebDriver**

```bash
# El script descarga automáticamente el driver
# Si falla, verificar que Chrome esté instalado
```

## 📚 **Ejemplos Prácticos**

### **Ejemplo 1: Procesar Lista Completa**

```bash
# Crear lista de artistas
cat > artists_list.txt << EOF
nicki nicole
emilia
bad bunny
drake
taylor swift
ed sheeran
adele
airbag
coldplay
queen
EOF

# Procesar y sincronizar
python google_sheets_sync.py --file artists_list.txt
```

### **Ejemplo 2: Búsqueda Rápida**

```bash
# Buscar artistas específicos
python google_sheets_sync.py --artists "bad bunny,rosalia,karol g"
```

### **Ejemplo 3: Sincronizar CSV Existente**

```bash
# Si ya tienes un CSV con resultados
python google_sheets_sync.py --sync-existing-csv mis_resultados.csv
```

## 🔒 **Seguridad**

- **Credenciales protegidas**: Carpeta `credentials/` en `.gitignore`
- **Permisos mínimos**: Service account solo con acceso a Google Sheets
- **Logs seguros**: No se registran datos sensibles

## 📞 **Soporte**

### **Logs del Sistema**

- `artist_scraper.log` - Scraper individual
- `batch_artist_scraper.log` - Scraper en lote
- `google_sheets_sync.log` - Sincronización

### **Verificación de Estado**

```bash
# Verificar conexión con Google Sheets
python -c "from google_sheets_sync import GoogleSheetsSync; gs = GoogleSheetsSync(); print('✅ Conexión exitosa')"

# Verificar scraper
python -c "from batch_artist_scraper import BatchArtistScraper; print('✅ Scraper listo')"
```

## 🎉 **¡Listo para Usar!**

El sistema está configurado para:

1. **Procesar artistas** de forma eficiente
2. **Sincronizar automáticamente** con Google Sheets
3. **Detectar duplicados** para evitar datos repetidos
4. **Generar reportes** en CSV para análisis
5. **Mantener logs** detallados del proceso

¡Disfruta automatizando tu búsqueda de artistas en SoundExchange! 🎵
