import {
    EVIDENCE_STATUS_LABELS,
    EVIDENCE_STATUS_COLORS,
    USER_ROLE_LABELS,
    FILE_TYPE_LABELS
} from './constants'

// Date formatting
export const formatDate = (date, options = {}) => {
    if (!date) return ''

    const {
        format = 'short', // 'short', 'long', 'time', 'datetime', 'relative'
        locale = 'vi-VN'
    } = options

    const dateObj = new Date(date)

    if (isNaN(dateObj.getTime())) return ''

    switch (format) {
        case 'short':
            return dateObj.toLocaleDateString(locale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })

        case 'long':
            return dateObj.toLocaleDateString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })

        case 'time':
            return dateObj.toLocaleTimeString(locale, {
                hour: '2-digit',
                minute: '2-digit'
            })

        case 'datetime':
            return dateObj.toLocaleString(locale, {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })

        case 'relative':
            return formatRelativeTime(dateObj)

        default:
            return dateObj.toLocaleDateString(locale)
    }
}

export const formatRelativeTime = (date) => {
    if (!date) return ''

    const now = new Date()
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000)

    if (diffInSeconds < 60) return 'Vừa xong'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} tháng trước`

    return `${Math.floor(diffInSeconds / 31536000)} năm trước`
}

export const formatTimeAgo = (date) => {
    return formatRelativeTime(date)
}

// Number formatting
export const formatNumber = (number, options = {}) => {
    if (number == null || isNaN(number)) return '0'

    const {
        locale = 'vi-VN',
        minimumFractionDigits = 0,
        maximumFractionDigits = 2
    } = options

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits
    }).format(number)
}

export const formatCurrency = (amount, options = {}) => {
    if (amount == null || isNaN(amount)) return '0 ₫'

    const {
        currency = 'VND',
        locale = 'vi-VN'
    } = options

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
    }).format(amount)
}

export const formatPercentage = (value, options = {}) => {
    if (value == null || isNaN(value)) return '0%'

    const {
        decimals = 1,
        locale = 'vi-VN'
    } = options

    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value / 100)
}

export const formatCompactNumber = (number) => {
    if (number == null || isNaN(number)) return '0'

    const formatter = new Intl.NumberFormat('vi-VN', {
        notation: 'compact',
        compactDisplay: 'short'
    })

    return formatter.format(number)
}

// File size formatting
export const formatFileSize = (bytes, options = {}) => {
    if (bytes === 0) return '0 B'
    if (!bytes || bytes < 0) return ''

    const { decimals = 2, binary = false } = options
    const base = binary ? 1024 : 1000
    const units = binary
        ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
        : ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

    const index = Math.floor(Math.log(bytes) / Math.log(base))
    const size = bytes / Math.pow(base, index)

    return `${size.toFixed(decimals)} ${units[index]}`
}

// Text formatting
export const formatText = (text, options = {}) => {
    if (!text) return ''

    const {
        maxLength,
        ellipsis = '...',
        case: textCase
    } = options

    let formattedText = text.toString()

    // Apply case transformation
    switch (textCase) {
        case 'upper':
            formattedText = formattedText.toUpperCase()
            break
        case 'lower':
            formattedText = formattedText.toLowerCase()
            break
        case 'title':
            formattedText = formattedText.replace(/\w\S*/g, (txt) =>
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            )
            break
        case 'sentence':
            formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1).toLowerCase()
            break
    }

    // Apply length limit
    if (maxLength && formattedText.length > maxLength) {
        formattedText = formattedText.substring(0, maxLength - ellipsis.length) + ellipsis
    }

    return formattedText
}

export const formatName = (firstName, lastName, options = {}) => {
    const { format = 'full' } = options

    if (!firstName && !lastName) return ''

    switch (format) {
        case 'first':
            return firstName || ''
        case 'last':
            return lastName || ''
        case 'initials':
            return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
        case 'lastFirst':
            return `${lastName || ''} ${firstName || ''}`.trim()
        default: // 'full'
            return `${firstName || ''} ${lastName || ''}`.trim()
    }
}

export const formatInitials = (name) => {
    if (!name) return ''

    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// Status formatting
export const formatStatus = (status, type = 'evidence') => {
    if (!status) return { label: '', color: '' }

    switch (type) {
        case 'evidence':
            return {
                label: EVIDENCE_STATUS_LABELS[status] || status,
                color: EVIDENCE_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-800' }
            }
        case 'user':
            return {
                label: USER_ROLE_LABELS[status] || status,
                color: getUserRoleColor(status)
            }
        default:
            return { label: status, color: { bg: 'bg-gray-100', text: 'text-gray-800' } }
    }
}

const getUserRoleColor = (role) => {
    const colors = {
        admin: { bg: 'bg-purple-100', text: 'text-purple-800' },
        manager: { bg: 'bg-blue-100', text: 'text-blue-800' },
        staff: { bg: 'bg-green-100', text: 'text-green-800' },
        viewer: { bg: 'bg-gray-100', text: 'text-gray-800' }
    }

    return colors[role] || { bg: 'bg-gray-100', text: 'text-gray-800' }
}

export const formatBadge = (status, type = 'evidence') => {
    const { label, color } = formatStatus(status, type)

    return {
        label,
        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`
    }
}

