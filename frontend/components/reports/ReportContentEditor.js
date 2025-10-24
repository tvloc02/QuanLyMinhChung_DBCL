import React, { forwardRef, useImperativeHandle, useEffect, useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'

const ReportContentEditor = forwardRef(({ value, onChange, placeholder }, ref) => {
    const editorRef = useRef(null)

    useImperativeHandle(ref, () => ({
        getContent: () => editorRef.current?.getContent() || '',
        // Hàm này có thể cần được phát triển để chèn mã minh chứng
        insertEvidenceCode: (code) => {
            if (editorRef.current) {
                // Giả định cấu trúc link minh chứng
                const evidenceLink = `<a href="/public/evidences/${code}" class="evidence-link" data-code="${code}" target="_blank" rel="noopener noreferrer">${code}</a>`
                editorRef.current.execCommand('mceInsertContent', false, evidenceLink + '&nbsp;')
            }
        }
    }))

    // Cấu hình TinyMCE
    const editorConfig = {
        height: 500,
        menubar: false,
        plugins: [
            'adv list autolink lists link image charm print preview anchor',
            'search replace visualblocks code fullscreen',
            'insert datetime media table paste code help wordcount'
        ],
        toolbar:
            'undo redo | formats elect | bold italic backcolor | \
            alignment align center align right align justify | \
            bullist namelist outdent indent | reformat | link image | code | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
    }

    return (
        <Editor
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY} // Đảm bảo key đã được thiết lập
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={value}
            onEditorChange={onChange}
            init={editorConfig}
        />
    )
})

ReportContentEditor.displayName = 'ReportContentEditor'

export default ReportContentEditor