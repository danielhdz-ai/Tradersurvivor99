@echo off
REM Script para arrancar el proxy-server.js en Windows (cmd.exe)
cd /d "%~dp0"
echo Iniciando proxy-server.js...
node proxy-server.js
pause
