# Analizador de Mercado

Este script proporciona un sistema avanzado de análisis de mercado que combina indicadores técnicos y análisis de sentimiento para generar alertas de trading.

## Características

- Obtención de datos de mercado en tiempo real
- Cálculo de indicadores técnicos (SMA, RSI)
- Análisis de sentimiento de noticias financieras
- Sistema de alertas personalizable
- Integración con APIs de mercado

## Requisitos

- Python 3.8 o superior
- Dependencias listadas en `requirements.txt`

## Instalación

1. Clonar el repositorio
2. Crear un entorno virtual:
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```
3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

## Uso

1. Configurar las variables de entorno en `.env`:
```
NEWS_API_KEY=tu_api_key
```

2. Ejecutar el script:
```bash
python market_analyzer.py
```

## Personalización

Puedes modificar los siguientes parámetros en el script:

- Lista de símbolos a analizar
- Umbrales de RSI para alertas
- Períodos de SMA
- Criterios de sentimiento

## Alertas

El sistema genera alertas basadas en:

- Cruces de SMA
- Niveles de RSI
- Sentimiento de noticias
- Combinaciones de indicadores

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir los cambios propuestos.

## Licencia

MIT 