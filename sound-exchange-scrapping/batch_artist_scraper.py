#!/usr/bin/env python3
"""
🎵 Batch Artist Scraper - SoundExchange
=======================================

Scraper en lote para procesar múltiples artistas y generar resultados en CSV.
Permite procesar una lista de artistas desde un archivo de texto o lista directa.

Uso:
    python batch_artist_scraper.py --artists "artista1,artista2,artista3"
    python batch_artist_scraper.py --file artists_list.txt
    python batch_artist_scraper.py --interactive
"""

import json
import time
import sys
import csv
import argparse
from datetime import datetime
import logging
from typing import List, Dict, Optional
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# Importar funciones del scraper original
from artist_scraper import setup_driver, get_cf_cookie, search_artist

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('batch_artist_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

SEARCH_PAGE = "https://www.soundexchange.com/what-we-do/for-artists-labels-and-producers/"
AJAX_ENDPOINT = "https://www.soundexchange.com/wp-admin/admin-ajax.php"


class BatchArtistScraper:
    """Clase para procesar múltiples artistas en lote"""
    
    def __init__(self, headless: bool = True, delay: float = 2.0):
        self.headless = headless
        self.delay = delay
        self.session = None
        self.cf_cookie = None
        self.categories = {
            'UA': 'Unregistered Artists',
            'PUA': 'Partially Unregistered Artists', 
            'UP': 'Unregistered Performers',
            'USRO': 'Unregistered Sound Recording Owners'
        }
    
    def setup_session(self) -> bool:
        """Configura la sesión con cookies Cloudflare"""
        try:
            logger.info("🌐 Configurando sesión...")
            
            # Obtener cookie Cloudflare
            self.cf_cookie = get_cf_cookie()
            if not self.cf_cookie:
                logger.error("❌ No se pudo obtener cookie Cloudflare")
                return False
            
            # Configurar sesión
            self.session = requests.Session()
            self.session.headers.update({
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-encoding': 'gzip, deflate',
                'accept-language': 'es-419,es;q=0.7',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'origin': 'https://www.soundexchange.com',
                'referer': SEARCH_PAGE,
                'x-requested-with': 'XMLHttpRequest',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
            })
            self.session.cookies.set(
                self.cf_cookie['name'], 
                self.cf_cookie['value'], 
                domain=self.cf_cookie['domain']
            )
            
            logger.info("✅ Sesión configurada exitosamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error configurando sesión: {e}")
            return False
    
    def search_artist(self, artist: str) -> Dict[str, List[str]]:
        """Busca un artista en todas las categorías"""
        if not self.session:
            logger.error("❌ Sesión no configurada")
            return {}
        
        results = {}
        logger.info(f"🔍 Buscando '{artist}' en todas las categorías...")
        
        for code, name in self.categories.items():
            logger.info(f"🔍 Buscando en {name} ({code})...")
            results[code] = search_artist(self.session, artist, code)
            time.sleep(self.delay)  # Pausa entre búsquedas
        
        return results
    
    def process_artist(self, artist: str) -> Dict:
        """Procesa un artista y retorna los resultados estructurados"""
        results = self.search_artist(artist)
        
        # Calcular totales
        total_results = sum(len(items) for items in results.values())
        categories_with_results = sum(1 for items in results.values() if items)
        
        # Estructurar datos para CSV
        artist_data = {
            'artist_name': artist,
            'timestamp': datetime.now().isoformat(),
            'total_results': total_results,
            'categories_with_results': categories_with_results,
            'UA_count': len(results.get('UA', [])),
            'PUA_count': len(results.get('PUA', [])),
            'UP_count': len(results.get('UP', [])),
            'USRO_count': len(results.get('USRO', [])),
            'UA_results': '; '.join(results.get('UA', [])),
            'PUA_results': '; '.join(results.get('PUA', [])),
            'UP_results': '; '.join(results.get('UP', [])),
            'USRO_results': '; '.join(results.get('USRO', [])),
            'status': 'Found' if total_results > 0 else 'Not Found'
        }
        
        return artist_data
    
    def process_artists_list(self, artists: List[str]) -> List[Dict]:
        """Procesa una lista de artistas"""
        if not self.setup_session():
            return []
        
        results = []
        total_artists = len(artists)
        
        logger.info(f"🚀 Procesando {total_artists} artistas...")
        
        for i, artist in enumerate(artists, 1):
            artist = artist.strip()
            if not artist:
                continue
                
            logger.info(f"🎵 [{i}/{total_artists}] Procesando: {artist}")
            
            try:
                artist_data = self.process_artist(artist)
                results.append(artist_data)
                
                # Mostrar resumen
                if artist_data['total_results'] > 0:
                    logger.info(f"✅ {artist}: {artist_data['total_results']} resultados en {artist_data['categories_with_results']} categorías")
                else:
                    logger.info(f"⚠️ {artist}: Sin resultados")
                
            except Exception as e:
                logger.error(f"❌ Error procesando {artist}: {e}")
                # Agregar registro de error
                error_data = {
                    'artist_name': artist,
                    'timestamp': datetime.now().isoformat(),
                    'total_results': 0,
                    'categories_with_results': 0,
                    'UA_count': 0, 'PUA_count': 0, 'UP_count': 0, 'USRO_count': 0,
                    'UA_results': '', 'PUA_results': '', 'UP_results': '', 'USRO_results': '',
                    'status': f'Error: {str(e)[:100]}'
                }
                results.append(error_data)
            
            # Pausa entre artistas
            if i < total_artists:
                time.sleep(self.delay)
        
        return results
    
    def save_to_csv(self, data: List[Dict], filename: Optional[str] = None) -> str:
        """Guarda los resultados en un archivo CSV"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"batch_artists_results_{timestamp}.csv"
        
        # Guardar por defecto en Descargas
        downloads_path = Path.home() / "Downloads"
        if not filename.startswith('/') and not filename.startswith('~'):
            filename = downloads_path / filename
        
        # Definir campos del CSV
        fieldnames = [
            'artist_name', 'timestamp', 'total_results', 'categories_with_results',
            'UA_count', 'PUA_count', 'UP_count', 'USRO_count',
            'UA_results', 'PUA_results', 'UP_results', 'USRO_results', 'status'
        ]
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(data)
            
            logger.info(f"💾 Resultados guardados en CSV: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ Error guardando CSV: {e}")
            return ""
    
    def save_to_json(self, data: List[Dict], filename: Optional[str] = None) -> str:
        """Guarda los resultados en un archivo JSON"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"batch_artists_results_{timestamp}.json"
        
        # Guardar por defecto en Descargas
        downloads_path = Path.home() / "Downloads"
        if not filename.startswith('/') and not filename.startswith('~'):
            filename = downloads_path / filename
        
        try:
            json_data = {
                'metadata': {
                    'total_artists': len(data),
                    'timestamp': datetime.now().isoformat(),
                    'total_results_found': sum(1 for item in data if item['total_results'] > 0),
                    'total_results_not_found': sum(1 for item in data if item['total_results'] == 0)
                },
                'results': data
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"💾 Resultados guardados en JSON: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ Error guardando JSON: {e}")
            return ""


def load_artists_from_file(filepath: str) -> List[str]:
    """Carga la lista de artistas desde un archivo de texto"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            artists = [line.strip() for line in f if line.strip()]
        
        logger.info(f"📁 Cargados {len(artists)} artistas desde {filepath}")
        return artists
        
    except Exception as e:
        logger.error(f"❌ Error cargando archivo {filepath}: {e}")
        return []


def interactive_mode():
    """Modo interactivo para ingresar artistas manualmente"""
    print("🎵 Modo Interactivo - Batch Artist Scraper")
    print("=" * 50)
    print("Ingresa los nombres de los artistas (uno por línea)")
    print("Presiona Enter dos veces para finalizar")
    print()
    
    artists = []
    line_count = 0
    
    while True:
        try:
            line = input(f"Artista {line_count + 1}: ").strip()
            if not line:
                if artists:  # Si ya hay artistas, terminar
                    break
                else:
                    print("⚠️ Debes ingresar al menos un artista")
                    continue
            
            artists.append(line)
            line_count += 1
            
        except KeyboardInterrupt:
            print("\n⏹️ Entrada interrumpida")
            break
    
    return artists


def main():
    """Función principal"""
    parser = argparse.ArgumentParser(
        description="Batch Artist Scraper para SoundExchange",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python batch_artist_scraper.py --artists "nicki nicole,emilia,drake"
  python batch_artist_scraper.py --file artists_list.txt
  python batch_artist_scraper.py --interactive
  python batch_artist_scraper.py --artists "bad bunny" --delay 3.0
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
        '--interactive', 
        action='store_true', 
        help='Modo interactivo para ingresar artistas'
    )
    parser.add_argument(
        '--delay', 
        type=float, 
        default=2.0, 
        help='Delay entre búsquedas en segundos (default: 2.0)'
    )
    parser.add_argument(
        '--headless', 
        action='store_true', 
        default=True, 
        help='Ejecutar en modo headless (default: True)'
    )
    parser.add_argument(
        '--output', 
        type=str, 
        help='Nombre del archivo de salida (sin extensión)'
    )
    
    args = parser.parse_args()
    
    # Verificar que se especifique al menos un modo
    if not any([args.artists, args.file, args.interactive]):
        parser.print_help()
        print("\n❌ Debes especificar al menos un modo de entrada")
        sys.exit(1)
    
    # Obtener lista de artistas
    artists = []
    
    if args.artists:
        artists = [artist.strip() for artist in args.artists.split(',') if artist.strip()]
        print(f"🎵 Artistas especificados: {len(artists)}")
        
    elif args.file:
        if not Path(args.file).exists():
            print(f"❌ El archivo {args.file} no existe")
            sys.exit(1)
        artists = load_artists_from_file(args.file)
        if not artists:
            print(f"❌ No se pudieron cargar artistas desde {args.file}")
            sys.exit(1)
            
    elif args.interactive:
        artists = interactive_mode()
        if not artists:
            print("❌ No se ingresaron artistas")
            sys.exit(1)
    
    if not artists:
        print("❌ No hay artistas para procesar")
        sys.exit(1)
    
    # Mostrar resumen
    print(f"\n📋 RESUMEN:")
    print(f"  • Total de artistas: {len(artists)}")
    print(f"  • Delay entre búsquedas: {args.delay}s")
    print(f"  • Modo headless: {args.headless}")
    print(f"  • Artistas: {', '.join(artists[:5])}{'...' if len(artists) > 5 else ''}")
    
    # Confirmar ejecución
    if len(artists) > 10:
        confirm = input(f"\n⚠️ Vas a procesar {len(artists)} artistas. ¿Continuar? (y/N): ")
        if confirm.lower() != 'y':
            print("❌ Operación cancelada")
            sys.exit(0)
    
    # Crear scraper y procesar
    try:
        scraper = BatchArtistScraper(headless=args.headless, delay=args.delay)
        results = scraper.process_artists_list(artists)
        
        if results:
            # Guardar resultados
            base_filename = args.output if args.output else f"soundexchange_batch_{len(artists)}_artists"
            
            csv_file = scraper.save_to_csv(results, f"{base_filename}.csv")
            json_file = scraper.save_to_json(results, f"{base_filename}.json")
            
            # Mostrar resumen final
            print(f"\n✅ PROCESAMIENTO COMPLETADO")
            print(f"📊 Total de artistas procesados: {len(results)}")
            print(f"🎯 Artistas con resultados: {sum(1 for r in results if r['total_results'] > 0)}")
            print(f"❌ Artistas sin resultados: {sum(1 for r in results if r['total_results'] == 0)}")
            print(f"💾 Archivos generados:")
            print(f"   • CSV: {csv_file}")
            print(f"   • JSON: {json_file}")
            
        else:
            print("❌ No se obtuvieron resultados")
            
    except KeyboardInterrupt:
        print(f"\n⏹️ Procesamiento interrumpido por el usuario")
    except Exception as e:
        logger.error(f"❌ Error en el procesamiento: {e}")
        print(f"\n❌ Error: {e}")
        print("Revisa el log para más detalles")


if __name__ == "__main__":
    main()
