.PHONY: help install clean test run-scraper run-batch run-sync setup-venv

help: ## Mostrar esta ayuda
	@echo "🎵 SoundExchange Scraper - Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup-venv: ## Crear entorno virtual
	python3 -m venv venv
	@echo "✅ Entorno virtual creado. Activa con: source venv/bin/activate"

install: ## Instalar dependencias
	pip install -r requirements.txt
	@echo "✅ Dependencias instaladas"

install-dev: ## Instalar en modo desarrollo
	pip install -e .
	@echo "✅ Instalado en modo desarrollo"

clean: ## Limpiar archivos temporales
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.log" -delete
	find . -type f -name "*.csv" -delete
	find . -type f -name "*.json" -delete
	@echo "✅ Archivos temporales eliminados"

test: ## Ejecutar tests (cuando estén disponibles)
	@echo "🧪 Ejecutando tests..."
	python -m pytest tests/ -v

run-scraper: ## Ejecutar scraper individual
	python artist_scraper.py "nicki nicole"

run-batch: ## Ejecutar scraper en lote
	python batch_artist_scraper.py --file artists_list.txt

run-sync: ## Ejecutar sincronización con Google Sheets
	python google_sheets_sync.py --file artists_list.txt

run-interactive: ## Ejecutar scraper en modo interactivo
	python batch_artist_scraper.py --interactive

check-credentials: ## Verificar credenciales de Google
	@echo "🔐 Verificando credenciales..."
	@if [ -f "credentials/music-x-rights-a92e818c3726.json" ]; then \
		echo "✅ Archivo de credenciales encontrado"; \
	else \
		echo "❌ Archivo de credenciales no encontrado"; \
		echo "   Coloca tu archivo JSON en credentials/"; \
	fi

setup: setup-venv install ## Configurar proyecto completo
	@echo "🎉 Proyecto configurado completamente!"
	@echo "📖 Lee README.md para más información"
	@echo "🚀 Activa el entorno virtual: source venv/bin/activate"
