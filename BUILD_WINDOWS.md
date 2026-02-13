# Budowanie Markdown Editor na Windows

## Wymagania wstepne

### a) Microsoft Visual Studio Build Tools
- Pobierz: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Zainstaluj workload **"Desktop development with C++"**

### b) Rust
- Pobierz: https://rustup.rs/
- Uruchom instalator, wybierz domyslne opcje
- Po instalacji sprawdz: `rustc --version`

### c) Node.js (v18+)
- Pobierz: https://nodejs.org/ (wersja LTS)
- Sprawdz: `node --version` i `npm --version`

### d) WebView2
- Windows 10/11 ma go zazwyczaj preinstalowanego
- Jesli nie: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## Kroki budowania

### 1. Skopiuj projekt

Skopiuj caly folder `markdown_editor` na maszyne Windows (USB, siec, GitHub, itp.).

### 2. Zainstaluj zaleznosci

Otworz terminal (PowerShell/cmd) w folderze projektu:

```powershell
npm install
```

### 3. Zainstaluj Tauri CLI

```powershell
npm install -g @tauri-apps/cli
```

### 4. Zbuduj

```powershell
cargo tauri build --bundles msi,nsis
```

### 5. Wynik

Pliki instalacyjne znajdziesz w:

- **MSI (Windows Installer):**
  `src-tauri/target/release/bundle/msi/Markdown Editor_1.0.0_x64_en-US.msi`

- **EXE (NSIS setup wizard):**
  `src-tauri/target/release/bundle/nsis/Markdown Editor_1.0.0_x64-setup.exe`

## Uwagi

- Pierwszy build potrwa dluzej (~5-10 min) z powodu kompilacji Rusta i zaleznosci
- Plik `.msi` automatycznie rejestruje asocjacje plikow `.md`
- Instalator NSIS bundluje WebView2 (offline install)
- Do budowania wersji debug (szybszy build, bez optymalizacji): `cargo tauri dev`
