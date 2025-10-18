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
    X,
    CheckCircle,
    AlertCircle,
    BookOpen,
    Play
} from 'lucide-react';

const ActionButton = ({
                          icon: Icon,
                          label,
                          onClick,
                          variant = 'primary',
                          size = 'md',
                          disabled = false,
                          title
                      }) => {
    const buttonTitle = title || label;

    // All buttons BLUE ONLY - Locked color, no permission to change
    const variants = {
        view: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        edit: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        delete: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        primary: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        secondary: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        success: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        warning: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        danger: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        purple: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        },
        add: {
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border border-blue-200',
            icon: 'text-blue-600',
            shadow: 'shadow-sm hover:shadow-md',
            ring: 'focus:ring-blue-400'
        }
    };

    const sizes = {
        sm: {
            button: 'w-9 h-9 p-1.5',
            icon: 18,
            text: 'text-xs'
        },
        md: {
            button: 'w-10 h-10 p-2',
            icon: 20,
            text: 'text-sm'
        },
        lg: {
            button: 'w-12 h-12 p-2.5',
            icon: 24,
            text: 'text-base'
        }
    };

    const currentVariant = variants[variant] || variants.primary;
    const currentSize = sizes[size] || sizes.md;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={buttonTitle}
            className={`
                ${currentSize.button}
                ${currentVariant.bg}
                ${currentVariant.border}
                ${currentVariant.shadow}
                rounded-lg
                flex items-center justify-center
                transition-all duration-200
                transform hover:scale-105
                active:scale-95
                focus:outline-none focus:ring-2 ${currentVariant.ring}
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                group relative
            `}
        >
            <Icon
                size={currentSize.icon}
                className={`${currentVariant.icon} transition-all duration-200`}
                strokeWidth={2}
            />
            {label && (
                <span className={`
                    ${currentSize.text}
                    font-medium
                    text-gray-700
                    group-hover:text-gray-900
                    hidden xl:inline ml-2
                    transition-colors duration-200
                `}>
                    {label}
                </span>
            )}
        </button>
    );
};

export { ActionButton };