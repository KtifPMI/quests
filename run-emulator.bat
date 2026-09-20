@echo off
REM Запуск Android-эмулятора Pixel_6 с окном
REM Запусти этот файл двойным кликом или из терминала:
REM   run-emulator.bat
REM SDK перенесён из кириллического пути в ASCII (фикс зависания эмулятора)
set ANDROID_HOME=C:\Users\Public\Android\Sdk
set ANDROID_USER_HOME=C:\Users\Public\.android
set ANDROID_AVD_HOME=C:\Users\Public\.android\avd
"%ANDROID_HOME%\emulator\emulator.exe" -avd Pixel_6 -no-snapshot-save