export default function Footer({ collapsed, isDesktop }) {
    return (
        <footer
            className="bg-white border-t border-gray-200 mt-auto transition-all duration-300"
            style={{
                width: '100%',
                position: 'relative'
            }}
        >
            <div className="py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                             style={{ background: 'linear-gradient(135deg, #496cef 0%, #486aee 100%)' }}>
                            <span className="text-white font-bold text-sm">TĐG</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">CMC University</p>
                            <p className="text-xs text-gray-600">Hệ thống quản lý minh chứng</p>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0">
                        <p className="text-sm text-gray-600">
                            © 2025 CMC University. Made by Digital University PMU.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}