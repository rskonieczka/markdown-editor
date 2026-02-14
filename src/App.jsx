import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Toolbar from "./components/Toolbar";
import Editor, { useMarkdownEditor } from "./components/Editor";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(markdownItTaskLists, { enabled: true });

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});
turndownService.use(gfm);

turndownService.addRule("taskListItem", {
  filter: (node) =>
    node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem",
  replacement: (content, node) => {
    const checked = node.getAttribute("data-checked") === "true";
    const checkbox = checked ? "[x]" : "[ ]";
    const text = content.replace(/^\s*/, "").replace(/\n/g, "\n    ");
    return `- ${checkbox} ${text}\n`;
  },
});

turndownService.addRule("taskList", {
  filter: (node) =>
    node.nodeName === "UL" && node.getAttribute("data-type") === "taskList",
  replacement: (content) => `\n${content}\n`,
});

function htmlToMarkdown(html) {
  return turndownService.turndown(html || "");
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
let tauriDialog = null;
let tauriFs = null;

const tauriReady = (async function initTauri() {
  if (!window.__TAURI_INTERNALS__) {
    isTauriAvailable = false;
    return;
  }
  try {
    const { open, save } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile, writeTextFile, watchImmediate } = await import(
      "@tauri-apps/plugin-fs"
    );
    tauriDialog = { open, save };
    tauriFs = { readTextFile, writeTextFile, watchImmediate };
    isTauriAvailable = true;
  } catch {
    isTauriAvailable = false;
  }
})();

