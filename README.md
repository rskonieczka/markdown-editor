# Markdown Editor

Natywny, lekki edytor WYSIWYG Markdown zbudowany na Tauri 2 (Rust + React).

## Funkcje

- **WYSIWYG** - edycja jak w dokumencie, bez potrzeby znajomosci skladni Markdown
- **Toolbar** - naglowki H1-H6, Bold, Italic, Strike, Code, listy, cytat, link, tabela, linia pozioma, undo/redo
- **Zarzadzanie plikami** - Nowy, Otworz, Zapisz, Zapisz jako (.md), Eksport HTML
- **Skroty klawiszowe** - Ctrl+N/O/S/Shift+S/B/I/K/Z
- **Dirty flag** - ostrzezenie przy niezapisanych zmianach
- **Cross-platform** - Windows (.exe) i Linux (AppImage)
- **Lekki** - ~5-10 MB dzieki Tauri (natywny WebView)

## Wymagania

- Node.js 18+
- Rust 1.70+
- Linux: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`
- Windows: WebView2 (domyslnie w Win10/11)

## Uruchomienie (dev)

```bash
# Tylko frontend (przegladarka)
npm install
npm run dev

# Natywna aplikacja Tauri
npm install
cargo tauri dev
```

## Budowanie

```bash
cargo tauri build

# Artefakty:
# Windows -> src-tauri/target/release/bundle/nsis/*.exe
# Linux   -> src-tauri/target/release/bundle/appimage/*.AppImage
```

## Stack

- Tauri 2.x (Rust backend + natywny WebView)
- React 18 + Vite
- TipTap 2 (ProseMirror)
- TailwindCSS 3
- Lucide React (ikony)
- turndown + markdown-it (konwersja MD <-> HTML)
