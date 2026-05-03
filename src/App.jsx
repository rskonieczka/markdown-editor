import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Toolbar from "./components/Toolbar";
import Editor, { useMarkdownEditor } from "./components/Editor";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(markdownItTaskLists, { enabled: true });

const ZOOM_STORAGE_KEY = "md-editor-zoom";
const FONT_STORAGE_KEY = "md-editor-font";
const THEME_STORAGE_KEY = "md-editor-theme";

function getStoredTheme() {
  if (typeof window === "undefined") {
    return "system";
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

function getResolvedTheme(theme) {
  if (theme !== "system") {
    return theme;
  }

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = getResolvedTheme(theme);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

function markdownToHtml(markdown) {
  let html = md.render(markdown || "");

  html = html
    .replace(/<ul class="contains-task-list">/g, '<ul data-type="taskList">')
    .replace(
      /<li class="task-list-item[^"]*">\s*(<p>)?\s*<input[^>]*checked[^>]*>\s*/g,
      (_, p) => `<li data-type="taskItem" data-checked="true">${p || ""}`,
    )
    .replace(
      /<li class="task-list-item[^"]*">\s*(<p>)?\s*<input[^>]*type="checkbox"[^>]*>\s*/g,
      (_, p) => `<li data-type="taskItem" data-checked="false">${p || ""}`,
    );

  return html;
}

let isTauriAvailable = false;
let tauriFs = null;

const tauriReady = (async function initTauri() {
  if (!window.__TAURI_INTERNALS__) {
    isTauriAvailable = false;
    return;
  }
  try {
    const { readTextFile, watchImmediate } = await import(
      "@tauri-apps/plugin-fs"
    );
    tauriFs = { readTextFile, watchImmediate };
    isTauriAvailable = true;
  } catch {
    isTauriAvailable = false;
  }
})();

export default function App() {
  const [cliChecked, setCliChecked] = useState(false);
  const [cliData, setCliData] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);

  React.useLayoutEffect(() => {
    const updateTheme = () => {
      applyTheme(theme);
    };

    updateTheme();

    if (theme !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }

    mediaQuery.addListener(updateTheme);
    return () => mediaQuery.removeListener(updateTheme);
  }, [theme]);

  useEffect(() => {
    (async () => {
      await tauriReady;
      if (isTauriAvailable) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const data = await invoke("get_cli_file");
          if (data) setCliData(data);
        } catch {}
      }
      setCliChecked(true);
    })();
  }, []);

  if (!cliChecked) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--color-canvas-inset)]">
        <div className="text-[var(--color-fg-muted)] animate-pulse">Ladowanie...</div>
      </div>
    );
  }

  return (
    <AppContent
      initialCliData={cliData}
      theme={theme}
      onThemeChange={(nextTheme) => {
        setTheme(nextTheme);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      }}
    />
  );
}

function AppContent({ initialCliData, theme, onThemeChange }) {
  const initialHtml = useMemo(
    () => (initialCliData ? markdownToHtml(initialCliData.content) : ""),
    [initialCliData],
  );

  const currentFileName = initialCliData ? initialCliData.name : "";
  const currentFilePath = initialCliData ? initialCliData.path : "";
  const contextMenuRef = useRef(null);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem(ZOOM_STORAGE_KEY);
    return saved ? Number(saved) : 100;
  });
  const [fontFamily, setFontFamily] = useState(() => {
    const saved = localStorage.getItem(FONT_STORAGE_KEY);
    return saved || "system-ui";
  });
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const currentContentRef = useRef(initialCliData ? initialCliData.content : "");

  const editor = useMarkdownEditor({
    initialContent: initialHtml,
  });

  const setEditorContent = useCallback(
    (markdownContent) => {
      if (!editor) return;
      const html = markdownToHtml(markdownContent);
      editor.commands.setContent(html);
      currentContentRef.current = markdownContent;
    },
    [editor],
  );

  // --- Update window title ---

  useEffect(() => {
    const name = currentFileName || "Nowy dokument";
    const title = `${name} - Markdown Editor`;
    document.title = title;
    if (window.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        getCurrentWindow().setTitle(title);
      }).catch(() => {});
    }
  }, [currentFileName]);

  // --- File watcher (auto-reload on external changes) ---

  useEffect(() => {
    if (!isTauriAvailable || !tauriFs?.watchImmediate || !currentFilePath) return;

    let unwatchFn = null;
    let cancelled = false;

    (async () => {
      try {
        unwatchFn = await tauriFs.watchImmediate(
          currentFilePath,
          async (event) => {
            if (cancelled) return;
            const evType = event.type;
            const isModify = (typeof evType === "object" && "modify" in evType)
              || evType === "modify"
              || (typeof evType === "object" && "access" in evType)
              || (Array.isArray(event.paths) && event.paths.length > 0);
            if (!isModify) return;
            try {
              const content = await tauriFs.readTextFile(currentFilePath);
              if (cancelled || content === currentContentRef.current) return;
              setEditorContent(content);
            } catch (err) {
              console.warn("File reload failed:", err);
            }
          },
        );
      } catch (err) {
        console.warn("File watch failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (unwatchFn) unwatchFn();
    };
  }, [currentFilePath, setEditorContent]);

  useEffect(() => {
    if (!contextMenuPosition) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (contextMenuRef.current?.contains(event.target)) {
        return;
      }

      setContextMenuPosition(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setContextMenuPosition(null);
      }
    };

    const handleViewportChange = () => {
      setContextMenuPosition(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [contextMenuPosition]);

  React.useLayoutEffect(() => {
    if (!contextMenuPosition || !contextMenuRef.current) {
      return;
    }

    const viewportPadding = 8;
    const rect = contextMenuRef.current.getBoundingClientRect();
    const nextX = Math.max(viewportPadding, Math.min(contextMenuPosition.x, window.innerWidth - rect.width - viewportPadding));
    const nextY = Math.max(viewportPadding, Math.min(contextMenuPosition.y, window.innerHeight - rect.height - viewportPadding));

    if (nextX !== contextMenuPosition.x || nextY !== contextMenuPosition.y) {
      setContextMenuPosition({ x: nextX, y: nextY });
    }
  }, [contextMenuPosition]);

  const handleContextMenu = useCallback((event) => {
    event.preventDefault();

    const viewportPadding = 8;
    setContextMenuPosition({
      x: Math.max(viewportPadding, event.clientX),
      y: Math.max(viewportPadding, event.clientY),
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[var(--color-canvas-inset)] text-[var(--color-fg-default)]">
      {contextMenuPosition ? (
        <Toolbar
          zoom={zoom}
          onZoomChange={(v) => { setZoom(v); localStorage.setItem(ZOOM_STORAGE_KEY, v); }}
          fontFamily={fontFamily}
          onFontChange={(font) => { setFontFamily(font); localStorage.setItem(FONT_STORAGE_KEY, font); }}
          theme={theme}
          onThemeChange={onThemeChange}
          position={contextMenuPosition}
          containerRef={contextMenuRef}
        />
      ) : null}
      <Editor
        editor={editor}
        zoom={zoom}
        fontFamily={fontFamily}
        onContextMenu={handleContextMenu}
      />
    </div>
  );
}