const supportsFileAccess = typeof window.showOpenFilePicker === "function";

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function openFileWithHandle() {
  if (supportsFileAccess) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Markdown",
            accept: { "text/markdown": [".md", ".markdown", ".txt"] },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      const content = await file.text();
      return { name: file.name, content, handle };
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        resolve({ name: file.name, content: ev.target.result, handle: null });
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

async function saveToHandle(handle, content) {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function saveAsWithHandle(defaultName) {
  if (supportsFileAccess) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: defaultName || "document.md",
        types: [
          {
            description: "Markdown",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });
      return handle;
    } catch {
      return null;
    }
  }
  return null;
}

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

  const [isDirty, setIsDirty] = useState(false);
  const [currentFileName, setCurrentFileName] = useState(
    initialCliData ? initialCliData.name : "",
  );
  const [currentFilePath, setCurrentFilePath] = useState(
    initialCliData ? initialCliData.path : "",
  );
  const [statusMessage, setStatusMessage] = useState(null);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem("md-editor-zoom");
    return saved ? Number(saved) : 100;
  });
  const savedContentRef = useRef(initialCliData ? initialCliData.content : "");
  const fileHandleRef = useRef(null);
  const dirtyTimerRef = useRef(null);

  const showStatus = useCallback((text, type = "info", duration = 3000) => {
    setStatusMessage({ text, type });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  }, []);

  const onEditorUpdate = useCallback(
    (html) => {
      if (dirtyTimerRef.current) clearTimeout(dirtyTimerRef.current);
      dirtyTimerRef.current = setTimeout(() => {
        const currentMd = htmlToMarkdown(html);
        setIsDirty(currentMd !== savedContentRef.current);
      }, 300);
    },
    [],
  );

  const editor = useMarkdownEditor({
    onUpdate: onEditorUpdate,
    initialContent: initialHtml,
  });

  const confirmDiscard = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm(
      "Masz niezapisane zmiany. Czy na pewno chcesz kontynuowac?",
    );
  }, [isDirty]);

  const setEditorContent = useCallback(
    (markdownContent) => {
      if (!editor) return;
      const html = markdownToHtml(markdownContent);
      editor.commands.setContent(html);
      savedContentRef.current = markdownContent;
      setIsDirty(false);
    },
    [editor],
  );

  const getMarkdownContent = useCallback(() => {
    if (!editor) return "";
    return htmlToMarkdown(editor.getHTML());
  }, [editor]);

  // --- File operations ---

  const handleNewFile = useCallback(() => {
    if (!confirmDiscard()) return;
    if (editor) {
      editor.commands.clearContent();
      savedContentRef.current = "";
      setIsDirty(false);
      setCurrentFileName("");
      setCurrentFilePath("");
      fileHandleRef.current = null;
    }
  }, [editor, confirmDiscard]);

  const handleOpenFile = useCallback(async () => {
    if (!confirmDiscard()) return;

    await tauriReady;

    if (isTauriAvailable) {
      try {
        const selected = await tauriDialog.open({
          multiple: false,
          filters: [
            { name: "Markdown", extensions: ["md", "markdown", "txt"] },
          ],
        });
        if (selected) {
          showStatus("Otwieranie...", "info", 0);
          const content = await tauriFs.readTextFile(selected);
          const name = selected.split(/[\\/]/).pop();
          setCurrentFilePath(selected);
          setCurrentFileName(name);
          fileHandleRef.current = null;
          setEditorContent(content);
          showStatus("Otwarto: " + name, "success");
        }
      } catch (err) {
        console.error("Open file error:", err);
        showStatus("Blad otwierania pliku", "error");
      }
    } else {
      const result = await openFileWithHandle();
      if (result) {
        setCurrentFileName(result.name);
        setCurrentFilePath("");
        fileHandleRef.current = result.handle;
        setEditorContent(result.content);
        showStatus("Otwarto: " + result.name, "success");
      }
    }
  }, [confirmDiscard, setEditorContent, showStatus]);

  const handleSaveFile = useCallback(async () => {
    const content = getMarkdownContent();
    const prevDirty = isDirty;

    setIsDirty(false);
    showStatus("Zapisywanie...", "info", 0);

    await tauriReady;

    if (isTauriAvailable && currentFilePath) {
      try {
        await tauriFs.writeTextFile(currentFilePath, content);
        savedContentRef.current = content;
        showStatus("Zapisano", "success");
      } catch (err) {
        console.error("Save file error:", err);
        setIsDirty(prevDirty);
        showStatus("Blad zapisu", "error");
      }
      return;
    }

    if (isTauriAvailable) {
      try {
        const filePath = await tauriDialog.save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
          defaultPath: currentFileName || "document.md",
        });
        if (filePath) {
          await tauriFs.writeTextFile(filePath, content);
          const name = filePath.split(/[\\/]/).pop();
          setCurrentFilePath(filePath);
          setCurrentFileName(name);
          savedContentRef.current = content;
          showStatus("Zapisano: " + name, "success");
        } else {
          setIsDirty(prevDirty);
          setStatusMessage(null);
        }
      } catch (err) {
        console.error("Save file error:", err);
        setIsDirty(prevDirty);
        showStatus("Blad zapisu", "error");
      }
      return;
    }

    if (fileHandleRef.current) {
      try {
        await saveToHandle(fileHandleRef.current, content);
        savedContentRef.current = content;
        showStatus("Zapisano", "success");
      } catch (err) {
        console.error("Save file error:", err);
        setIsDirty(prevDirty);
        showStatus("Blad zapisu", "error");
      }
      return;
    }

    const handle = await saveAsWithHandle(currentFileName || "document.md");
    if (handle) {
      try {
        await saveToHandle(handle, content);
        const file = await handle.getFile();
        fileHandleRef.current = handle;
        setCurrentFileName(file.name);
        savedContentRef.current = content;
        showStatus("Zapisano: " + file.name, "success");
      } catch (err) {
        console.error("Save file error:", err);
        setIsDirty(prevDirty);
        showStatus("Blad zapisu", "error");
      }
      return;
    }

    downloadFile(content, currentFileName || "document.md", "text/markdown");
    savedContentRef.current = content;
    showStatus("Pobrano plik", "success");
  }, [getMarkdownContent, currentFilePath, currentFileName, isDirty, showStatus]);

  const handleSaveAsFile = useCallback(async () => {
    const content = getMarkdownContent();

    await tauriReady;

    if (isTauriAvailable) {
      try {
        const filePath = await tauriDialog.save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
          defaultPath: currentFileName || "document.md",
        });
        if (filePath) {
          showStatus("Zapisywanie...", "info", 0);
          await tauriFs.writeTextFile(filePath, content);
          const name = filePath.split(/[\\/]/).pop();
          setCurrentFilePath(filePath);
          setCurrentFileName(name);
          savedContentRef.current = content;
          setIsDirty(false);
          showStatus("Zapisano: " + name, "success");
        }
      } catch (err) {
        console.error("Save As error:", err);
        showStatus("Blad zapisu", "error");
      }
      return;
    }

    const handle = await saveAsWithHandle(currentFileName || "document.md");
    if (handle) {
      try {
        showStatus("Zapisywanie...", "info", 0);
        await saveToHandle(handle, content);
        const file = await handle.getFile();
        fileHandleRef.current = handle;
        setCurrentFileName(file.name);
        savedContentRef.current = content;
        setIsDirty(false);
        showStatus("Zapisano: " + file.name, "success");
      } catch (err) {
        console.error("Save As error:", err);
        showStatus("Blad zapisu", "error");
      }
      return;
    }

    downloadFile(content, currentFileName || "document.md", "text/markdown");
    savedContentRef.current = content;
    setIsDirty(false);
    showStatus("Pobrano plik", "success");
  }, [getMarkdownContent, currentFileName, showStatus]);

  const handleExportHtml = useCallback(async () => {
    if (!editor) return;
    const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentFileName || "Document"}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
    table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #d1d5db; padding: 0.5rem; }
    th { background: #f9fafb; } code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #4b5563; font-style: italic; }
    a { color: #2563eb; }
  </style>
</head>
<body>
${editor.getHTML()}
</body>
</html>`;
    const name = (currentFileName || "document").replace(/\.md$/, "") + ".html";

    await tauriReady;
    if (isTauriAvailable) {
      try {
        const filePath = await tauriDialog.save({
          filters: [{ name: "HTML", extensions: ["html"] }],
          defaultPath: name,
        });
        if (filePath) {
          await tauriFs.writeTextFile(filePath, html);
          showStatus("Eksportowano HTML", "success");
        }
      } catch (err) {
        console.error("Export HTML error:", err);
        showStatus("Blad eksportu HTML", "error");
      }
    } else {
      downloadFile(html, name, "text/html");
    }
  }, [editor, currentFileName, showStatus]);

  // --- Keyboard shortcuts ---

  useEffect(() => {
    function handleKeyDown(e) {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (ctrl && key === "n") {
        e.preventDefault();
        handleNewFile();
      } else if (ctrl && key === "o") {
        e.preventDefault();
        handleOpenFile();
      } else if (ctrl && e.shiftKey && key === "s") {
        e.preventDefault();
        handleSaveAsFile();
      } else if (ctrl && !e.shiftKey && key === "s") {
        e.preventDefault();
        handleSaveFile();
      } else if (ctrl && key === "k") {
        e.preventDefault();
        if (editor) {
          const previousUrl = editor.getAttributes("link").href;
          const url = window.prompt("URL:", previousUrl || "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
          }
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url })
            .run();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, handleNewFile, handleOpenFile, handleSaveFile, handleSaveAsFile]);

  // --- Update window title ---

  useEffect(() => {
    const name = currentFileName || "Nowy dokument";
    const dirty = isDirty ? " *" : "";
    const title = `${name}${dirty} - Markdown Editor`;
    document.title = title;
    if (window.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        getCurrentWindow().setTitle(title);
      }).catch(() => {});
    }
  }, [currentFileName, isDirty]);

  // --- File watcher (auto-reload on external changes) ---

  const isReloadingRef = useRef(false);

  useEffect(() => {
    if (!isTauriAvailable || !tauriFs?.watchImmediate || !currentFilePath) return;

    let unwatchFn = null;
    let cancelled = false;

    (async () => {
      try {
        console.log("[FileWatch] Starting watch on:", currentFilePath);
        unwatchFn = await tauriFs.watchImmediate(
          currentFilePath,
          async (event) => {
            console.log("[FileWatch] Event:", JSON.stringify(event));
            if (cancelled || isReloadingRef.current) return;
            const evType = event.type;
            const isModify = (typeof evType === "object" && "modify" in evType)
              || evType === "modify"
              || (typeof evType === "object" && "access" in evType)
              || (Array.isArray(event.paths) && event.paths.length > 0);
            if (!isModify) return;
            console.log("[FileWatch] Detected change, reloading...");
            try {
              isReloadingRef.current = true;
              const content = await tauriFs.readTextFile(currentFilePath);
              if (cancelled) return;
              if (content === savedContentRef.current) return;
              savedContentRef.current = content;
              const html = markdownToHtml(content);
              const ed = editor;
              if (ed && !ed.isDestroyed) {
                const { from, to } = ed.state.selection;
                ed.commands.setContent(html);
                try { ed.commands.setTextSelection({ from, to }); } catch {}
              }
              setIsDirty(false);
            } finally {
              isReloadingRef.current = false;
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
  }, [currentFilePath, editor]);

  // --- Warn on close with unsaved changes ---

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Toolbar
        editor={editor}
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onSaveAsFile={handleSaveAsFile}
        onExportHtml={handleExportHtml}
        isDirty={isDirty}
        currentFileName={currentFileName}
        zoom={zoom}
        onZoomChange={(v) => { setZoom(v); localStorage.setItem("md-editor-zoom", v); }}
      />
      <Editor editor={editor} zoom={zoom} />
      {statusMessage && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-opacity z-50 ${
            statusMessage.type === "success"
              ? "bg-green-600 text-white"
              : statusMessage.type === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-700 text-white"
          }`}
        >
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}
