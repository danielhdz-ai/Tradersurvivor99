#!/usr/bin/env python3
"""
BingX API Proxy Server - Versión Mejorada
Implementa correctamente el algoritmo de signature de BingX
"""

import asyncio
import aiohttp
import json
import hmac
import hashlib
import time
from aiohttp import web
from aiohttp.web import middleware
import logging
from urllib.parse import urlencode

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración CORS
@middleware
async def cors_middleware(request, handler):
    """Middleware para manejar CORS"""
    try:
        response = await handler(request)
    except Exception as ex:
        logger.error(f"Error en handler: {ex}")
        response = web.json_response({'error': str(ex)}, status=500)
    
    # Añadir headers CORS
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Max-Age'] = '86400'
    
    return response

async def options_handler(request):
    """Maneja requests OPTIONS para CORS preflight"""
    return web.Response(status=200)

class BingXProxyV2:
    def __init__(self):
        self.base_url = 'https://open-api.bingx.com'
        
    def generate_signature(self, query_string, secret_key):
        """
        Genera la firma HMAC SHA256 para BingX según su documentación oficial
        BingX requiere que los parámetros estén ordenados alfabéticamente
        """
        try:
            logger.info(f"Generating signature for query string: {query_string}")
            logger.info(f"Using secret key (first 10 chars): {secret_key[:10]}...")
            
            # BingX usa HMAC-SHA256 del query string completo
            signature = hmac.new(
                secret_key.encode('utf-8'),
                query_string.encode('utf-8'),
                hashlib.sha256
            ).hexdigest().upper()  # BingX requiere uppercase
            
            logger.info(f"Generated signature: {signature}")
            return signature
        except Exception as e:
            logger.error(f"Error generando signature: {e}")
            raise
    
    async def test_connection(self, request):
        """Endpoint simple para probar conectividad sin autenticación"""
        try:
            url = f"{self.base_url}/openApi/swap/v2/server/time"
            logger.info(f"Testing connection to: {url}")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    result = await response.json()
                    logger.info(f"Server time response: {result}")
                    return web.json_response(result)
                    
        except Exception as e:
            logger.error(f"Error testing connection: {e}")
            return web.json_response({'error': str(e)}, status=500)
    
    async def authenticated_request(self, request):
        """Maneja requests autenticadas a BingX"""
        try:
            # Obtener datos del request
            data = await request.json()
            api_key = data.get('apiKey')
            secret_key = data.get('secretKey')
            endpoint = data.get('endpoint')
            params = data.get('params', {})
            
            logger.info(f"Processing authenticated request to: {endpoint}")
            logger.info(f"Params: {params}")
            
            if not api_key or not secret_key or not endpoint:
                return web.json_response({
                    'error': 'apiKey, secretKey y endpoint son requeridos'
                }, status=400)
            
            # Añadir timestamp (requerido por BingX)
            current_timestamp = int(time.time() * 1000)
            params['timestamp'] = str(current_timestamp)
            
            logger.info(f"Using timestamp: {current_timestamp}")
            logger.info(f"All params before sorting: {params}")
            
            # Filtrar parámetros vacíos y ordenar alfabéticamente (crítico para BingX)
            filtered_params = {k: v for k, v in params.items() if v is not None and v != ''}
            sorted_params = sorted(filtered_params.items())
            
            # Construir query string manualmente para máximo control
            query_parts = []
            for key, value in sorted_params:
                query_parts.append(f"{key}={value}")
            
            query_string = "&".join(query_parts)
            logger.info(f"Final query string for signature: {query_string}")
            
            # Generar signature
            signature = self.generate_signature(query_string, secret_key)
            
            # Construir URL final con signature
            full_url = f"{self.base_url}{endpoint}?{query_string}&signature={signature}"
            
            # Headers para la request
            headers = {
                'X-BX-APIKEY': api_key,
                'Content-Type': 'application/json'
            }
            
            logger.info(f"Making authenticated request to: {full_url}")
            
            # Hacer la request
            async with aiohttp.ClientSession() as session:
                async with session.get(full_url, headers=headers) as response:
                    result = await response.json()
                    logger.info(f"BingX response: {result}")
                    return web.json_response(result)
                    
        except Exception as e:
            logger.error(f"Error en authenticated_request: {e}")
            return web.json_response({'error': str(e)}, status=500)

async def create_app():
    """Crear la aplicación web"""
    proxy = BingXProxyV2()
    
    app = web.Application(middlewares=[cors_middleware])
    
    # Rutas
    app.router.add_post('/api/bingx/test', proxy.test_connection)
    app.router.add_post('/api/bingx/auth', proxy.authenticated_request)
    app.router.add_options('/api/bingx/test', options_handler)
    app.router.add_options('/api/bingx/auth', options_handler)
    
    # Ruta de salud
    app.router.add_get('/health', lambda r: web.json_response({'status': 'ok', 'version': '2.0'}))
    app.router.add_options('/health', options_handler)
    
    return app

async def main():
    """Función principal"""
    app = await create_app()
    
    # Configurar servidor
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, 'localhost', 8003)
    await site.start()
    
    print("🚀 BingX Proxy Server V2 iniciado en http://127.0.0.1:8003")
    print("✅ CORS habilitado para todas las origins")
    print("📡 Endpoints disponibles:")
    print("   POST /api/bingx/test - Test de conectividad")
    print("   POST /api/bingx/auth - Requests autenticadas")
    print("   GET  /health        - Health check")
    print("\n🔄 Presiona Ctrl+C para detener")
    
    try:
        await asyncio.Future()  # Mantener corriendo
    except KeyboardInterrupt:
        print("\n⏹️  Deteniendo servidor...")
        await runner.cleanup()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")