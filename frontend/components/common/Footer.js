export function Footer() {
    return (
        <footer className="bg-white border-t mt-auto" style={{ borderColor: '#E2E8F0' }}>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                            <span className="text-white font-bold">V</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#1E293B' }}>CMC University</p>
                            <p className="text-xs" style={{ color: '#64748B' }}>Hệ thống quản lý minh chứng</p>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-0">
                        <p className="text-sm" style={{ color: '#64748B' }}>
                            © 2025 CMC University. Made by Digital University PMU.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}