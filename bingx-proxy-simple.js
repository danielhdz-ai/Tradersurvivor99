const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = 8003;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-KEY', 'X-SECRET-KEY', 'X-ACCOUNT-ID']
}));

app.use(express.json());

// BingX signature function - EXACTO según documentación
function generateSignature(queryString, secretKey) {
    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
}

// BingX proxy - IMPLEMENTACIÓN CORRECTA
app.all('/bingx/*', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const secretKey = req.headers['x-secret-key'];
        
        if (!apiKey || !secretKey) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const path = req.path.replace('/bingx', '');
        const timestamp = Date.now();
        
        // Parámetros ordenados alfabéticamente (CRÍTICO para BingX)
        const allParams = {
            ...req.query,
            timestamp: timestamp,
            recvWindow: 60000
        };

        // Crear query string SIN encoding para firma
        const paramKeys = Object.keys(allParams).sort();
        const queryForSignature = paramKeys
            .map(key => `${key}=${allParams[key]}`)
            .join('&');

        // Generar firma
        const signature = generateSignature(queryForSignature, secretKey);

        // Query final CON encoding para URL
        const finalParams = new URLSearchParams();
        paramKeys.forEach(key => {
            finalParams.append(key, allParams[key]);
        });
        finalParams.append('signature', signature);

        const fullUrl = `https://open-api.bingx.com${path}?${finalParams.toString()}`;

        console.log(`📡 BingX ${req.method}: ${path}`);
        console.log(`🔐 Signature: ${signature.substring(0, 16)}...`);

        const response = await axios({
            method: req.method,
            url: fullUrl,
            headers: {
                'X-BX-APIKEY': apiKey,
                'Content-Type': 'application/json',
                'User-Agent': 'TradingJournal/1.0'
            },
            timeout: 15000
        });

        console.log(`✅ BingX Response Code: ${response.data.code || 'OK'}`);
        res.json(response.data);

    } catch (error) {
        console.error('❌ BingX Error:', error.message);
        
        if (error.response?.data) {
            console.error('📊 BingX Error Data:', error.response.data);
            res.status(error.response.status || 500).json(error.response.data);
        } else {
            res.status(500).json({
                code: 500,
                msg: 'Proxy connection error'
            });
        }
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`🚀 BingX Proxy running on port ${PORT}`);
});