# WYSIWYG Markdown Editor (Tauri)

Natywny, lekki edytor WYSIWYG Markdown zbudowany na Tauri (Rust + React), generujący pojedynczy plik wykonywalny dla Windows (.exe) i Linux (AppImage/deb).

## Stack technologiczny
- **Runtime:** Tauri 2.x (Rust backend + system WebView)
- **Frontend:** React 18 + Vite
- **Edytor:** TipTap 2 (ProseMirror) z rozszerzeniami
- **Styling:** TailwindCSS 3
- **Ikony:** Lucide React
- **Markdown:** turndown (HTML->MD) + markdown-it (MD->HTML)

## Toolbar (belka górna)
- Dropdown nagłówków: H1, H2, H3, H4, H5, H6, Paragraph
- Formatowanie: Bold, Italic, Strikethrough, Code, Blockquote
- Listy: punktowana, numerowana
- Link: wstawianie/edycja URL
- Tabela: wstawianie tabeli, dodawanie/usuwanie wierszy/kolumn
- Separator (linia pozioma)
- Undo / Redo
- **Skróty klawiszowe:** Ctrl+B/I/U/K/S/O/Z/Shift+Z (wyswietlane jako tooltip)

## Funkcje plików (Tauri backend)
- Nowy dokument
- Otwórz plik .md (natywny dialog systemu)
- Zapisz / Zapisz jako .md
- Eksport do HTML
- **Dirty flag:** wykrywanie niezapisanych zmian, ostrzezenie przy zamykaniu/nowym pliku

## Kroki realizacji

1. **Scaffold Tauri + React + Vite** - `npm create tauri-app`
2. **Instalacja zaleznosci** - TipTap, rozszerzenia, TailwindCSS, Lucide, turndown, markdown-it
3. **Konfiguracja TailwindCSS** - tailwind.config.js, globals.css
4. **Komponent `Toolbar`** - przyciski formatowania, dropdown nagłówków, dialog linku, przyciski tabeli, **skróty klawiszowe z tooltipami**
5. **Komponent `Editor`** - TipTap z WYSIWYG, typografia dokumentowa (prose)
6. **Komponent `App`** - layout: toolbar + editor, zarzadzanie stanem dokumentu, **dirty flag + ostrzezenie o niezapisanych zmianach**
7. **Integracja Tauri** - komendy Rust: open_file, save_file, dialogi systemowe
8. **Styling** - czysty, dokumentowy wyglad, responsywnosc
9. **Test dev** - uruchomienie `cargo tauri dev`
10. **Konfiguracja bundlera i build** - tauri.conf.json: NSIS (Windows) + AppImage (Linux), `cargo tauri build`

## Struktura plików
```
markdown_editor/
├── src-tauri/          # Rust backend
│   ├── src/main.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                # React frontend
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   ├── components/
│   │   ├── Editor.jsx
│   │   └── Toolbar.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Wynik
- Jeden plik `.exe` (Windows) / `AppImage` (Linux)
- Rozmiar ~5-10 MB
- Natywne dialogi otwierania/zapisu plików
- WYSIWYG editing z pelnym toolbar
- Skróty klawiszowe dla kluczowych operacji
- Ochrona przed utrata danych (dirty flag)

## Budowanie dystrybucji
```bash
# Dev
cargo tauri dev

# Build produkcyjny
cargo tauri build
# Windows -> src-tauri/target/release/bundle/nsis/*.exe
# Linux   -> src-tauri/target/release/bundle/appimage/*.AppImage
```
