#!/usr/bin/env python3
"""
🎵 Artist Scraper - SoundExchange
================================

Scraper general para buscar cualquier artista en SoundExchange.
Busca en todas las categorías y muestra los resultados de forma clara.

Uso:
    python artist_scraper.py "nombre del artista"
    
Ejemplos:
    python artist_scraper.py "nicki nicole"
    python artist_scraper.py "emilia"
    python artist_scraper.py "drake"
    python artist_scraper.py "airbag"
"""

import json
import time
import sys
from datetime import datetime
import logging
from typing import List, Dict

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

SEARCH_PAGE = "https://www.soundexchange.com/what-we-do/for-artists-labels-and-producers/"
AJAX_ENDPOINT = "https://www.soundexchange.com/wp-admin/admin-ajax.php"

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('artist_scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def setup_driver(headless: bool = True):
    """Configura el driver de Chrome"""
    options = Options()
    if headless:
        options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.implicitly_wait(10)
    return driver


def get_cf_cookie() -> dict | None:
    """Obtiene la cookie Cloudflare necesaria"""
    driver = None
    try:
        driver = setup_driver(headless=True)
        logger.info("🌐 Obteniendo cookies Cloudflare...")
        driver.get(SEARCH_PAGE)
        time.sleep(8)
        cookies = driver.get_cookies()
        for c in cookies:
            if c.get('name') == '__cf_bm':
                logger.info("✅ Cookie Cloudflare obtenida")
                return c
        logger.warning("⚠️ No se encontró cookie Cloudflare")
        return None
    except Exception as e:
        logger.error(f"❌ Error obteniendo cookie: {e}")
        return None
    finally:
        try:
            if driver:
                driver.quit()
        except Exception:
            pass


def search_artist(session: requests.Session, artist: str, category: str) -> List[str]:
    """Busca un artista en una categoría específica"""
    data = {
        'action': 'ulists_get_query',
        'ul_cate': category,
        'ul_search': artist,
        'ul_type': ''
    }
    
    try:
        response = session.post(AJAX_ENDPOINT, data=data, timeout=30)
        logger.info(f"🔍 {category}: HTTP {response.status_code}")
        
        if response.status_code == 200:
            # Intentar parsear JSON
            try:
                data = json.loads(response.content.decode('utf-8'))
                html = data.get('html', '')
                soup = BeautifulSoup(html, 'html.parser')
                items = [el.get_text(strip=True) for el in soup.select('.uli-search-item') if el.get_text(strip=True)]
                return items
            except json.JSONDecodeError:
                # Intentar latin-1
                try:
                    data = json.loads(response.content.decode('latin-1'))
                    html = data.get('html', '')
                    soup = BeautifulSoup(html, 'html.parser')
                    items = [el.get_text(strip=True) for el in soup.select('.uli-search-item') if el.get_text(strip=True)]
                    return items
                except:
                    return []
        else:
            logger.error(f"❌ {category}: HTTP {response.status_code}")
            return []
            
    except Exception as e:
        logger.error(f"❌ {category}: Error - {e}")
        return []


def search_all_categories(artist: str) -> Dict[str, List[str]]:
    """Busca un artista en todas las categorías"""
    categories = {
        'UA': 'Unregistered Artists',
        'PUA': 'Partially Unregistered Artists', 
        'UP': 'Unregistered Performers',
        'USRO': 'Unregistered Sound Recording Owners'
    }
    
    results = {}
    
    # Obtener cookie Cloudflare
    cf_cookie = get_cf_cookie()
    if not cf_cookie:
        logger.error("❌ No se pudo obtener cookie Cloudflare")
        return results
    
    # Configurar sesión
    session = requests.Session()
    session.headers.update({
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-encoding': 'gzip, deflate',
        'accept-language': 'es-419,es;q=0.7',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://www.soundexchange.com',
        'referer': SEARCH_PAGE,
        'x-requested-with': 'XMLHttpRequest',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    })
    session.cookies.set(cf_cookie['name'], cf_cookie['value'], domain=cf_cookie['domain'])
    
    # Buscar en cada categoría
    logger.info(f"🚀 Buscando '{artist}' en todas las categorías...")
    
    for code, name in categories.items():
        logger.info(f"🔍 Buscando en {name} ({code})...")
        results[code] = search_artist(session, artist, code)
        time.sleep(1)  # Pausa entre búsquedas
    
    return results


def display_results(artist: str, results: Dict[str, List[str]]):
    """Muestra los resultados de forma clara y organizada"""
    print(f"\n🎵 RESULTADOS PARA: {artist.upper()}")
    print("=" * 60)
    
    total_results = 0
    categories_with_results = 0
    
    for code, items in results.items():
        category_names = {
            'UA': '🎤 Unregistered Artists',
            'PUA': '🎭 Partially Unregistered Artists',
            'UP': '🎪 Unregistered Performers', 
            'USRO': '💿 Unregistered Sound Recording Owners'
        }
        
        category_name = category_names.get(code, code)
        
        if items:
            categories_with_results += 1
            total_results += len(items)
            print(f"\n{category_name} ({len(items)} resultado{'s' if len(items) != 1 else ''}):")
            for i, item in enumerate(items, 1):
                print(f"  {i}. {item}")
        else:
            print(f"\n{category_name}: ❌ Sin resultados")
    
    print(f"\n📊 RESUMEN:")
    print(f"  • Total de resultados: {total_results}")
    print(f"  • Categorías con resultados: {categories_with_results}/4")
    
    if total_results == 0:
        print(f"\n⚠️ No se encontraron resultados para '{artist}' en ninguna categoría.")
        print("   El artista podría estar completamente registrado o no estar en la base de datos.")
    else:
        print(f"\n✅ Se encontraron resultados para '{artist}' en {categories_with_results} categoría{'s' if categories_with_results != 1 else ''}.")


def save_results(artist: str, results: Dict[str, List[str]]):
    """Guarda los resultados en un archivo JSON"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_artist = artist.replace(' ', '_').replace('&', 'and').lower()
    filename = f"{safe_artist}_results_{timestamp}.json"
    
    data = {
        'artist': artist,
        'timestamp': timestamp,
        'total_results': sum(len(items) for items in results.values()),
        'categories': {
            'UA': {'name': 'Unregistered Artists', 'results': results['UA']},
            'PUA': {'name': 'Partially Unregistered Artists', 'results': results['PUA']},
            'UP': {'name': 'Unregistered Performers', 'results': results['UP']},
            'USRO': {'name': 'Unregistered Sound Recording Owners', 'results': results['USRO']}
        }
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Resultados guardados en: {filename}")
    return filename


def main():
    """Función principal"""
    print("🎵 ARTIST SCRAPER - SoundExchange")
    print("=" * 40)
    
    # Verificar argumentos
    if len(sys.argv) < 2:
        print("❌ Uso: python artist_scraper.py \"nombre del artista\"")
        print("\nEjemplos:")
        print("  python artist_scraper.py \"nicki nicole\"")
        print("  python artist_scraper.py \"emilia\"")
        print("  python artist_scraper.py \"drake\"")
        print("  python artist_scraper.py \"airbag\"")
        sys.exit(1)
    
    artist = sys.argv[1].strip()
    
    if not artist:
        print("❌ El nombre del artista no puede estar vacío")
        sys.exit(1)
    
    print(f"🔍 Buscando: {artist}")
    print("⏳ Esto puede tomar unos segundos...")
    
    try:
        # Realizar búsqueda
        results = search_all_categories(artist)
        
        # Mostrar resultados
        display_results(artist, results)
        
        # Guardar resultados
        save_results(artist, results)
        
        print(f"\n✅ Búsqueda completada para '{artist}'")
        
    except KeyboardInterrupt:
        print(f"\n⏹️ Búsqueda interrumpida por el usuario")
    except Exception as e:
        logger.error(f"❌ Error en la búsqueda: {e}")
        print(f"\n❌ Error: {e}")
        print("Revisa el log para más detalles")


if __name__ == "__main__":
    main()
