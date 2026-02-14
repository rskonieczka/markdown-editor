# Markdown Editor

Natywny, lekki edytor WYSIWYG Markdown zbudowany na Tauri 2 (Rust + React).

![Markdown Editor](markdowneditor-view.png)

## Pobieranie

| System | Plik | Link |
|--------|------|------|
| Windows (installer) | `.exe` | [Pobierz](https://github.com/rskonieczka/markdown-editor/releases/latest/download/Markdown.Editor_1.0.0_x64-setup.exe) |
| Windows (MSI) | `.msi` | [Pobierz](https://github.com/rskonieczka/markdown-editor/releases/latest/download/Markdown.Editor_1.0.0_x64_en-US.msi) |
| Linux (Debian/Ubuntu) | `.deb` | [Pobierz](https://github.com/rskonieczka/markdown-editor/releases/latest/download/Markdown.Editor_1.0.0_amd64.deb) |
| Linux (uniwersalny) | `.AppImage` | [Pobierz](https://github.com/rskonieczka/markdown-editor/releases/latest/download/Markdown.Editor_1.0.0_amd64.AppImage) |

## Funkcje

- **WYSIWYG** - edycja jak w dokumencie, bez potrzeby znajomosci skladni Markdown
- **Toolbar** - naglowki H1-H6, Bold, Italic, Strike, Code, listy, cytat, checklist, link, tabela, linia pozioma, undo/redo
- **Checklist** - interaktywna lista zadan `- [ ]` / `- [x]` z pelna konwersja MD
- **Zarzadzanie plikami** - Nowy, Otworz, Zapisz, Zapisz jako (.md), Eksport HTML
- **File watcher** - automatyczne odswiezanie przy zmianach z zewnatrz (natywny inotify/ReadDirectoryChanges)
- **Drag & Drop** - przeciagnij plik .md/.markdown/.txt do edytora
- **CLI** - otwarcie pliku z linii polecen: `markdown-editor plik.md`
- **Zoom** - skalowanie widoku 50-200% (zapamietywane w localStorage)
- **Skroty klawiszowe** - Ctrl+N/O/S/Shift+S/B/I/K/Z
- **Dirty flag** - ostrzezenie przy niezapisanych zmianach, tytul okna z nazwa pliku
- **Cross-platform** - Windows (.exe, .msi) i Linux (.deb, .AppImage)
- **CI/CD** - GitHub Actions automatycznie buduje release
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
