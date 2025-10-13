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
                          disabled = false,
                          title // Thêm prop title
                      }) => {
    const buttonTitle = title || label;

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
            ring: 'focus:ring-slate-300'
        },
        warning: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        purple: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        pink: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
        },
        lock: {
            bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
            icon: 'text-blue-600',
            shadow: 'shadow-slate-200',
            hover: 'hover:from-slate-100 hover:to-slate-200',
            ring: 'focus:ring-slate-300'
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
                title={buttonTitle}
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

export { ActionButton };