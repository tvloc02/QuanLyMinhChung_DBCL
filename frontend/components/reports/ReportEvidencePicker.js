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
    Code,
    Quote,
    Undo,
    Redo,
    Type,
    FileText,
    Layers,
    Image,
    Subscript,
    Superscript,
    Table2,
    Minus,
    Eraser,
    Unlink
} from 'lucide-react'
import toast from 'react-hot-toast'

const RichTextEditor = forwardRef(({ value, onChange, placeholder, disabled, onOpenPicker }, ref) => {
    const editorRef = useRef(null)
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [linkText, setLinkText] = useState('')
    const [detectedCodes, setDetectedCodes] = useState(new Set())
    const [detectedReports, setDetectedReports] = useState(new Set())
    const [showReportInsert, setShowReportInsert] = useState(false)
    const [reportEmbedTitle, setReportEmbedTitle] = useState('')
    const [reportEmbedId, setReportEmbedId] = useState('')
    const [reportEmbedAuthorHidden, setReportEmbedAuthorHidden] = useState(false)

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || ''
            detectExistingContent()
        }
    }, [value])

    const detectExistingContent = () => {
        if (!editorRef.current) return

        const foundCodes = new Set()
        const foundReports = new Set()
        const evidenceLinks = editorRef.current.querySelectorAll('a.evidence-link')
        const linkedReports = editorRef.current.querySelectorAll('div.linked-report')

        evidenceLinks.forEach(link => {
            const code = link.getAttribute('data-code')
            if (code && /^[A-Z]{1,3}\d+\.\d{2}\.\d{2}\.\d{2}$/.test(code)) {
                foundCodes.add(code)
            }
        })

        linkedReports.forEach(div => {
            const reportId = div.getAttribute('data-report-id')
            if (reportId) {
                foundReports.add(reportId)
            }
        })

        setDetectedCodes(foundCodes)
        setDetectedReports(foundReports)
    }

    const handleInput = () => {
        if (onChange && editorRef.current) {
            const content = editorRef.current.innerHTML
            onChange(content)

            detectExistingContent()
        }
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

    const handleInsertImage = () => {
        const url = prompt('Nhập URL hình ảnh:')
        if (url) {
            execCommand('insertImage', url)
        }
    }

    const handleInsertTable = () => {
        const rows = prompt('Số hàng (Rows):', 3);
        const cols = prompt('Số cột (Columns):', 3);
        if (!rows || !cols || isNaN(rows) || isNaN(cols)) return;

        let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">';
        for (let i = 0; i < parseInt(rows); i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
                if (i === 0) {
                    tableHtml += '<th style="border: 1px solid #ccc; padding: 8px; background-color: #f0f0f0;">Tiêu đề</th>';
                } else {
                    tableHtml += '<td style="border: 1px solid #ccc; padding: 8px;">Nội dung</td>';
                }
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</table>';
        execCommand('insertHTML', tableHtml);
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

    const handleUnlink = () => {
        execCommand('unlink');
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
        if (!code || !/^[A-Z]{1,3}\d+\.\d{2}\.\d{2}\.\d{2}$/.test(code)) {
            console.error('Invalid evidence code:', code)
            return
        }

        if (editorRef.current) {
            editorRef.current.focus()

            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
            const evidenceUrl = `${baseUrl}/public/evidences/${code}`

            const linkHTML = `<a href="${evidenceUrl}" class="evidence-link" data-code="${code}" target="_blank" rel="noopener noreferrer">${code}</a>&nbsp;`

            document.execCommand('insertHTML', false, linkHTML)

            setTimeout(() => {
                detectExistingContent()
                handleInput()
            }, 0)
        }
    }

    const handleInsertLinkedReport = ({ id, title, reportType, hideAuthor = false }) => {
        if (!id || !title) return

        if (editorRef.current) {
            editorRef.current.focus()

            const typeText = reportType || 'Báo cáo Nhúng';

            const html = `<div contenteditable="false" data-report-id="${id}" data-hide-author="${hideAuthor}" class="linked-report" title="Báo cáo nhúng: ${title}">
                <span style="font-size: 14px; font-weight: bold; color: #4f46e5;">[${typeText.toUpperCase()}]:</span>
                <span style="font-size: 14px; font-style: italic; color: #4b5563;">${title}</span>
                <button contenteditable="true" onclick="this.parentNode.setAttribute('data-hide-author', this.parentNode.getAttribute('data-hide-author') === 'true' ? 'false' : 'true'); event.stopPropagation(); return false;" style="margin-left: 10px; padding: 2px 5px; background: #fff; border: 1px solid #ccc; cursor: pointer; border-radius: 4px; font-size: 10px; opacity: 0.7;">
                    Tùy chọn: Ẩn/Hiện Tác giả
                </button>
            </div>&nbsp;`

            document.execCommand('insertHTML', false, html)

            setTimeout(() => {
                detectExistingContent()
                handleInput()
            }, 0)
        }
    }

    useImperativeHandle(ref, () => ({
        insertEvidenceCode: handleInsertEvidenceCode,
        insertLinkedReport: handleInsertLinkedReport,
        getContent: () => editorRef.current?.innerHTML || ''
    }))

    const ToolbarButton = ({ onClick, title, children, active = false, className = '' }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                active ? 'bg-gray-200' : ''
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    )

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
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
                    <ToolbarButton onClick={() => execCommand('subscript')} title="Subscript">
                        <Subscript className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('superscript')} title="Superscript">
                        <Superscript className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('removeFormat')} title="Remove Formatting">
                        <Eraser className="h-4 w-4" />
                    </ToolbarButton>
                </div>

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
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<p>')} title="Paragraph">
                        <Type className="h-4 w-4" />
                    </ToolbarButton>
                </div>

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

                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={handleTextColor} title="Text Color">
                        <span className="text-sm font-bold" style={{ color: '#dc2626' }}>A</span>
                    </ToolbarButton>
                    <ToolbarButton onClick={handleBackgroundColor} title="Background Color">
                        <span className="text-sm font-bold">🎨</span>
                    </ToolbarButton>
                </div>

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

                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                        <List className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                        <ListOrdered className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleInsertTable} title="Insert Table">
                        <Table2 className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={handleInsertLink} title="Insert Link">
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleUnlink} title="Remove Link">
                        <Unlink className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleInsertImage} title="Insert Image">
                        <Image className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} title="Horizontal Line">
                        <Minus className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                {/* Thay đổi: Dùng onOpenPicker để gọi modal bên ngoài */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => onOpenPicker('evidence')} title="Chèn Mã Minh chứng">
                        <FileText className="h-4 w-4 text-green-700" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => onOpenPicker('report')} title="Chèn Báo cáo Con">
                        <Layers className="h-4 w-4 text-indigo-700" />
                    </ToolbarButton>
                    <ToolbarButton onClick={onInsertNewEvidence} title="Tạo Minh chứng Mới" className="bg-green-100 hover:bg-green-200">
                        <Plus className="h-4 w-4 text-green-700" />
                    </ToolbarButton>
                </div>
                {/* End Thay đổi */}


                <div className="flex gap-1">
                    <ToolbarButton onClick={() => execCommand('undo')} title="Undo (Ctrl+Z)">
                        <Undo className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('redo')} title="Redo (Ctrl+Y)">
                        <Redo className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>

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

            {/* Removed inline Report Insert Modal logic */}


            <div
                ref={editorRef}
                contentEditable={!disabled}
                onInput={handleInput}
                suppressContentEditableWarning={true}
                className={`min-h-[400px] p-4 focus:outline-none ${disabled ? 'bg-gray-50' : 'bg-white'}`}
                style={{
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}
                data-placeholder={placeholder || 'Nhập nội dung báo cáo...'}
            />

            {(detectedCodes.size > 0 || detectedReports.size > 0) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">{detectedCodes.size + detectedReports.size}</span>
                            </div>
                            <span className="text-sm font-medium text-blue-900">
                                Mã minh chứng/Báo cáo nhúng đã phát hiện
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-md">
                            {Array.from(detectedCodes)
                                .slice(0, 3)
                                .map((code, idx) => (
                                    <span
                                        key={`code-${idx}`}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono"
                                        title="Minh chứng"
                                    >
                                        {code}
                                    </span>
                                ))}
                            {Array.from(detectedReports)
                                .slice(0, 2)
                                .map((reportId, idx) => (
                                    <span
                                        key={`report-${idx}`}
                                        className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-mono"
                                        title="Báo cáo nhúng"
                                    >
                                        RP-{reportId.substring(0,4)}
                                    </span>
                                ))}
                            {(detectedCodes.size + detectedReports.size > 5) && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                    +{detectedCodes.size + detectedReports.size - 5} khác
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
                [contenteditable] ul,
                [contenteditable] ol {
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

                span.evidence-code {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.25rem 0.75rem;
                    background-color: #fef08a;
                    color: #854d0e;
                    border-radius: 0.375rem;
                    font-family: monospace;
                    font-weight: 600;
                    font-size: 0.875rem;
                    border: 1px solid #fcd34d;
                    cursor: pointer;
                    white-space: nowrap;
                }
                span.evidence-code:hover {
                    background-color: #fde047;
                }

                a.evidence-link {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.25rem 0.75rem;
                    background-color: #dbeafe;
                    color: #1e40af;
                    border-radius: 0.375rem;
                    font-family: monospace;
                    font-weight: 600;
                    font-size: 0.875rem;
                    text-decoration: none;
                    border: 1px solid #7dd3fc;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }
                a.evidence-link:hover {
                    background-color: #93c5fd;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                div.linked-report {
                    display: block;
                    padding: 1rem;
                    margin: 1rem 0;
                    border-left: 4px solid #4f46e5;
                    background-color: #f5f3ff;
                    border-radius: 0.375rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    cursor: default;
                    user-select: none;
                }
            `}</style>
        </div>
    )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor