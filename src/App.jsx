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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-gray-400 animate-pulse">Ladowanie...</div>
      </div>
    );
  }

  return <AppContent initialCliData={cliData} />;
}

function AppContent({ initialCliData }) {
  const initialHtml = useMemo(
    () => (initialCliData ? markdownToHtml(initialCliData.content) : ""),
    [initialCliData],
  );

  const currentFileName = initialCliData ? initialCliData.name : "";
  const currentFilePath = initialCliData ? initialCliData.path : "";
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem("md-editor-zoom");
    return saved ? Number(saved) : 100;
  });
  const [fontFamily, setFontFamily] = useState(() => {
    const saved = localStorage.getItem("md-editor-font");
    return saved || "system-ui";
  });
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toolbar
        zoom={zoom}
        onZoomChange={(v) => { setZoom(v); localStorage.setItem("md-editor-zoom", v); }}
        fontFamily={fontFamily}
        onFontChange={(font) => { setFontFamily(font); localStorage.setItem("md-editor-font", font); }}
      />
      <Editor editor={editor} zoom={zoom} fontFamily={fontFamily} />
    </div>
  );
}
