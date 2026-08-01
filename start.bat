@echo off
chcp 65001 >nul
title Muse - 提示词优化助手
cd /d "%~dp0"

if not exist node_modules (
    echo.
    echo   [Muse] 首次运行，正在安装依赖（需要联网）...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo   [Muse] 依赖安装失败，请检查网络后重试。
        echo.
        pause
        exit /b 1
    )
)

echo.
echo   [Muse] 正在启动开发服务器...
echo   [Muse] 浏览器将自动打开 http://localhost:1420
echo   [Muse] 关闭本窗口即停止服务。按 Ctrl+C 也可退出。
echo.

rem 等待 vite 启动完成后自动打开浏览器（约 4 秒）
powershell -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:1420'"

call npm run dev
pause
