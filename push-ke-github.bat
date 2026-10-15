@echo off
title Push TataDana ke GitHub
echo ========================================================
echo   MENGIRIM KODE TATADANA KE GITHUB (rifkiapirin-dev)
echo ========================================================
echo.
echo Sedang menghubungi GitHub...
echo Jika muncul jendela browser / popup, silakan klik 'Sign in with your browser' / 'Authorize'.
echo.
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo   [SUKSES] KODE BERHASIL DI-PUSH KE GITHUB!
    echo   Sekarang silakan refresh halaman Vercel Anda (F5).
    echo ========================================================
) else (
    echo ========================================================
    echo   [PERHATIAN] Jika gagal login, coba ulangi kembali
    echo   atau gunakan Personal Access Token GitHub.
    echo ========================================================
)
echo.
pause
