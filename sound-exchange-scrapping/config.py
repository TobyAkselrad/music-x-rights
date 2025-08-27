#!/usr/bin/env python3
"""
Configuración para Google Sheets Sync
====================================

Archivo de configuración para la sincronización con Google Sheets.
"""

import os
from pathlib import Path

# Configuración de Google Sheets
GOOGLE_SHEETS_CONFIG = {
    'spreadsheet_id': '1g3HbrJYbwwDk1_wyQ9RXE_sXh6wVqzssP-JkvlEM89g',
    'sheet_name': 'Hoja 1',  # Nombre de la hoja
    'credentials_file': 'credentials/music-x-rights-a92e818c3726.json',
    'range_name': 'A:M',  # Rango de columnas (A-M para todas las columnas)
}

# Configuración del scraper
SCRAPER_CONFIG = {
    'delay_between_searches': 2.0,
    'headless_mode': True,
    'downloads_folder': str(Path.home() / "Downloads"),
}

# Configuración de sincronización
SYNC_CONFIG = {
    'check_duplicates': True,
    'duplicate_key_fields': ['artist_name', 'timestamp'],  # Campos para identificar duplicados
    'update_existing': False,  # Si True, actualiza registros existentes; si False, solo agrega nuevos
    'batch_size': 100,  # Número de registros a procesar por lote
}

# Configuración de logging
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(levelname)s - %(message)s',
    'file': 'google_sheets_sync.log',
}
