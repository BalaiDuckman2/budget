@echo off
echo ========================================
echo    Demarrage Budget Manager
echo ========================================
echo.

echo Verification des dependances...
if not exist "node_modules" (
    echo Les dependances ne sont pas installees !
    echo Execution de l'installation...
    call install.bat
    if %errorlevel% neq 0 exit /b 1
)

echo.
echo Demarrage du serveur...
echo.
echo L'application sera accessible sur : http://localhost:3000
echo Vos donnees seront stockees dans : data/budget-data.json
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

npm start