// File type formatting
export const formatFileType = (filename) => {
    if (!filename) return ''

    const extension = filename.split('.').pop()?.toLowerCase()
    return FILE_TYPE_LABELS[`application/${extension}`] ||
        FILE_TYPE_LABELS[`image/${extension}`] ||
        extension?.toUpperCase() || 'FILE'
}

export const getFileIcon = (filename) => {
    if (!filename) return 'File'

    const extension = filename.split('.').pop()?.toLowerCase()

    const iconMap = {
        // Documents
        pdf: 'FileText',
        doc: 'FileText',
        docx: 'FileText',
        txt: 'FileText',

        // Spreadsheets
        xls: 'FileSpreadsheet',
        xlsx: 'FileSpreadsheet',
        csv: 'FileSpreadsheet',

        // Presentations
        ppt: 'FileBarChart',
        pptx: 'FileBarChart',

        // Images
        jpg: 'Image',
        jpeg: 'Image',
        png: 'Image',
        gif: 'Image',
        svg: 'Image',
        webp: 'Image',

        // Archives
        zip: 'Archive',
        rar: 'Archive',
        '7z': 'Archive',
        tar: 'Archive',
        gz: 'Archive',

        // Code
        js: 'Code',
        jsx: 'Code',
        ts: 'Code',
        tsx: 'Code',
        html: 'Code',
        css: 'Code',
        json: 'Code',

        // Video
        mp4: 'Video',
        avi: 'Video',
        mov: 'Video',
        mkv: 'Video',

        // Audio
        mp3: 'Music',
        wav: 'Music',
        flac: 'Music'
    }

    return iconMap[extension] || 'File'
}

// Evidence code formatting
export const formatEvidenceCode = (code) => {
    if (!code) return ''

    // Format: H1.01.02.03 -> H1.01.02.03
    // Add visual separation or validation
    const match = code.match(/^H(\d+)\.(\d+)\.(\d+)\.(\d+)$/)

    if (match) {
        const [, box, standard, criteria, sequence] = match
        return `H${box}.${standard.padStart(2, '0')}.${criteria.padStart(2, '0')}.${sequence.padStart(2, '0')}`
    }

    return code
}

