const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios'); // Volvemos a axios que es más compatible

const app = express();
const PORT = process.env.PORT || 8003;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // Añadimos cabeceras que el frontend puede usar para pasar credenciales a la ruta proxy
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'X-SECRET-KEY', 'X-ACCOUNT-ID', 'ApiKey', 'Request-Time', 'X-PASSPHRASE', 'X-TIMESTAMP', 'ACCESS-KEY', 'ACCESS-SIGN', 'ACCESS-TIMESTAMP', 'ACCESS-PASSPHRASE']
}));

app.use(express.json());

// Function to create HMAC signature for BingX API
function createSignature(queryString, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(queryString)
        .digest('hex');
}

// Test endpoint for MEXC
app.get('/api/mexc/test', async (req, res) => {
    try {
        const response = await axios.get('https://contract.mexc.com/api/v1/contract/ping');
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('❌ MEXC Test Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper: obtener server Date de MEXC para verificar diferencia de reloj
app.get('/mexc/_server_time', async (req, res) => {
    try {
        const response = await axios.get('https://contract.mexc.com/api/v1/contract/ping');
        // Algunos endpoints devuelven 400 pero la cabecera Date existe
        const serverDate = response.headers && response.headers.date ? response.headers.date : null;
        return res.json({ success: true, status: response.status, serverDate, data: response.data });
    } catch (error) {
        console.error('❌ Error fetching MEXC server time:', error.message);
        if (error.response) {
            const serverDate = error.response.headers && error.response.headers.date ? error.response.headers.date : null;
            return res.status(error.response.status).json({ success: false, status: error.response.status, serverDate, data: error.response.data });
        }
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Proxy endpoint for MEXC Futures API
app.all('/mexc/*', async (req, res) => {
    try {
        const apiKey = req.headers['apikey'];
        const requestTime = req.headers['request-time'];

        if (!apiKey || !requestTime) {
            return res.status(400).json({
                code: 400,
                msg: 'Faltan headers requeridos (ApiKey o Request-Time)',
                data: null
            });
        }

        // Path de MEXC
        const path = req.path.replace('/mexc', '');
        
        // Construir URL completa con todos los parámetros (ya vienen con la firma incluida)
        const queryString = Object.keys(req.query)
            .map(key => `${key}=${req.query[key]}`)
            .join('&');
        
        const url = `https://contract.mexc.com${path}?${queryString}`;
        
        console.log(`📡 MEXC Request: ${path}`);
        console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
        console.log(`⏰ Request-Time: ${requestTime}`);
        console.log(`🔐 Query String: ${queryString}`);
        console.log(`🌍 Full URL: ${url}`);

        // Hacer request a MEXC con los headers correctos
        const response = await axios({
            method: req.method,
            url: url,
            headers: {
                'ApiKey': apiKey,
                'Request-Time': requestTime,
                'Content-Type': 'application/json',
                'User-Agent': 'MEXC-Proxy/1.0'
            }
        });

        console.log(`📊 MEXC Response Status:`, response.status);
        console.log(`📊 MEXC Response Data:`, response.data);
        
        res.json(response.data);

    } catch (error) {
        console.error('❌ MEXC Proxy Error:', error.message);
        
        if (error.response) {
            console.error('📊 MEXC Error Response Status:', error.response.status);
            console.error('📊 MEXC Error Response Data:', error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            console.error('🔌 Connection Error:', error.request);
            res.status(500).json({
                code: 500,
                msg: 'Error de conexión con MEXC',
                data: null
            });
        } else {
            res.status(500).json({
                code: 500,
                msg: error.message,
                data: null
            });
        }
    }
});

// Proxy endpoint for BingX API - VERSION SIMPLE
app.all('/bingx/*', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const secretKey = req.headers['x-secret-key'];

        if (!apiKey || !secretKey) {
            return res.status(400).json({
                code: 400,
                msg: 'Faltan credenciales',
                data: null
            });
        }

        // Path de BingX
        const path = req.path.replace('/bingx', '');
        
        // Crear parámetros con timestamp
        const timestamp = Date.now();
        const params = {
            ...req.query,
            timestamp: timestamp,
            recvWindow: 60000
        };

        // Crear query string para firma según documentación de BingX
        // Los parámetros deben estar ordenados alfabéticamente
        const sortedKeys = Object.keys(params).sort();
        const queryString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
        
        console.log(`🔐 Parámetros ordenados: ${JSON.stringify(sortedKeys)}`);
        console.log(`🔐 Query string completo: ${queryString}`);
        
        // Crear firma HMAC SHA256
        const signature = createSignature(queryString, secretKey);
        params.signature = signature;

        // URL final con parámetros codificados
        const urlParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            urlParams.append(key, params[key]);
        });
        
        const url = `https://open-api.bingx.com${path}?${urlParams.toString()}`;
        
        console.log(`📡 BingX Request: ${path}`);
        console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
        console.log(`🔐 Query: ${queryString}`);
        console.log(`✍️ Signature: ${signature}`);
        console.log(`🌍 Full URL: ${url}`);

        // Hacer request a BingX
        const response = await axios({
            method: req.method,
            url: url,
            headers: {
                'X-BX-APIKEY': apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'BingX-Proxy/1.0'
            }
        });

        console.log(`📊 BingX Response:`, response.data);
        
        res.json(response.data);

    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        
        if (error.response) {
            // BingX respondió con un error
            console.error('📊 BingX Error Response:', error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // Error de conexión
            console.error('🔌 Connection Error:', error.request);
            res.status(500).json({
                code: 500,
                msg: 'Error de conexión con BingX',
                data: null
            });
        } else {
            // Otro tipo de error
            res.status(500).json({
                code: 500,
                msg: error.message,
                data: null
            });
        }
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'BingX & MEXC Proxy Server funcionando correctamente'
    });
});

// Proxy endpoint for Bitget API
app.all('/bitget/*', async (req, res) => {
    try {
        // Leer credenciales desde headers (permitir varias variantes)
        const apiKey = req.headers['x-api-key'] || req.headers['access-key'] || req.headers['apikey'];
        const secretKey = req.headers['x-secret-key'] || req.headers['x-secret'] || req.headers['access-secret'] || req.headers['secretkey'];
        const passphrase = req.headers['x-passphrase'] || req.headers['access-passphrase'] || req.headers['passphrase'];
        const tsHeader = req.headers['x-timestamp'] || req.headers['access-timestamp'] || req.headers['request-time'];

        if (!apiKey || !secretKey || !passphrase) {
            return res.status(400).json({
                code: 400,
                msg: 'Faltan credenciales para Bitget (ApiKey, SecretKey o Passphrase) en headers',
                data: null
            });
        }

        const method = (req.method || 'GET').toUpperCase();
        const path = req.path.replace('/bitget', '') || '/';

        // Construir requestPath: incluir query string si existe
        const queryString = Object.keys(req.query).length > 0 ? Object.keys(req.query).map(k => `${k}=${req.query[k]}`).join('&') : '';
        const requestPath = queryString ? `${path}?${queryString}` : path;

        // Body para firma
        let body = '';
        if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
            // axios already parses JSON bodies; keep raw body if present
            body = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : '';
        }

        // Timestamp para firma: usar el header si viene, sino generar uno nuevo (ms)
        const timestamp = tsHeader ? tsHeader.toString() : Date.now().toString();

        // Prehash: timestamp + method + requestPath + body
        const prehash = `${timestamp}${method}${requestPath}${body}`;

        // Firma HMAC-SHA256 -> base64
        const signature = crypto.createHmac('sha256', secretKey).update(prehash).digest('base64');

        const url = `https://api.bitget.com${requestPath}`;

        console.log(`📡 Bitget Proxy Request: ${method} ${requestPath}`);
        console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`⏰ Timestamp: ${timestamp}`);
        console.log(`✍️ Signature: ${signature}`);

        // Forward request to Bitget
        const response = await axios({
            method: method,
            url: url,
            headers: {
                'ACCESS-KEY': apiKey,
                'ACCESS-SIGN': signature,
                'ACCESS-TIMESTAMP': timestamp,
                'ACCESS-PASSPHRASE': passphrase,
                'Content-Type': 'application/json',
                'User-Agent': 'Bitget-Proxy/1.0'
            },
            data: body || undefined
        });

        console.log('📊 Bitget Response:', response.data);
        return res.json(response.data);

    } catch (error) {
        console.error('❌ Bitget Proxy Error:', error.message);
        if (error.response) {
            console.error('📊 Bitget Error Response:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            return res.status(500).json({ code: 500, msg: 'Error de conexión con Bitget', data: null });
        } else {
            return res.status(500).json({ code: 500, msg: error.message, data: null });
        }
    }
});

// Start server
app.listen(PORT, () => {
    const hostInfo = process.env.HOSTNAME || 'localhost';
    console.log(`🚀 Multi-Exchange Proxy Server iniciado en puerto ${PORT}`);
    console.log(`🌐 Health check disponible en: http://${hostInfo}:${PORT}/health`);
    console.log(`📡 Proxy BingX disponible en: http://${hostInfo}:${PORT}/bingx/*`);
    console.log(`📡 Proxy MEXC disponible en: http://${hostInfo}:${PORT}/mexc/*`);
    console.log(`📡 Proxy Bitget disponible en: http://${hostInfo}:${PORT}/bitget/*`);
    console.log(`📡 Test MEXC disponible en: http://${hostInfo}:${PORT}/api/mexc/test`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor proxy...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor proxy...');
    process.exit(0);
});