#!/usr/bin/env python3
"""
🎵 Google Sheets Sync - SoundExchange
====================================

Sincroniza los resultados del scraper con Google Sheets.
Verifica duplicados y agrega solo registros nuevos.

Uso:
    python google_sheets_sync.py --artists "artista1,artista2"
    python google_sheets_sync.py --file artists_list.txt
    python google_sheets_sync.py --sync-existing-csv archivo.csv
"""

import json
import time
import sys
import argparse
from datetime import datetime
import logging
from typing import List, Dict, Optional, Set, Tuple
from pathlib import Path

import pandas as pd
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Importar configuraciones y scraper
from config import GOOGLE_SHEETS_CONFIG, SCRAPER_CONFIG, SYNC_CONFIG, LOGGING_CONFIG
from batch_artist_scraper import BatchArtistScraper

# Configurar logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['level']),
    format=LOGGING_CONFIG['format'],
    handlers=[
        logging.FileHandler(LOGGING_CONFIG['file']),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class GoogleSheetsSync:
    """Clase para sincronizar datos con Google Sheets"""
    
    def __init__(self):
        self.creds = None
        self.service = None
        self.spreadsheet_id = GOOGLE_SHEETS_CONFIG['spreadsheet_id']
        self.sheet_name = GOOGLE_SHEETS_CONFIG['sheet_name']
        self.range_name = GOOGLE_SHEETS_CONFIG['range_name']
        self.credentials_file = GOOGLE_SHEETS_CONFIG['credentials_file']
        
        # Inicializar conexión
        self._authenticate()
    
    def _authenticate(self):
        """Autentica con Google Sheets API"""
        try:
            logger.info("🔐 Autenticando con Google Sheets API...")
            
            # Verificar que existe el archivo de credenciales
            if not Path(self.credentials_file).exists():
                raise FileNotFoundError(f"Archivo de credenciales no encontrado: {self.credentials_file}")
            
            # Definir scope
            SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
            
            # Crear credenciales
            self.creds = Credentials.from_service_account_file(
                self.credentials_file, 
                scopes=SCOPES
            )
            
            # Construir servicio
            self.service = build('sheets', 'v4', credentials=self.creds)
            
            logger.info("✅ Autenticación exitosa con Google Sheets API")
            
        except Exception as e:
            logger.error(f"❌ Error en autenticación: {e}")
            raise
    
    def get_existing_data(self) -> Tuple[List[List], List[str]]:
        """Obtiene los datos existentes del Google Sheet"""
        try:
            logger.info(f"📊 Obteniendo datos existentes de '{self.sheet_name}'...")
            
            # Construir rango completo
            range_name = f"{self.sheet_name}!{self.range_name}"
            
            # Obtener datos
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                logger.info("📝 Hoja vacía, no hay datos existentes")
                return [], []
            
            # Primera fila son los headers
            headers = values[0]
            data_rows = values[1:] if len(values) > 1 else []
            
            logger.info(f"📊 Datos existentes: {len(data_rows)} filas, {len(headers)} columnas")
            return data_rows, headers
            
        except HttpError as e:
            logger.error(f"❌ Error obteniendo datos del Google Sheet: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Error inesperado: {e}")
            raise
    
    def check_duplicates(self, existing_data: List[List], headers: List[str], 
                        new_data: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Verifica duplicados y separa registros nuevos de existentes"""
        if not SYNC_CONFIG['check_duplicates']:
            logger.info("⚠️ Verificación de duplicados deshabilitada")
            return new_data, []
        
        logger.info("🔍 Verificando duplicados...")
        
        # Crear conjunto de claves existentes
        existing_keys = set()
        for row in existing_data:
            if len(row) >= len(SYNC_CONFIG['duplicate_key_fields']):
                key_parts = []
                for field in SYNC_CONFIG['duplicate_key_fields']:
                    if field in headers:
                        field_index = headers.index(field)
                        if field_index < len(row):
                            key_parts.append(str(row[field_index]))
                        else:
                            key_parts.append("")
                    else:
                        key_parts.append("")
                existing_keys.add("|".join(key_parts))
        
        # Separar registros nuevos de existentes
        new_records = []
        duplicate_records = []
        
        for record in new_data:
            key_parts = []
            for field in SYNC_CONFIG['duplicate_key_fields']:
                key_parts.append(str(record.get(field, "")))
            record_key = "|".join(key_parts)
            
            if record_key in existing_keys:
                duplicate_records.append(record)
                logger.debug(f"🔄 Duplicado encontrado: {record.get('artist_name', 'N/A')}")
            else:
                new_records.append(record)
        
        logger.info(f"✅ Verificación completada: {len(new_records)} nuevos, {len(duplicate_records)} duplicados")
        return new_records, duplicate_records
    
    def prepare_data_for_sheets(self, data: List[Dict], headers: List[str]) -> List[List]:
        """Prepara los datos para insertar en Google Sheets"""
        prepared_data = []
        
        for record in data:
            row = []
            for header in headers:
                value = record.get(header, "")
                # Convertir listas a strings separados por punto y coma
                if isinstance(value, list):
                    value = "; ".join(str(item) for item in value)
                row.append(str(value))
            prepared_data.append(row)
        
        return prepared_data
    
    def append_data(self, data: List[List], headers: List[str] = None) -> bool:
        """Agrega nuevos datos al Google Sheet"""
        if not data:
            logger.info("📝 No hay datos nuevos para agregar")
            return True
        
        try:
            logger.info(f"📝 Agregando {len(data)} registros nuevos...")
            
            # Si hay headers y la hoja está vacía, agregar headers primero
            if headers and not self._has_headers():
                logger.info("📋 Agregando headers a la hoja...")
                self._add_headers(headers)
            
            # Construir rango para append
            range_name = f"{self.sheet_name}!A:A"
            
            # Preparar datos para append
            body = {
                'values': data
            }
            
            # Ejecutar append
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            
            updated_range = result.get('updates', {}).get('updatedRange', '')
            logger.info(f"✅ Datos agregados exitosamente. Rango actualizado: {updated_range}")
            
            return True
            
        except HttpError as e:
            logger.error(f"❌ Error agregando datos: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado: {e}")
            return False
    
    def _has_headers(self) -> bool:
        """Verifica si la hoja ya tiene headers"""
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.sheet_name}!A1:M1"
            ).execute()
            
            values = result.get('values', [])
            return len(values) > 0 and len(values[0]) > 0
            
        except Exception:
            return False
    
    def _add_headers(self, headers: List[str]) -> bool:
        """Agrega headers a la primera fila de la hoja"""
        try:
            body = {
                'values': [headers]
            }
            
            result = self.service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"{self.sheet_name}!A1",
                valueInputOption='RAW',
                body=body
            ).execute()
            
            logger.info(f"✅ Headers agregados exitosamente: {headers}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error agregando headers: {e}")
            return False
    
    def sync_data(self, new_data: List[Dict]) -> Dict:
        """Sincroniza los datos nuevos con Google Sheets"""
        try:
            logger.info("🔄 Iniciando sincronización con Google Sheets...")
            
            # Obtener datos existentes
            existing_data, headers = self.get_existing_data()
            
            # Si no hay headers, usar los del nuevo data
            if not headers and new_data:
                headers = list(new_data[0].keys())
                logger.info(f"📋 Headers generados automáticamente: {headers}")
            
            # Verificar duplicados
            new_records, duplicate_records = self.check_duplicates(
                existing_data, headers, new_data
            )
            
            # Preparar datos para sheets
            prepared_data = self.prepare_data_for_sheets(new_records, headers)
            
            # Agregar datos nuevos
            success = self.append_data(prepared_data, headers)
            
            # Preparar resumen
            summary = {
                'total_processed': len(new_data),
                'new_records': len(new_records),
                'duplicate_records': len(duplicate_records),
                'success': success,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"✅ Sincronización completada: {summary}")
            return summary
            
        except Exception as e:
            logger.error(f"❌ Error en sincronización: {e}")
            return {
                'total_processed': len(new_data),
                'new_records': 0,
                'duplicate_records': 0,
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }


def load_csv_data(filepath: str) -> List[Dict]:
    """Carga datos desde un archivo CSV"""
    try:
        logger.info(f"📁 Cargando datos desde CSV: {filepath}")
        
        # Leer CSV
        df = pd.read_csv(filepath)
        
        # Convertir a lista de diccionarios
        data = df.to_dict('records')
        
        logger.info(f"✅ CSV cargado: {len(data)} registros")
        return data
        
    except Exception as e:
        logger.error(f"❌ Error cargando CSV: {e}")
        return []


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description="Sincronización con Google Sheets para SoundExchange Scraper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python google_sheets_sync.py --artists "nicki nicole,emilia"
  python google_sheets_sync.py --file artists_list.txt
  python google_sheets_sync.py --sync-existing-csv archivo.csv
        """
    )
    
    parser.add_argument(
        '--artists', 
        type=str, 
        help='Lista de artistas separados por comas'
    )
    parser.add_argument(
        '--file', 
        type=str, 
        help='Archivo de texto con un artista por línea'
    )
    parser.add_argument(
        '--sync-existing-csv', 
        type=str, 
        help='Sincronizar datos desde un CSV existente'
    )
    parser.add_argument(
        '--delay', 
        type=float, 
        default=SCRAPER_CONFIG['delay_between_searches'],
        help='Delay entre búsquedas en segundos'
    )
    parser.add_argument(
        '--headless', 
        action='store_true', 
        default=SCRAPER_CONFIG['headless_mode'],
        help='Ejecutar en modo headless'
    )
    
    args = parser.parse_args()
    
    # Verificar que se especifique al menos un modo
    if not any([args.artists, args.file, args.sync_existing_csv]):
        parser.print_help()
        print("\n❌ Debes especificar al menos un modo de entrada")
        sys.exit(1)
    
    try:
        # Inicializar sincronizador
        logger.info("🚀 Iniciando Google Sheets Sync...")
        sheets_sync = GoogleSheetsSync()
        
        if args.sync_existing_csv:
            # Sincronizar desde CSV existente
            logger.info(f"📁 Sincronizando desde CSV: {args.sync_existing_csv}")
            csv_data = load_csv_data(args.sync_existing_csv)
            
            if csv_data:
                summary = sheets_sync.sync_data(csv_data)
                print(f"\n✅ SINCRONIZACIÓN COMPLETADA")
                print(f"📊 Total procesado: {summary['total_processed']}")
                print(f"🆕 Registros nuevos: {summary['new_records']}")
                print(f"🔄 Registros duplicados: {summary['duplicate_records']}")
                print(f"✅ Estado: {'Exitoso' if summary['success'] else 'Fallido'}")
            else:
                print("❌ No se pudieron cargar datos del CSV")
                
        else:
            # Procesar artistas y sincronizar
            if args.artists:
                artists = [artist.strip() for artist in args.artists.split(',') if artist.strip()]
                print(f"🎵 Artistas especificados: {len(artists)}")
            else:
                from batch_artist_scraper import load_artists_from_file
                artists = load_artists_from_file(args.file)
                if not artists:
                    print(f"❌ No se pudieron cargar artistas desde {args.file}")
                    sys.exit(1)
            
            print(f"📋 Total de artistas: {len(artists)}")
            print(f"⏳ Iniciando procesamiento y sincronización...")
            
            # Crear scraper y procesar
            scraper = BatchArtistScraper(
                headless=args.headless, 
                delay=args.delay
            )
            
            # Procesar artistas
            results = scraper.process_artists_list(artists)
            
            if results:
                # Sincronizar con Google Sheets
                summary = sheets_sync.sync_data(results)
                
                # Mostrar resumen final
                print(f"\n✅ PROCESAMIENTO Y SINCRONIZACIÓN COMPLETADOS")
                print(f"📊 Total de artistas procesados: {len(results)}")
                print(f"🎯 Artistas con resultados: {sum(1 for r in results if r['total_results'] > 0)}")
                print(f"❌ Artistas sin resultados: {sum(1 for r in results if r['total_results'] == 0)}")
                print(f"🔄 SINCRONIZACIÓN:")
                print(f"   • Total procesado: {summary['total_processed']}")
                print(f"   • Registros nuevos: {summary['new_records']}")
                print(f"   • Registros duplicados: {summary['duplicate_records']}")
                print(f"   • Estado: {'Exitoso' if summary['success'] else 'Fallido'}")
                
                # Guardar también en Descargas
                csv_file = scraper.save_to_csv(results, f"soundexchange_sync_{len(artists)}_artists.csv")
                print(f"💾 CSV guardado en Descargas: {csv_file}")
                
            else:
                print("❌ No se obtuvieron resultados")
                
    except KeyboardInterrupt:
        print(f"\n⏹️ Proceso interrumpido por el usuario")
    except Exception as e:
        logger.error(f"❌ Error en el proceso: {e}")
        print(f"\n❌ Error: {e}")
        print("Revisa el log para más detalles")


if __name__ == "__main__":
    main()
