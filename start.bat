@echo off
title AI活地图 - 服务器+穿透
echo ========================================
echo   AI活地图 - 一键启动
echo ========================================
echo.

cd /d "c:\Users\yzm\CodeBuddy\20261022144158"

echo [1/2] 启动网站服务器 (端口3000)...
start /min "AI-Maps-Server" cmd /c "set PATH=C:\Users\yzm\.workbuddy\binaries\node\versions\20.18.0.installing.27888.__extract_temp__\node-v20.18.0-win-x64;%PATH% && node server.js"

echo [2/2] 启动内网穿透 (固定域名)...
timeout /t 3 /nobreak >nul
start /min "AI-Maps-Tunnel" cmd /c "set PATH=C:\Users\yzm\.workbuddy\binaries\node\versions\20.18.0.installing.27888.__extract_temp__\node-v20.18.0-win-x64;%PATH% && node tunnel.js"

echo.
echo ========================================
echo   全部启动完成!
echo.
echo   手机访问链接: https://ai-living-maps.loca.lt
echo   本机访问: http://localhost:3000
echo.
echo   两个窗口在后台运行，关闭它们即停止服务
echo ========================================
echo.
pause
