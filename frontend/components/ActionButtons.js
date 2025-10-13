import React from 'react';
import {
    Eye,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Copy,
    Shield,
    Send,
    UserPlus,
    Calendar,
    Settings,
    Download,
    Upload,
    Lock,
    Unlock,
    Archive,
    Star,
    Search,
    Filter,
    Check,
    X
} from 'lucide-react';

const ActionButton = ({
                          icon: Icon,
                          label,
                          onClick,
                          variant = 'primary',
                          size = 'md',
                          disabled = false
                      }) => {
    const variants = {
        view: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        add: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        edit: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        delete: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        primary: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        secondary: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        success: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-green-300'
        },
        warning: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-orange-300'
        },
        purple: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-purple-300'
        },
        pink: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-pink-300'
        }
    };

    const sizes = {
        sm: {
            button: 'w-10 h-10',
            icon: 16,
            text: 'text-xs'
        },
        md: {
            button: 'w-12 h-12',
            icon: 20,
            text: 'text-sm'
        },
        lg: {
            button: 'w-14 h-14',
            icon: 24,
            text: 'text-base'
        }
    };

    const currentVariant = variants[variant];
    const currentSize = sizes[size];

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`
          ${currentSize.button}
          ${currentVariant.bg}
          ${currentVariant.hover}
          ${currentVariant.shadow}
          rounded-xl
          shadow-lg
          flex items-center justify-center
          transition-all duration-300
          transform hover:scale-110 hover:shadow-xl
          active:scale-95
          focus:outline-none focus:ring-4 ${currentVariant.ring}
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          relative
          group
        `}
            >
                <div className={`
          absolute inset-0 rounded-xl 
          bg-white/40 
          opacity-0 group-hover:opacity-100 
          transition-opacity duration-300
        `} />
                <Icon
                    size={currentSize.icon}
                    className={`${currentVariant.icon} relative z-10 drop-shadow-sm`}
                    strokeWidth={2.5}
                />
            </button>
            {label && (
                <span className={`${currentSize.text} font-medium text-gray-700 text-center`}>
          {label}
        </span>
            )}
        </div>
    );
};

// Demo Component với tất cả các buttons
const ActionButtonsDemo = () => {
    const buttons = [
        { icon: Eye, label: 'Xem', variant: 'view', onClick: () => console.log('View') },
        { icon: Plus, label: 'Thêm', variant: 'add', onClick: () => console.log('Add') },
        { icon: Edit, label: 'Sửa', variant: 'edit', onClick: () => console.log('Edit') },
        { icon: Trash2, label: 'Xóa', variant: 'delete', onClick: () => console.log('Delete') },
        { icon: RefreshCw, label: 'Chuyển đổi', variant: 'primary', onClick: () => console.log('Switch') },
        { icon: Copy, label: 'Sao chép', variant: 'secondary', onClick: () => console.log('Copy') },
        { icon: Shield, label: 'Phân quyền', variant: 'purple', onClick: () => console.log('Permission') },
        { icon: Send, label: 'Xuất bản', variant: 'success', onClick: () => console.log('Publish') },
        { icon: UserPlus, label: 'Thêm người', variant: 'add', onClick: () => console.log('Add User') },
        { icon: Calendar, label: 'Đặt lịch', variant: 'primary', onClick: () => console.log('Schedule') },
        { icon: Settings, label: 'Cấu hình', variant: 'secondary', onClick: () => console.log('Settings') },
        { icon: Download, label: 'Tải xuống', variant: 'success', onClick: () => console.log('Download') },
        { icon: Upload, label: 'Tải lên', variant: 'warning', onClick: () => console.log('Upload') },
        { icon: Lock, label: 'Khóa', variant: 'delete', onClick: () => console.log('Lock') },
        { icon: Unlock, label: 'Mở khóa', variant: 'success', onClick: () => console.log('Unlock') },
        { icon: Archive, label: 'Lưu trữ', variant: 'secondary', onClick: () => console.log('Archive') },
        { icon: Star, label: 'Yêu thích', variant: 'warning', onClick: () => console.log('Favorite') },
        { icon: Search, label: 'Tìm kiếm', variant: 'primary', onClick: () => console.log('Search') },
        { icon: Filter, label: 'Lọc', variant: 'purple', onClick: () => console.log('Filter') },
        { icon: Check, label: 'Duyệt', variant: 'success', onClick: () => console.log('Approve') },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Action Buttons Collection
                    </h1>
                    <p className="text-gray-600">
                        Beautiful and modern action buttons for your Next.js application
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">All Actions</h2>
                    <div className="grid grid-cols-5 gap-8">
                        {buttons.map((button, index) => (
                            <ActionButton key={index} {...button} />
                        ))}
                    </div>
                </div>

                {/* Size Variations */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Size Variations</h2>
                    <div className="flex items-end gap-8 justify-center">
                        <ActionButton icon={Eye} label="Small" variant="view" size="sm" />
                        <ActionButton icon={Edit} label="Medium" variant="edit" size="md" />
                        <ActionButton icon={Trash2} label="Large" variant="delete" size="lg" />
                    </div>
                </div>

                {/* Color Palette */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Color Palette</h2>
                    <div className="grid grid-cols-5 gap-8">
                        <ActionButton icon={Eye} label="View" variant="view" />
                        <ActionButton icon={Plus} label="Add" variant="add" />
                        <ActionButton icon={Edit} label="Edit" variant="edit" />
                        <ActionButton icon={Trash2} label="Delete" variant="delete" />
                        <ActionButton icon={Settings} label="Primary" variant="primary" />
                        <ActionButton icon={Copy} label="Secondary" variant="secondary" />
                        <ActionButton icon={Check} label="Success" variant="success" />
                        <ActionButton icon={Star} label="Warning" variant="warning" />
                        <ActionButton icon={Shield} label="Purple" variant="purple" />
                        <ActionButton icon={UserPlus} label="Pink" variant="pink" />
                    </div>
                </div>

                {/* Usage Example */}
                <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                    <h2 className="text-2xl font-semibold mb-4">Usage Example</h2>
                    <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
            <code>{`<ActionButton 
  icon={Edit} 
  label="Sửa" 
  variant="edit" 
  size="md"
  onClick={() => handleEdit()}
/>`}</code>
          </pre>
                </div>
            </div>
        </div>
    );
};

export { ActionButton, ActionButtonsDemo };
export default ActionButtonsDemo;