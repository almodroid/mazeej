import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect, useState } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rtl?: boolean;
}

export default function TiptapEditor({ value, onChange, placeholder, rtl }: TiptapEditorProps) {
  const [direction, setDirection] = useState(rtl ? 'rtl' : 'ltr');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
      Placeholder.configure({ placeholder: placeholder || '' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `min-h-[180px] border rounded-md p-3 bg-background focus:outline-none ${direction === 'rtl' ? 'text-right' : ''}`,
        dir: direction,
      },
    },
  });

  // Update editor content if value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Update direction if rtl prop changes
  useEffect(() => {
    setDirection(rtl ? 'rtl' : 'ltr');
  }, [rtl]);

  if (!editor) return <div className="min-h-[180px] border rounded-md p-3 bg-background">Loading editor...</div>;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 mb-2 border rounded-md p-2 bg-muted">
        <button
          type="button"
          onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}
          className={direction === 'rtl' ? 'text-primary font-bold' : ''}
          title="Toggle RTL/LTR"
        >
          {direction === 'rtl' ? 'RTL ⬅️' : 'LTR ➡️'}
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'font-bold text-primary' : ''} title="Bold (Ctrl+B)"><b>B</b></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'italic text-primary' : ''} title="Italic (Ctrl+I)"><i>I</i></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'underline text-primary' : ''} title="Underline (Ctrl+U)"><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'text-primary' : ''} title="Heading 1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'text-primary' : ''} title="Heading 2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'text-primary' : ''} title="Heading 3">H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'text-primary' : ''} title="Bullet List">• List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'text-primary' : ''} title="Numbered List">1. List</button>
        <button type="button" onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }} title="Insert Image">🖼️</button>
        <button type="button" onClick={() => {
          const url = window.prompt('Enter link URL');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} className={editor.isActive('link') ? 'text-primary' : ''} title="Insert Link">🔗</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'text-primary' : ''} title="Align Left">⬅️</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'text-primary' : ''} title="Align Center">⬆️</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'text-primary' : ''} title="Align Right">➡️</button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">🧹</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
} 