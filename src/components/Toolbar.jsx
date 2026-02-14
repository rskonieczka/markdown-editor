import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  FileDown,
  TableProperties,
  Plus,
  Trash2,
  CheckSquare,
} from "lucide-react";

function ToolbarButton({ onClick, isActive, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors duration-100
        ${isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="self-center mx-1 w-px h-6 bg-gray-300" />;
}

function HeadingDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const levels = [
    { level: 1, label: "Heading 1", icon: Heading1 },
    { level: 2, label: "Heading 2", icon: Heading2 },
    { level: 3, label: "Heading 3", icon: Heading3 },
    { level: 4, label: "Heading 4", icon: Heading4 },
    { level: 5, label: "Heading 5", icon: Heading5 },
    { level: 6, label: "Heading 6", icon: Heading6 },
  ];

  const currentLevel = levels.find((l) =>
    editor.isActive("heading", { level: l.level })
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex gap-1 items-center px-2 py-1 text-sm text-gray-600 rounded transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <span className="min-w-[80px] text-left">
          {currentLevel ? currentLevel.label : "Paragraph"}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setParagraph().run();
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
              !currentLevel ? "bg-blue-50 text-blue-700" : "text-gray-700"
            }`}
          >
            Paragraph
          </button>
          {levels.map(({ level, label, icon: Icon }) => (
            <button
              key={level}
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level }).run();
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                editor.isActive("heading", { level })
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TableDropdown({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isInTable = editor.isActive("table");

  return (
    <div className="relative" ref={ref}>
      <ToolbarButton
        onClick={() => {
          if (!isInTable) {
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
          } else {
            setOpen(!open);
          }
        }}
        isActive={isInTable}
        title="Tabela"
      >
        <TableIcon size={18} />
      </ToolbarButton>
      {open && isInTable && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={14} /> Dodaj kolumne
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={14} /> Dodaj wiersz
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteColumn().run();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Usun kolumne
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteRow().run();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Usun wiersz
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteTable().run();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={14} /> Usun tabele
          </button>
        </div>
      )}
    </div>
  );
}

export default function Toolbar({
  editor,
  onNewFile,
  onOpenFile,
  onSaveFile,
  onSaveAsFile,
  onExportHtml,
  isDirty,
  currentFileName,
  zoom,
  onZoomChange,
}) {
  if (!editor) return null;

  const setLink = useCallback(() => {
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
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-white select-none">
      <ToolbarButton onClick={onNewFile} title="Nowy (Ctrl+N)">
        <FilePlus size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={onOpenFile} title="Otworz (Ctrl+O)">
        <FolderOpen size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={onSaveFile} title="Zapisz (Ctrl+S)">
        <Save size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={onSaveAsFile} title="Zapisz jako (Ctrl+Shift+S)">
        <SaveAll size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={onExportHtml} title="Eksportuj HTML">
        <FileDown size={18} />
      </ToolbarButton>
      <ToolbarSeparator />

      <HeadingDropdown editor={editor} />

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Pogrubienie (Ctrl+B)"
      >
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Kursywa (Ctrl+I)"
      >
        <Italic size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Przekreslenie (Ctrl+Shift+X)"
      >
        <Strikethrough size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Kod inline (Ctrl+E)"
      >
        <Code size={18} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Lista punktowana"
      >
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Lista numerowana"
      >
        <ListOrdered size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Cytat"
      >
        <Quote size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        title="Checklist"
      >
        <CheckSquare size={18} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="Link (Ctrl+K)"
      >
        <LinkIcon size={18} />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Usun link"
        >
          <Unlink size={18} />
        </ToolbarButton>
      )}

      <ToolbarSeparator />

      <TableDropdown editor={editor} />

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Linia pozioma"
      >
        <Minus size={18} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Cofnij (Ctrl+Z)"
      >
        <Undo2 size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Ponow (Ctrl+Shift+Z)"
      >
        <Redo2 size={18} />
      </ToolbarButton>

      <div className="flex-1" />

      <select
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        title="Powieksz"
        className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 cursor-pointer hover:bg-gray-100 focus:outline-none"
      >
        {[50, 75, 100, 125, 150, 175, 200].map((v) => (
          <option key={v} value={v}>{v}%</option>
        ))}
      </select>

      <ToolbarSeparator />
      <span className="text-gray-400 text-xs truncate max-w-[250px]">
        {currentFileName || "Nowy dokument"}
        {isDirty ? " *" : ""}
      </span>
    </div>
  );
}
