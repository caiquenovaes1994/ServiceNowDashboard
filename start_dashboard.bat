@echo off
title ServiceNow Dashboard - Active (System)
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

:loop
echo [%date% %time%] O Servidor e Dashboard (Modularizado) estao iniciando...
echo Acesse em http://localhost:3002
echo.
call npm run dev
echo.
echo [%date% %time%] A aplicacao parou inesperadamente.
echo [%date% %time%] Reiniciando em 5 segundos...
timeout /t 5 /nobreak
goto loop
