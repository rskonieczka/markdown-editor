import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export function useMarkdownEditor({ onUpdate, initialContent }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "code-block",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: "Zacznij pisac...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent || "",
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
  });

  return editor;
}

export default function Editor({ editor, zoom = 100, fontFamily = "system-ui" }) {
  const scale = zoom / 100;
  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div
        className="max-w-[1200px] mx-auto min-h-full"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: `${100 / scale}%`,
          fontFamily: fontFamily,
        }}
      >
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-2/5" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-4/5" />
            <div className="h-4 bg-gray-100 rounded w-3/5" />
          </div>
        )}
      </div>
    </div>
  );
}
