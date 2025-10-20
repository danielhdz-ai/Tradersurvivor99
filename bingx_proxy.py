#!/usr/bin/env python3
"""
BingX API Proxy Server
Soluciona problemas de CORS permitiendo llamadas desde el navegador
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

class BingXProxy:
    def __init__(self):
        self.base_url = 'https://open-api.bingx.com'
        
    def generate_signature(self, query_string, secret_key, timestamp):
        """Genera la firma HMAC SHA256 para BingX"""
        try:
            # Para BingX, el string_to_sign es: timestamp + "GET" + endpoint + "?" + query_string
            string_to_sign = f"{timestamp}GET{query_string}"
            logger.info(f"String to sign: {string_to_sign}")
            
            signature = hmac.new(
                secret_key.encode('utf-8'),
                string_to_sign.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            logger.info(f"Generated signature: {signature}")
            return signature
        except Exception as e:
            logger.error(f"Error generando signature: {e}")
            raise
    
    async def proxy_request(self, request):
        """Proxy para las requests de BingX"""
        try:
            # Obtener datos del request
            data = await request.json()
            api_key = data.get('apiKey')
            secret_key = data.get('secretKey')
            endpoint = data.get('endpoint', '/openApi/swap/v2/server/time')
            params = data.get('params', {})
            
            logger.info(f"Processing request to endpoint: {endpoint}")
            logger.info(f"Params: {params}")
            
            if not api_key or not secret_key:
                return web.json_response({'error': 'API Key y Secret Key requeridos'}, status=400)
            
            # Preparar timestamp y query string
            timestamp = str(int(time.time() * 1000))
            
            # Para endpoints que requieren autenticación
            if endpoint != '/openApi/swap/v2/server/time':
                params['timestamp'] = timestamp
            
            # Crear query string ordenado alfabéticamente (importante para BingX)
            if params:
                sorted_params = sorted(params.items())
                query_string = '&'.join([f"{k}={v}" for k, v in sorted_params])
            else:
                query_string = ""
            
            # Construir la URL
            if query_string:
                full_endpoint = f"{endpoint}?{query_string}"
            else:
                full_endpoint = endpoint
            
            # Preparar headers
            headers = {'Content-Type': 'application/json'}
            
            # Generar signature si se requiere autenticación
            if endpoint != '/openApi/swap/v2/server/time':
                # Para BingX, el string para firmar incluye el endpoint completo
                string_to_sign_base = f"{endpoint}?{query_string}" if query_string else endpoint
                signature = self.generate_signature(string_to_sign_base, secret_key, timestamp)
                full_endpoint += f"&signature={signature}" if query_string else f"?signature={signature}"
                headers['X-BX-APIKEY'] = api_key
            
            # Hacer la request a BingX
            full_url = f"{self.base_url}{full_endpoint}"
            logger.info(f"Making request to: {full_url}")
            
            async with aiohttp.ClientSession() as session:
                async with session.get(full_url, headers=headers) as response:
                    result = await response.json()
                    logger.info(f"BingX Response: {result}")
                    return web.json_response(result)
                    
        except Exception as e:
            logger.error(f"Error en proxy_request: {e}")
            return web.json_response({'error': str(e)}, status=500)

async def create_app():
    """Crear la aplicación web"""
    proxy = BingXProxy()
    
    app = web.Application(middlewares=[cors_middleware])
    
    # Rutas
    app.router.add_post('/api/bingx', proxy.proxy_request)
    app.router.add_options('/api/bingx', options_handler)
    
    # Ruta de salud
    app.router.add_get('/health', lambda r: web.json_response({'status': 'ok'}))
    app.router.add_options('/health', options_handler)
    
    return app

async def main():
    """Función principal"""
    app = await create_app()
    
    # Configurar servidor
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, 'localhost', 8001)
    await site.start()
    
    print("🚀 BingX Proxy Server iniciado en http://localhost:8001")
    print("✅ CORS habilitado para todas las origins")
    print("📡 Endpoints disponibles:")
    print("   POST /api/bingx - Proxy para BingX API")
    print("   GET  /health   - Health check")
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