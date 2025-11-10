import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Heading1, Heading2, Heading3, Code,
    Quote, Undo, Redo, Type, Subscript, Superscript, Table2, Minus, Eraser,
    Unlink, Image, FileText, Palette, Settings, Eye, EyeOff, Check
} from 'lucide-react'

const RichTextEditor = forwardRef(({ value, onChange, placeholder, disabled }, ref) => {
    const editorRef = useRef(null)
    const [showLinkInput, setShowLinkInput] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [linkText, setLinkText] = useState('')
    const [detectedCodes, setDetectedCodes] = useState(new Set())
    const [showPageSetup, setShowPageSetup] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)

    const [pageSetup, setPageSetup] = useState({
        paperSize: 'A4',
        orientation: 'portrait',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
        showPageNumbers: true,
        pageNumberPosition: 'bottom-right',
        headerText: '',
        footerText: '',
        lineSpacing: 1.5
    })

    // Page dimensions in mm
    const pageDimensions = {
        'A4': { width: 210, height: 297 },
        'A3': { width: 297, height: 420 },
        'Letter': { width: 216, height: 279 },
        'Legal': { width: 216, height: 356 }
    }

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || ''
            detectExistingEvidenceCodes()
        }
    }, [value])

    const detectExistingEvidenceCodes = () => {
        if (!editorRef.current) return
        const foundCodes = new Set()
        const evidenceLinks = editorRef.current.querySelectorAll('a.evidence-link')
        evidenceLinks.forEach(link => {
            const code = link.getAttribute('data-code')
            if (code && /^[A-Z]{1,3}\d+\.\d{2}\.\d{2}\.\d{2}$/.test(code)) {
                foundCodes.add(code)
            }
        })
        setDetectedCodes(foundCodes)
    }

    const handleInput = () => {
        if (onChange && editorRef.current) {
            onChange(editorRef.current.innerHTML)
            detectExistingEvidenceCodes()
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
        if (url) execCommand('insertImage', url)
    }

    const handleInsertTable = () => {
        const rows = prompt('Số hàng:', 3)
        const cols = prompt('Số cột:', 3)
        if (!rows || !cols || isNaN(rows) || isNaN(cols)) return

        let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 10px 0;">'
        for (let i = 0; i < parseInt(rows); i++) {
            tableHtml += '<tr>'
            for (let j = 0; j < parseInt(cols); j++) {
                if (i === 0) {
                    tableHtml += '<th style="border: 1px solid #ccc; padding: 8px; background-color: #f0f0f0;">Tiêu đề</th>'
                } else {
                    tableHtml += '<td style="border: 1px solid #ccc; padding: 8px;">Nội dung</td>'
                }
            }
            tableHtml += '</tr>'
        }
        tableHtml += '</table>'
        execCommand('insertHTML', tableHtml)
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

    const handleInsertPageBreak = () => {
        const pageBreak = '<div style="page-break-after: always; margin: 20px 0;"><hr style="border: 2px dashed #999;"></div>'
        execCommand('insertHTML', pageBreak)
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
                detectExistingEvidenceCodes()
                handleInput()
            }, 0)
        }
    }

    const handleInsertHTML = (htmlContent) => {
        if (!editorRef.current) {
            console.error('Editor ref not available')
            return false
        }

        try {
            editorRef.current.focus()
            document.execCommand('insertHTML', false, htmlContent)

            setTimeout(() => {
                detectExistingEvidenceCodes()
                handleInput()
            }, 0)

            return true
        } catch (error) {
            console.error('Insert HTML error:', error)
            return false
        }
    }

    const handlePageSetupChange = (key, value) => {
        setPageSetup(prev => ({ ...prev, [key]: value }))
    }

    const exportToPDF = () => {
        const content = editorRef.current?.innerHTML || ''
        const printWindow = window.open('', '', 'width=800,height=600')

        const css = `
            @page {
                size: ${pageSetup.paperSize} ${pageSetup.orientation};
                margin: ${pageSetup.marginTop}mm ${pageSetup.marginRight}mm ${pageSetup.marginBottom}mm ${pageSetup.marginLeft}mm;
            }
            body { margin: 0; padding: 0; }
            * { page-break-inside: avoid; }
        `

        const html = `
            <html>
                <head>
                    <style>${css}</style>
                </head>
                <body>
                    ${pageSetup.headerText ? `<div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">${pageSetup.headerText}</div>` : ''}
                    ${content}
                    ${pageSetup.footerText ? `<div style="text-align: center; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">${pageSetup.footerText}</div>` : ''}
                </body>
            </html>
        `

        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.print()
    }

    useImperativeHandle(ref, () => ({
        insertEvidenceCode: handleInsertEvidenceCode,
        insertHTML: handleInsertHTML,
        getContent: () => editorRef.current?.innerHTML || '',
        focus: () => editorRef.current?.focus(),
        getPageSetup: () => pageSetup,
        exportToPDF: exportToPDF
    }))

    const ToolbarButton = ({ onClick, title, children, active = false }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${active ? 'bg-gray-200' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
        >
            {children}
        </button>
    )

    const editorStyle = {
        maxWidth: pageSetup.orientation === 'portrait'
            ? `${pageDimensions[pageSetup.paperSize]?.width}mm`
            : `${pageDimensions[pageSetup.paperSize]?.height}mm`,
        margin: '20px auto',
        padding: `${pageSetup.marginTop}mm ${pageSetup.marginRight}mm ${pageSetup.marginBottom}mm ${pageSetup.marginLeft}mm`,
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        lineHeight: pageSetup.lineSpacing,
        minHeight: `${pageDimensions[pageSetup.paperSize]?.height}mm`,
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Main Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('bold')} title="Bold">
                        <Bold className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('italic')} title="Italic">
                        <Italic className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('underline')} title="Underline">
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
                    <ToolbarButton onClick={() => execCommand('removeFormat')} title="Clear Format">
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
                        <span className="text-sm font-bold text-red-600">A</span>
                    </ToolbarButton>
                    <ToolbarButton onClick={handleBackgroundColor} title="Background Color">
                        <Palette className="h-4 w-4" />
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
                        🔗
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('unlink')} title="Remove Link">
                        <Unlink className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={handleInsertImage} title="Insert Image">
                        <Image className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('insertHorizontalRule')} title="Horizontal Line">
                        <Minus className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<blockquote>')} title="Quote">
                        <Quote className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('formatBlock', '<pre>')} title="Code Block">
                        <Code className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={handleInsertPageBreak} title="Insert Page Break">
                        <FileText className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <ToolbarButton onClick={() => execCommand('undo')} title="Undo">
                        <Undo className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('redo')} title="Redo">
                        <Redo className="h-4 w-4" />
                    </ToolbarButton>
                </div>

                <div className="flex gap-1">
                    <ToolbarButton onClick={() => setShowPageSetup(!showPageSetup)} title="Page Setup">
                        <Settings className="h-4 w-4" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => setPreviewMode(!previewMode)} title="Preview Mode">
                        {previewMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </ToolbarButton>
                    <ToolbarButton onClick={exportToPDF} title="Export to PDF">
                        <FileText className="h-4 w-4" />
                    </ToolbarButton>
                </div>
            </div>

            {/* Page Setup Panel */}
            {showPageSetup && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Kích thước giấy</label>
                            <select
                                value={pageSetup.paperSize}
                                onChange={(e) => handlePageSetupChange('paperSize', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                                <option value="A4">A4</option>
                                <option value="A3">A3</option>
                                <option value="Letter">Letter</option>
                                <option value="Legal">Legal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Hướng</label>
                            <select
                                value={pageSetup.orientation}
                                onChange={(e) => handlePageSetupChange('orientation', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                                <option value="portrait">Dọc</option>
                                <option value="landscape">Ngang</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Lề trái (mm)</label>
                            <input
                                type="number"
                                value={pageSetup.marginLeft}
                                onChange={(e) => handlePageSetupChange('marginLeft', parseInt(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Lề phải (mm)</label>
                            <input
                                type="number"
                                value={pageSetup.marginRight}
                                onChange={(e) => handlePageSetupChange('marginRight', parseInt(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Lề trên (mm)</label>
                            <input
                                type="number"
                                value={pageSetup.marginTop}
                                onChange={(e) => handlePageSetupChange('marginTop', parseInt(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Lề dưới (mm)</label>
                            <input
                                type="number"
                                value={pageSetup.marginBottom}
                                onChange={(e) => handlePageSetupChange('marginBottom', parseInt(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Khoảng cách dòng</label>
                            <select
                                value={pageSetup.lineSpacing}
                                onChange={(e) => handlePageSetupChange('lineSpacing', parseFloat(e.target.value))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                                <option value="1">Đơn</option>
                                <option value="1.15">1.15</option>
                                <option value="1.5">1.5</option>
                                <option value="2">Đôi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Hiển thị số trang</label>
                            <select
                                value={pageSetup.showPageNumbers ? 'true' : 'false'}
                                onChange={(e) => handlePageSetupChange('showPageNumbers', e.target.value === 'true')}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                                <option value="true">Có</option>
                                <option value="false">Không</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Text Header</label>
                            <input
                                type="text"
                                value={pageSetup.headerText}
                                onChange={(e) => handlePageSetupChange('headerText', e.target.value)}
                                placeholder="Nhập văn bản header"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Text Footer</label>
                            <input
                                type="text"
                                value={pageSetup.footerText}
                                onChange={(e) => handlePageSetupChange('footerText', e.target.value)}
                                placeholder="Nhập văn bản footer"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Link Input Panel */}
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

            {/* Editor Container */}
            <div className={`${previewMode ? 'bg-gray-100 overflow-y-auto' : 'bg-white'}`} style={{ maxHeight: '800px' }}>
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    onInput={handleInput}
                    suppressContentEditableWarning={true}
                    style={previewMode ? editorStyle : { minHeight: '400px', padding: '16px' }}
                    className={`focus:outline-none ${disabled ? 'bg-gray-50' : 'bg-white'} ${previewMode ? 'page-content' : ''}`}
                    data-placeholder={placeholder || 'Nhập nội dung báo cáo...'}
                />
            </div>

            {/* Detected Evidence Codes */}
            {detectedCodes.size > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-sm">{detectedCodes.size}</span>
                            </div>
                            <span className="text-sm font-medium text-blue-900">Mã minh chứng đã phát hiện</span>
                        </div>
                        <div className="flex flex-wrap gap-1 max-w-md">
                            {Array.from(detectedCodes).slice(0, 5).map((code, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
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
                    margin: 1em 0;
                    color: #6b7280;
                }
                [contenteditable] pre {
                    background-color: #f3f4f6;
                    padding: 1em;
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
                .page-content {
                    box-sizing: border-box;
                }
                @media print {
                    .page-content {
                        page-break-after: always;
                    }
                }
            `}</style>
        </div>
    )
})

RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor