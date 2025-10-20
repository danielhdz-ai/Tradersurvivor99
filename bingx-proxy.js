const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = 8003;

// Middleware
app.use(cors());
app.use(express.json());

// Función para crear la firma HMAC
function createSignature(queryString, secretKey) {
    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'BingX Proxy Server is running' });
});

// Proxy para todas las rutas de BingX API
app.all('/api/bingx/*', async (req, res) => {
    try {
        const apiPath = req.path.replace('/api/bingx', '');
        const baseURL = 'https://open-api.bingx.com';
        const fullURL = baseURL + apiPath;

        // Obtener headers de autenticación si existen
        const apiKey = req.headers['x-bingx-apikey'];
        const timestamp = req.headers['x-bingx-timestamp'];
        const signature = req.headers['x-bingx-signature'];

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        if (apiKey) headers['X-BX-APIKEY'] = apiKey;
        if (timestamp) headers['X-BX-TIMESTAMP'] = timestamp;
        if (signature) headers['X-BX-SIGNATURE'] = signature;

        const config = {
            method: req.method,
            url: fullURL,
            headers,
            params: req.query,
            timeout: 10000
        };

        if (req.method !== 'GET' && req.body) {
            config.data = req.body;
        }

        console.log(`[${req.method}] ${fullURL}`);
        console.log('Headers:', headers);
        console.log('Params:', req.query);

        const response = await axios(config);
        
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        
        if (error.response) {
            console.error('Error response:', error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ 
                error: 'Proxy server error', 
                message: error.message,
                code: error.code 
            });
        }
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 BingX Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Health check available at http://localhost:${PORT}/health`);
    console.log(`🔗 Proxying BingX API calls from /api/bingx/* to https://open-api.bingx.com/*`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});