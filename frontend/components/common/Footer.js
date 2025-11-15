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
                    {/* Logo + Text */}
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-white">
                            <img
                                src="/images/CMC_logo_ver01.png"
                                alt="CMC University Logo"
                                className="w-7 h-7 object-contain"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#1D4ED8' }}>
                                CMC University
                            </p>
                            <p className="text-xs text-gray-600">
                                SAEM – Hệ thống đánh giá chất lượng giáo dục
                            </p>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="mt-4 md:mt-0 text-center md:text-right">
                        <p className="text-sm text-gray-600">
                            © 2025 CMC University. Made by Digital University PMU.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}