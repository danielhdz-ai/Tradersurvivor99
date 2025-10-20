@echo off
echo Iniciando BingX Proxy Server en segundo plano...
start "BingX Proxy Server" cmd /k "node proxy-server.js"
echo.
echo Servidor proxy iniciado en una ventana separada.
echo Puerto: 8003
echo Health check: http://127.0.0.1:8003/health
echo.
pause