export const parseEvidenceCode = (code) => {
    if (!code) return null

    const match = code.match(/^H(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (!match) return null

    return {
        box: parseInt(match[1], 10),
        standard: parseInt(match[2], 10),
        criteria: parseInt(match[3], 10),
        sequence: parseInt(match[4], 10),
        display: code
    }
}

// Address formatting
export const formatAddress = (address, options = {}) => {
    if (!address) return ''

    const { maxLength, format = 'full' } = options

    if (typeof address === 'string') {
        let formatted = address.trim()

        if (maxLength && formatted.length > maxLength) {
            formatted = formatted.substring(0, maxLength - 3) + '...'
        }

        return formatted
    }

    // If address is an object with separate fields
    const { street, ward, district, city, country } = address

    let parts = []

    switch (format) {
        case 'short':
            if (district) parts.push(district)
            if (city) parts.push(city)
            break
        case 'medium':
            if (street) parts.push(street)
            if (district) parts.push(district)
            if (city) parts.push(city)
            break
        default: // 'full'
            if (street) parts.push(street)
            if (ward) parts.push(ward)
            if (district) parts.push(district)
            if (city) parts.push(city)
            if (country && country !== 'Vietnam' && country !== 'Việt Nam') {
                parts.push(country)
            }
    }

    let formatted = parts.join(', ')

    if (maxLength && formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength - 3) + '...'
    }

    return formatted
}

// Phone number formatting
export const formatPhone = (phone, options = {}) => {
    if (!phone) return ''

    const { format = 'national', country = 'VN' } = options

    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')

    if (country === 'VN') {
        if (digits.length === 10) {
            // Mobile: 0912 345 678
            if (digits.startsWith('0')) {
                return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
            }
        } else if (digits.length === 11) {
            // Landline: 024 3827 6554
            return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
        }
    }

    return phone
}

// Email formatting
export const formatEmail = (email, options = {}) => {
    if (!email) return ''

    const { maxLength, maskDomain = false } = options

    let formatted = email.toLowerCase().trim()

    if (maskDomain) {
        const [local, domain] = formatted.split('@')
        if (domain) {
            const domainParts = domain.split('.')
            const maskedDomain = domainParts.map((part, index) =>
                index === domainParts.length - 1 ? part : '*'.repeat(part.length)
            ).join('.')
            formatted = `${local}@${maskedDomain}`
        }
    }

    if (maxLength && formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength - 3) + '...'
    }

    return formatted
}

// URL formatting
export const formatUrl = (url, options = {}) => {
    if (!url) return ''

    const { removeProtocol = false, maxLength } = options

    let formatted = url.trim()

    if (removeProtocol) {
        formatted = formatted.replace(/^https?:\/\//, '')
    }

    if (maxLength && formatted.length > maxLength) {
        formatted = formatted.substring(0, maxLength - 3) + '...'
    }

    return formatted
}

// List formatting
export const formatList = (items, options = {}) => {
    if (!items || !Array.isArray(items)) return ''

    const {
        separator = ', ',
        lastSeparator = ' và ',
        maxItems,
        moreText = 'và {count} khác'
    } = options

    let displayItems = [...items]
    let hasMore = false

    if (maxItems && items.length > maxItems) {
        displayItems = items.slice(0, maxItems)
        hasMore = true
    }

    let result = ''

    if (displayItems.length === 1) {
        result = displayItems[0]
    } else if (displayItems.length === 2) {
        result = displayItems.join(lastSeparator)
    } else if (displayItems.length > 2) {
        result = displayItems.slice(0, -1).join(separator) + lastSeparator + displayItems[displayItems.length - 1]
    }

    if (hasMore) {
        const remainingCount = items.length - maxItems
        result += separator + moreText.replace('{count}', remainingCount)
    }

    return result
}

// Duration formatting
export const formatDuration = (seconds, options = {}) => {
    if (!seconds || seconds < 0) return '0 giây'

    const { format = 'auto', showSeconds = true } = options

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    const parts = []

    if (hours > 0) parts.push(`${hours} giờ`)
    if (minutes > 0) parts.push(`${minutes} phút`)
    if (showSeconds && (remainingSeconds > 0 || parts.length === 0)) {
        parts.push(`${remainingSeconds} giây`)
    }

    return parts.join(' ')
}

// Range formatting
export const formatRange = (min, max, unit = '') => {
    if (min == null && max == null) return ''
    if (min == null) return `≤ ${formatNumber(max)} ${unit}`.trim()
    if (max == null) return `≥ ${formatNumber(min)} ${unit}`.trim()
    if (min === max) return `${formatNumber(min)} ${unit}`.trim()

    return `${formatNumber(min)} - ${formatNumber(max)} ${unit}`.trim()
}