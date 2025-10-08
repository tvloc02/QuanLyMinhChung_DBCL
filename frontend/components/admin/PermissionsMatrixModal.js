import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'

export default function PermissionsMatrixModal({ group, onClose, onSave }) {
    // Danh sách các chức năng đồng bộ từ Sidebar
    const menuItems = [
        { id: 'dashboard', name: 'Trang chủ', hasView: true, hasCreate: false, hasUpdate: false, hasDelete: false },
        { id: 'academic_years', name: 'Quản lý năm học', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'programs', name: 'Chương trình đánh giá', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'organizations', name: 'Tổ chức đánh giá', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'standards', name: 'Tiêu chuẩn', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'criteria', name: 'Tiêu chí', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'evidence', name: 'Quản lý minh chứng', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'files', name: 'Quản lý files', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'reports', name: 'Báo cáo TĐG', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'assignments', name: 'Phân công đánh giá', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'evaluations', name: 'Kết quả đánh giá', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'users', name: 'Quản lý người dùng', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'user_groups', name: 'Nhóm người dùng', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'permissions', name: 'Phân quyền hệ thống', hasView: true, hasCreate: true, hasUpdate: true, hasDelete: true },
        { id: 'notifications', name: 'Thông báo', hasView: true, hasCreate: false, hasUpdate: false, hasDelete: true },
        { id: 'analytics', name: 'Thống kê & Báo cáo', hasView: true, hasCreate: false, hasUpdate: false, hasDelete: false },
        { id: 'logs', name: 'Nhật ký hoạt động', hasView: true, hasCreate: false, hasUpdate: false, hasDelete: false },
        { id: 'system', name: 'Cấu hình hệ thống', hasView: true, hasCreate: false, hasUpdate: true, hasDelete: false },
    ]

    // State quản lý permissions - khởi tạo từ group.permissions nếu có
    const [permissions, setPermissions] = useState(() => {
        const initial = {}
        menuItems.forEach(item => {
            // Nếu group có permissions sẵn, load từ đó
            const existingPerm = group?.permissions?.find(p => p.menuId === item.id || p.resource === item.id)

            initial[item.id] = {
                view: existingPerm?.view || existingPerm?.actions?.includes('view') || false,
                create: existingPerm?.create || existingPerm?.actions?.includes('create') || false,
                update: existingPerm?.update || existingPerm?.actions?.includes('update') || false,
                delete: existingPerm?.delete || existingPerm?.actions?.includes('delete') || false
            }
        })
        return initial
    })

    // Toggle permission với logic phụ thuộc
    const togglePermission = (menuId, permType) => {
        const menu = menuItems.find(m => m.id === menuId)

        setPermissions(prev => {
            const currentPerm = prev[menuId]
            const newValue = !currentPerm[permType]

            // Nếu bỏ tích VIEW, tự động bỏ tất cả các quyền khác
            if (permType === 'view' && !newValue) {
                return {
                    ...prev,
                    [menuId]: {
                        view: false,
                        create: false,
                        update: false,
                        delete: false
                    }
                }
            }

            // Nếu tích CREATE/UPDATE/DELETE, tự động tích VIEW
            if (permType !== 'view' && newValue) {
                return {
                    ...prev,
                    [menuId]: {
                        ...currentPerm,
                        view: true, // Tự động tích VIEW
                        [permType]: newValue
                    }
                }
            }

            // Trường hợp bình thường
            return {
                ...prev,
                [menuId]: {
                    ...currentPerm,
                    [permType]: newValue
                }
            }
        })
    }

    // Toggle tất cả permissions cho một menu
    const toggleAllForMenu = (menuId) => {
        const menu = menuItems.find(m => m.id === menuId)
        const currentPerms = permissions[menuId]

        // Check nếu tất cả đã được tích
        const allChecked = currentPerms.view &&
            (menu.hasCreate ? currentPerms.create : true) &&
            (menu.hasUpdate ? currentPerms.update : true) &&
            (menu.hasDelete ? currentPerms.delete : true)

        setPermissions(prev => ({
            ...prev,
            [menuId]: {
                view: !allChecked,
                create: menu.hasCreate ? !allChecked : false,
                update: menu.hasUpdate ? !allChecked : false,
                delete: menu.hasDelete ? !allChecked : false
            }
        }))
    }

    // Toggle tất cả permissions cho một loại (view/create/update/delete)
    const toggleAllForType = (permType) => {
        const allChecked = menuItems.every(item => {
            if (permType === 'create' && !item.hasCreate) return true
            if (permType === 'update' && !item.hasUpdate) return true
            if (permType === 'delete' && !item.hasDelete) return true
            return permissions[item.id][permType]
        })

        const newPermissions = { ...permissions }
        menuItems.forEach(item => {
            // Nếu đang tích tất cả
            if (!allChecked) {
                if (permType === 'view') {
                    newPermissions[item.id] = {
                        ...newPermissions[item.id],
                        view: true
                    }
                } else if (
                    (permType === 'create' && item.hasCreate) ||
                    (permType === 'update' && item.hasUpdate) ||
                    (permType === 'delete' && item.hasDelete)
                ) {
                    newPermissions[item.id] = {
                        ...newPermissions[item.id],
                        view: true, // Tự động tích view
                        [permType]: true
                    }
                }
            } else {
                // Nếu đang bỏ tích tất cả
                if (permType === 'view') {
                    // Bỏ tích view thì bỏ tất cả
                    newPermissions[item.id] = {
                        view: false,
                        create: false,
                        update: false,
                        delete: false
                    }
                } else if (
                    (permType === 'create' && item.hasCreate) ||
                    (permType === 'update' && item.hasUpdate) ||
                    (permType === 'delete' && item.hasDelete)
                ) {
                    newPermissions[item.id] = {
                        ...newPermissions[item.id],
                        [permType]: false
                    }
                }
            }
        })
        setPermissions(newPermissions)
    }

    const handleSave = () => {
        onSave(permissions)
    }

    // Đếm số quyền đã chọn
    const countSelectedPermissions = () => {
        let count = 0
        Object.values(permissions).forEach(perm => {
            if (perm.view) count++
            if (perm.create) count++
            if (perm.update) count++
            if (perm.delete) count++
        })
        return count
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Phân quyền nhóm người dùng {group?.name || ''}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Thiết lập quyền truy cập cho từng chức năng • Đã chọn: <span className="font-semibold text-purple-600">{countSelectedPermissions()} quyền</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Info Banner */}
                <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">⚠️ Lưu ý:</span> Quyền "Hiển thị" là bắt buộc để xem menu. Nếu không có quyền "Hiển thị", người dùng sẽ không thấy mục này khi đăng nhập.
                    </p>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto px-6 py-4">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                                Tên chức năng / Tên sổ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 w-32">
                                <button
                                    onClick={() => toggleAllForType('view')}
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    Hiển thị
                                </button>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 w-32">
                                <button
                                    onClick={() => toggleAllForType('create')}
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    Thêm
                                </button>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 w-32">
                                <button
                                    onClick={() => toggleAllForType('update')}
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    Sửa
                                </button>
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 w-32">
                                <button
                                    onClick={() => toggleAllForType('delete')}
                                    className="hover:text-blue-600 transition-colors"
                                >
                                    Xóa
                                </button>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {menuItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleAllForMenu(item.id)}
                                            className="w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors flex items-center justify-center"
                                        >
                                            {permissions[item.id].view && (
                                                <Check className="w-3 h-3 text-blue-600" />
                                            )}
                                        </button>
                                        <span className="text-sm text-gray-700">{item.name}</span>
                                    </div>
                                </td>

                                {/* Hiển thị - Quyền cơ bản */}
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => togglePermission(item.id, 'view')}
                                        className={`w-6 h-6 rounded border-2 transition-all ${
                                            permissions[item.id].view
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300 hover:border-blue-400'
                                        }`}
                                        title={permissions[item.id].view ? 'Bỏ quyền hiển thị (sẽ bỏ tất cả quyền khác)' : 'Cho phép hiển thị menu'}
                                    >
                                        {permissions[item.id].view && (
                                            <Check className="w-4 h-4 text-white mx-auto" />
                                        )}
                                    </button>
                                </td>

                                {/* Thêm */}
                                <td className="px-4 py-3 text-center">
                                    {item.hasCreate ? (
                                        <button
                                            onClick={() => togglePermission(item.id, 'create')}
                                            className={`w-6 h-6 rounded border-2 transition-all ${
                                                permissions[item.id].create
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : permissions[item.id].view
                                                        ? 'border-gray-300 hover:border-blue-400'
                                                        : 'border-gray-200 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!permissions[item.id].view}
                                            title={!permissions[item.id].view ? 'Cần có quyền hiển thị trước' : 'Cho phép thêm mới'}
                                        >
                                            {permissions[item.id].create && (
                                                <Check className="w-4 h-4 text-white mx-auto" />
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </td>

                                {/* Sửa */}
                                <td className="px-4 py-3 text-center">
                                    {item.hasUpdate ? (
                                        <button
                                            onClick={() => togglePermission(item.id, 'update')}
                                            className={`w-6 h-6 rounded border-2 transition-all ${
                                                permissions[item.id].update
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : permissions[item.id].view
                                                        ? 'border-gray-300 hover:border-blue-400'
                                                        : 'border-gray-200 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!permissions[item.id].view}
                                            title={!permissions[item.id].view ? 'Cần có quyền hiển thị trước' : 'Cho phép chỉnh sửa'}
                                        >
                                            {permissions[item.id].update && (
                                                <Check className="w-4 h-4 text-white mx-auto" />
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </td>

                                {/* Xóa */}
                                <td className="px-4 py-3 text-center">
                                    {item.hasDelete ? (
                                        <button
                                            onClick={() => togglePermission(item.id, 'delete')}
                                            className={`w-6 h-6 rounded border-2 transition-all ${
                                                permissions[item.id].delete
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : permissions[item.id].view
                                                        ? 'border-gray-300 hover:border-blue-400'
                                                        : 'border-gray-200 cursor-not-allowed opacity-50'
                                            }`}
                                            disabled={!permissions[item.id].view}
                                            title={!permissions[item.id].view ? 'Cần có quyền hiển thị trước' : 'Cho phép xóa'}
                                        >
                                            {permissions[item.id].delete && (
                                                <Check className="w-4 h-4 text-white mx-auto" />
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-gray-300">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">Tổng số quyền đã chọn:</span> {countSelectedPermissions()} quyền
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                        >
                            Đóng
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}