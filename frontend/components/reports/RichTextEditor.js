import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import {
    Bold,
    Italic,
    Underline,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    Code,
    Quote,
    Undo,
    Redo,
    Type
} from 'lucide-react'

const RichTextEditor = forwardRef(({ value, onChange, placeholder, disabled }, ref) => {
    const editorRef = useRef(null)
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [linkText, setLinkText] = useState('')
    const [detectedCodes, setDetectedCodes] = useState(new Set())

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || ''
            // Detect existing evidence codes in loaded content
            detectExistingEvidenceCodes()
        }
    }, [value])

    const detectExistingEvidenceCodes = () => {
        if (!editorRef.current) return

        const foundCodes = new Set()
        const evidenceSpans = editorRef.current.querySelectorAll('.evidence-code')

        evidenceSpans.forEach(span => {
            const code = span.getAttribute('data-code')
            if (code) {
                foundCodes.add(code)
            }
        })

        setDetectedCodes(foundCodes)
    }

    const handleInput = () => {
        if (onChange && editorRef.current) {
            // Auto-detect evidence codes while typing
            autoDetectEvidenceCodes()
            onChange(editorRef.current.innerHTML)
        }
    }

    // Auto-detect and convert evidence codes to styled spans
    const autoDetectEvidenceCodes = () => {
        if (!editorRef.current) return

        const selection = window.getSelection()
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        const cursorPosition = range ? range.startOffset : 0

        let content = editorRef.current.innerHTML
        const foundCodes = new Set()

        // Pattern để nhận diện mã minh chứng
        // Ví dụ: H1.01.01.04, TC-3.1, MC.2023.01, v.v.
        const evidencePattern = /(?:^|\s)((?:[A-Z]{1,3}[-.])?[0-9]{1,2}\.?[0-9]{1,2}\.?[0-9]{1,2}\.?[0-9]{0,2}(?:[A-Z]?))\s/gi

        // Tìm và thay thế các mã chưa được format
        content = content.replace(evidencePattern, (match, code) => {
            // Kiểm tra xem đã được format chưa
            if (match.includes('evidence-code')) {
                foundCodes.add(code.trim())
                return match
            }

            const trimmedCode = code.trim()
            // Chỉ format nếu code có ít nhất 1 dấu . hoặc -
            if (trimmedCode.includes('.') || trimmedCode.includes('-')) {
                foundCodes.add(trimmedCode)
                return ` <span class="evidence-code" data-code="${trimmedCode}" style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 500; font-family: monospace;">${trimmedCode}</span> `
            }
            return match
        })

        // Pattern để nhận diện khi có dấu #
        const hashPattern = /#([A-Z0-9.-]+)/gi
        content = content.replace(hashPattern, (match, code) => {
            if (match.includes('evidence-code')) {
                foundCodes.add(code)
                return match
            }
            foundCodes.add(code)
            return `<span class="evidence-code" data-code="${code}" style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 500; font-family: monospace;">${code}</span>&nbsp;`
        })

        // Update detected codes state
        setDetectedCodes(foundCodes)

        if (content !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = content

            // Restore cursor position
            try {
                const newRange = document.createRange()
                const textNodes = getTextNodes(editorRef.current)
                let charCount = 0

                for (let node of textNodes) {
                    const nodeLength = node.textContent.length
                    if (charCount + nodeLength >= cursorPosition) {
                        newRange.setStart(node, Math.min(cursorPosition - charCount, nodeLength))
                        newRange.collapse(true)
                        selection.removeAllRanges()
                        selection.addRange(newRange)
                        break
                    }
                    charCount += nodeLength
                }
            } catch (e) {
                // Cursor restoration failed, continue without it
            }
        }
    }

    const getTextNodes = (node) => {
        const textNodes = []
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        )
        let currentNode
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode)
        }
        return textNodes
    }

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value)
        editorRef.current?.focus()
        handleInput()
    }

    const handleTextColor = () => {
        const color = prompt('Nhập mã màu (vd: #ff0000):')
        if (color) execCommand('foreColor', color)
    }

    const handleBackgroundColor = () => {
        const color = prompt('Nhập mã màu nền (vd: #ffff00):')
        if (color) execCommand('backColor', color)
    }

    const handleFontSize = (size) => {
        execCommand('fontSize', size)
    }

    const handleInsertLink = () => {
        const selection = window.getSelection()
        const selectedText = selection.toString()

        if (selectedText) {
            setLinkText(selectedText)
            setShowLinkInput(true)
        } else {
            const url = prompt('Nhập URL:')
            if (url) execCommand('createLink', url)
        }
    }

    const confirmInsertLink = () => {
        if (linkUrl) {
            const link = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${linkText}</a>`
            execCommand('insertHTML', link)
            setShowLinkInput(false)
            setLinkUrl('')
            setLinkText('')
        }
    }

    const handleInsertEvidenceCode = (code) => {
        const evidenceHTML = `<span class="evidence-code" data-code="${code}" style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 500; font-family: monospace;">${code}</span>&nbsp;`

        // Focus the editor first
        if (editorRef.current) {
            editorRef.current.focus()
            // Wait a tick for focus to complete
            setTimeout(() => {
                execCommand('insertHTML', evidenceHTML)
                // Update detected codes
                setDetectedCodes(prev => new Set([...prev, code]))
            }, 0)
        }
    }

    // Expose method to parent using useImperativeHandle
    useImperativeHandle(ref, () => ({
        insertEvidenceCode: handleInsertEvidenceCode
    }))

    const ToolbarButton = ({ onClick, title, children, active = false }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-gray-100 ${active ? 'bg-gray-200' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
        >
            {children}
        </button>
    )

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
                {/* Text Formatting */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
                        <Underline className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough">
                        <span className="text-sm font-bold">S</span>
                    </ToolbarButton>
                </div>

                {/* Headings */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<h1>')} title="Heading 1">
                        <Heading1 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<h2>')} title="Heading 2">
                        <Heading2 className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<h3>')} title="Heading 3">
                        <Heading3 className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                {/* Font Size */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <select
                        onChange={(e) => handleFontSize(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                        disabled={disabled}
                        defaultValue="3"
                    >
                        <option value="1">8pt</option>
                        <option value="2">10pt</option>
                        <option value="3">12pt</option>
                        <option value="4">14pt</option>
                        <option value="5">18pt</option>
                        <option value="6">24pt</option>
                        <option value="7">36pt</option>
                    </select>
                </div>

                {/* Colors */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={handleTextColor} title="Text Color">
                        <Type className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleBackgroundColor} title="Background Color">
                        <span className="text-sm font-bold">🎨</span>
                    </ToolbarButton>
                </div>

                {/* Alignment */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align Left">
                        <AlignLeft className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align Center">
                        <AlignCenter className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('justifyRight')} title="Align Right">
                        <AlignRight className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('justifyFull')} title="Justify">
                        <AlignJustify className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                {/* Lists */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                {/* Insert */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={handleInsertLink} title="Insert Link">
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} title="Horizontal Line">
                        <span className="text-sm font-bold">—</span>
                    </ToolbarButton>
                </div>

                {/* Other */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<blockquote>')} title="Quote">
                        <Quote className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<pre>')} title="Code Block">
                        <Code className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-1">
                    <ToolbarButton onClick={() => execCommand('undo')} title="Undo (Ctrl+Z)">
                        <Undo className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('redo')} title="Redo (Ctrl+Y)">
                        <Redo className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>

            {/* Link Input Modal */}
            {showLinkInput && (
                <div className="bg-blue-50 border-b border-blue-200 p-3">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-700 mb-1">Text:</label>
                            <input
                                type="text"
                                value={linkText}
                                onChange={(e) => setLinkText(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="Link text"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-700 mb-1">URL:</label>
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                placeholder="https://..."
                            />
                        </div>
                        <button
                            type="button"
                            onClick={confirmInsertLink}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                            Insert
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowLinkInput(false)
                                setLinkUrl('')
                                setLinkText('')
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                className={`min-h-[400px] p-4 focus:outline-none ${disabled ? 'bg-gray-50' : 'bg-white'}`}
                style={{
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}
                data-placeholder={placeholder || 'Nhập nội dung báo cáo...'}
            />

            {/* Evidence Codes Counter */}
            {detectedCodes.size > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">{detectedCodes.size}</span>
                            </div>
                            <span className="text-sm font-medium text-blue-900">
                                Mã minh chứng đã phát hiện
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-md">
                            {Array.from(detectedCodes).slice(0, 5).map((code, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono"
                                >
                                    {code}
                                </span>
                            ))}
                            {detectedCodes.size > 5 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                    +{detectedCodes.size - 5} khác
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    cursor: text;
                }
                [contenteditable] {
                    outline: none;
                }
                [contenteditable] h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin: 0.67em 0;
                }
                [contenteditable] h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 0.75em 0;
                }
                [contenteditable] h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin: 0.83em 0;
                }
                [contenteditable] blockquote {
                    border-left: 4px solid #e5e7eb;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: #6b7280;
                }
                [contenteditable] pre {
                    background-color: #f3f4f6;
                    padding: 1rem;
                    border-radius: 0.375rem;
                    overflow-x: auto;
                    font-family: monospace;
                }
                [contenteditable] ul, [contenteditable] ol {
                    padding-left: 2rem;
                    margin: 0.5rem 0;
                }
                [contenteditable] li {
                    margin: 0.25rem 0;
                }
                [contenteditable] a {
                    color: #2563eb;
                    text-decoration: underline;
                }
                .evidence-code {
                    display: inline-flex;
                    align-items: center;
                    transition: all 0.2s ease;
                    border: 1px solid #93c5fd;
                    position: relative;
                }
                .evidence-code:hover {
                    background-color: #93c5fd !important;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }
                .evidence-code::before {
                    content: '🔗';
                    margin-right: 4px;
                    font-size: 0.85em;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .evidence-code {
                    animation: fadeIn 0.3s ease;
                }
            `}</style>
        </div>
    )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor