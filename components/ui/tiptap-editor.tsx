"use client"

import { useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImageIcon,
  Highlighter,
  Type,
  Link,
  Link2Off,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

const TEXT_COLORS = [
  "#000000", "#ffffff", "#e74c3c", "#c0392b", "#e67e22", "#d35400",
  "#f1c40f", "#f39c12", "#2ecc71", "#27ae60", "#1abc9c", "#16a085",
  "#3498db", "#2980b9", "#9b59b6", "#8e44ad", "#34495e", "#2c3e50",
]

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#ff0000",
  "#ff6600", "#6600ff", "#ffffff", "#ffcc00", "#00ccff",
]

const DEFAULT_TEXT_COLOR = "#ffffff"

const rgbToHex = (value: string) => {
  const rgbMatch = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!rgbMatch) return DEFAULT_TEXT_COLOR

  const toHex = (channel: string) => Number(channel).toString(16).padStart(2, "0")
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Write something amazing...",
  className = "",
}: TiptapEditorProps) {
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isImageInputOpen, setIsImageInputOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor",
      },
    },
  })

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return

    if (linkUrl === "") {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run()
    }
    setLinkUrl("")
    setIsLinkInputOpen(false)
  }, [editor, linkUrl])

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setImageUrl("")
    setIsImageInputOpen(false)
  }, [editor, imageUrl])

  const addHorizontalRule = useCallback(() => {
    if (!editor) return
    editor.chain().focus().setHorizontalRule().run()
  }, [editor])

  if (!editor) {
    return null
  }

  const editorColor = editor.getAttributes("textStyle").color as string | undefined
  const currentTextColor = (() => {
    if (!editorColor || editorColor === "inherit" || editorColor === "transparent") return DEFAULT_TEXT_COLOR
    if (editorColor.startsWith("#")) return editorColor
    if (editorColor.startsWith("rgb")) return rgbToHex(editorColor)
    return DEFAULT_TEXT_COLOR
  })()

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 px-2 py-1 flex items-center gap-1 flex-wrap">
        {/* Undo/Redo */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().undo().run()}
          className="h-8 w-8"
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().redo().run()}
          className="h-8 w-8"
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 min-w-[60px]">
              <Type className="h-4 w-4" />
              <span className="text-xs">{editor.getAttributes("textStyle").fontSize || "16"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="grid grid-cols-3 gap-1">
              {FONT_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={editor.getAttributes("textStyle").fontSize === `${size}px` ? "default" : "ghost"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => editor.chain().focus().setFontSize(`${size}px`).run()}
                >
                  {size}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8"
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0" title="Text Color">
              <span
                className="text-xs font-bold text-foreground"
              >
                A
              </span>
              <span
                className="absolute bottom-1 left-1.5 right-1.5 h-0.5 rounded-full"
                style={{ backgroundColor: currentTextColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Text Color</p>
              <div className="grid grid-cols-6 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="color"
                  value={currentTextColor || DEFAULT_TEXT_COLOR}
                  className="h-8 w-14 cursor-pointer p-1"
                  onMouseDown={(e) => e.preventDefault()}
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  aria-label="Custom text color"
                />
                <span className="text-xs text-muted-foreground">{currentTextColor.toUpperCase()}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => editor.chain().focus().setColor(DEFAULT_TEXT_COLOR).run()}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Highlighter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Highlight</p>
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  />
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Heading */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
              <Pilcrow className="h-4 w-4" />
              <span className="text-xs">Text</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            <Button
              variant={editor.isActive("paragraph") ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              <Pilcrow className="h-4 w-4 mr-2" />
              Paragraph
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="h-4 w-4 mr-2" />
              Heading 1
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="h-4 w-4 mr-2" />
              Heading 2
            </Button>
            <Button
              variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="h-4 w-4 mr-2" />
              Heading 3
            </Button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text Align */}
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
          className="h-8 w-8"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
          className="h-8 w-8"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
          className="h-8 w-8"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "justify" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
          className="h-8 w-8"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          className="h-8 w-8"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <Popover open={isLinkInputOpen} onOpenChange={setIsLinkInputOpen}>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive("link")}
              onPressedChange={() => setIsLinkInputOpen(!isLinkInputOpen)}
              className="h-8 w-8"
              title="Add Link"
            >
              <Link className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Insert Link</p>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addLink()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addLink}>
                  {editor.isActive("link") ? "Update" : "Add"} Link
                </Button>
                {editor.isActive("link") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run()
                      setLinkUrl("")
                      setIsLinkInputOpen(false)
                    }}
                  >
                    <Link2Off className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Image URL */}
        <Popover open={isImageInputOpen} onOpenChange={setIsImageInputOpen}>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={false}
              onPressedChange={() => setIsImageInputOpen(!isImageInputOpen)}
              className="h-8 w-8"
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Insert Image URL</p>
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addImage()}
              />
              <Button size="sm" onClick={addImage} disabled={!imageUrl}>
                Insert Image
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Horizontal Rule */}
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={addHorizontalRule}
          className="h-8 w-8"
          title="Horizontal Line"
        >
          <Minus className="h-4 w-4" />
        </Toggle>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[300px] focus-within:outline-none bg-black/20"
      />

      <style jsx global>{`
        .tiptap-editor {
          outline: none;
          min-height: 300px;
        }
        .tiptap-editor:focus {
          outline: none;
        }
        .tiptap-editor p {
          margin: 0.5em 0;
        }
        .tiptap-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .tiptap-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .tiptap-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .tiptap-editor ul,
        .tiptap-editor ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .tiptap-editor li {
          margin: 0.25em 0;
        }
        .tiptap-editor blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1em;
          color: #6b7280;
          margin: 0.5em 0;
        }
        .tiptap-editor hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1em 0;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5em 0;
        }
        .tiptap-editor a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .tiptap-editor mark {
          background-color: #ffff00;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }
        .tiptap-editor .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        /* Default white text color — inline styles from Tiptap override this */
        .tiptap-editor {
          color: #ffffff;
        }
      `}</style>
    </div>
  )
}
