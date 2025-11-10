// fileName: ActionButtons.js
import React from 'react';
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

    const baseStyle = {
        bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
        icon: 'text-blue-600',
        shadow: 'shadow-slate-200',
        hover: 'hover:from-slate-100 hover:to-slate-200',
        ring: 'focus:ring-slate-300'
    };

    const variants = {
        view: { ...baseStyle, icon: 'text-blue-600' },
        add: { ...baseStyle, icon: 'text-blue-600' },
        edit: { ...baseStyle, icon: 'text-blue-600' },
        delete: { ...baseStyle, icon: 'text-blue-600' }, // Giữ Delete màu đỏ cho an toàn
        primary: { ...baseStyle, icon: 'text-blue-600' },
        secondary: { ...baseStyle, icon: 'text-blue-600' },
        success: { ...baseStyle, icon: 'text-blue-600' },
        warning: { ...baseStyle, icon: 'text-blue-600' },
        purple: { ...baseStyle, icon: 'text-blue-600' },
        pink: { ...baseStyle, icon: 'text-blue-600' },
        lock: { ...baseStyle, icon: 'text-blue-400' },

        // Thêm biến thể blue cho các nút mới theo yêu cầu
        blue: { ...baseStyle, icon: 'text-blue-600' },
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

    const currentVariant = variants[variant] || variants.primary;
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