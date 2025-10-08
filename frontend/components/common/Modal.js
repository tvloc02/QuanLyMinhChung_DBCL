import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({
                                  isOpen,
                                  onClose,
                                  title,
                                  children,
                                  size = 'medium',
                                  showCloseButton = true,
                                  className = ''
                              }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
        small: 'max-w-md',
        medium: 'max-w-lg',
        large: 'max-w-2xl',
        xlarge: 'max-w-4xl',
        fullscreen: 'max-w-full mx-4'
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
            {/* Backdrop */}
            <div
                className="fixed inset-0 transition-opacity"
                onClick={onClose}
                style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(4px)'
                }}
            />

            <div className="flex items-center justify-center min-h-screen px-4 py-6">
                <div
                    className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} ${className} animate-slide-in-right`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)'
                    }}
                >
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between px-6 py-5 border-b"
                             style={{ borderColor: '#E2E8F0' }}>
                            {title && (
                                <h3 className="text-lg font-bold" style={{ color: '#1E293B' }}>{title}</h3>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                                    style={{ color: '#64748B' }}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ConfirmModal({
                                 isOpen,
                                 onClose,
                                 onConfirm,
                                 title = 'Xác nhận',
                                 message,
                                 confirmText = 'Xác nhận',
                                 cancelText = 'Hủy',
                                 type = 'danger'
                             }) {
    const typeConfigs = {
        success: {
            bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            hoverBg: '#059669',
            shadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
        },
        warning: {
            bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            hoverBg: '#D97706',
            shadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
        },
        danger: {
            bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            hoverBg: '#DC2626',
            shadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
        },
        info: {
            bg: 'linear-gradient(135deg, #5B52E1 0%, #3B82F6 100%)',
            hoverBg: '#4A42C8',
            shadow: '0 4px 12px rgba(91, 82, 225, 0.25)'
        }
    }

    const config = typeConfigs[type]

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
            <div className="space-y-5">
                <p style={{ color: '#64748B' }}>{message}</p>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-medium border rounded-xl hover:bg-gray-50 focus:outline-none transition-all"
                        style={{
                            color: '#1E293B',
                            borderColor: '#E2E8F0',
                            background: '#F8FAFC'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm()
                            onClose()
                        }}
                        className="px-5 py-2.5 text-sm font-medium text-white rounded-xl focus:outline-none transition-all"
                        style={{
                            background: config.bg,
                            boxShadow: config.shadow
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    )
}