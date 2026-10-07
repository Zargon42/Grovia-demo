@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Installa Node.js LTS da https://nodejs.org e riapri questo file.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Prima configurazione: installazione delle dipendenze. Serve internet.
  call npm ci
  if errorlevel 1 (
    echo Installazione non riuscita. Controlla la connessione e riprova.
    pause
    exit /b 1
  )
)
echo Grovia si apre nel browser. Lascia questa finestra aperta durante la demo.
echo Premi Ctrl+C per fermare il server.
call npm run dev -- --open
pause
