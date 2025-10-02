@echo off
echo ========================================
echo    Installation Budget Manager
echo ========================================
echo.

echo Verification de Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe !
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js detecte !
echo.

echo Installation des dependances...
npm install

if %errorlevel% neq 0 (
    echo ERREUR: Echec de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installation terminee !
echo ========================================
echo.
echo Pour demarrer l'application :
echo   npm start
echo.
echo L'application sera accessible sur :
echo   http://localhost:3000
echo.
pause
