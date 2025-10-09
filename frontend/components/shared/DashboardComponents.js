import { TrendingUp, TrendingDown } from 'lucide-react';

// Stat Card Component
export const StatCard = ({ title, value, change, icon: Icon, color, trend, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {change && (
                        <div className="flex items-center mt-2">
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                            ) : trend === 'down' ? (
                                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                            ) : null}
                            <span className={`text-sm font-medium ${
                                trend === 'up' ? 'text-green-600' :
                                    trend === 'down' ? 'text-red-600' :
                                        'text-gray-600'
                            }`}>
                {change}
              </span>
                        </div>
                    )}
                </div>
                <div className={`${color} p-4 rounded-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>
            </div>
        </div>
    );
};

// Quick Action Component
export const QuickAction = ({ title, description, icon: Icon, color, onClick, href }) => {
    const Component = href ? 'a' : 'button';

    return (
        <Component
            href={href}
            onClick={onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all block w-full"
        >
            <div className={`${color} p-3 rounded-xl w-fit mb-4`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </Component>
    );
};

// Activity Item Component
export const ActivityItem = ({ action, user, time, type, metadata }) => {
    const getIcon = () => {
        switch(type) {
            case 'create':
            case 'user_create':
            case 'evidence_create':
                return { icon: 'Plus', color: 'text-blue-600', bg: 'bg-blue-50' };
            case 'update':
            case 'user_update':
            case 'evidence_update':
                return { icon: 'Edit', color: 'text-yellow-600', bg: 'bg-yellow-50' };
            case 'approve':
            case 'report_approve':
                return { icon: 'CheckCircle', color: 'text-green-600', bg: 'bg-green-50' };
            case 'reject':
            case 'report_reject':
                return { icon: 'XCircle', color: 'text-red-600', bg: 'bg-red-50' };
            case 'delete':
                return { icon: 'Trash2', color: 'text-red-600', bg: 'bg-red-50' };
            case 'login':
                return { icon: 'LogIn', color: 'text-green-600', bg: 'bg-green-50' };
            default:
                return { icon: 'Activity', color: 'text-gray-600', bg: 'bg-gray-50' };
        }
    };

    const iconConfig = getIcon();

    // Import icon dynamically
    const IconMap = {
        Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
        Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
        CheckCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        XCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        Trash2: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
        LogIn: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>,
        Activity: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    };

    const Icon = IconMap[iconConfig.icon] || IconMap.Activity;

    return (
        <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className={`p-2 rounded-lg ${iconConfig.bg}`}>
                <div className={iconConfig.color}>
                    <Icon />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{action}</p>
                {user && <p className="text-xs text-gray-600">{user}</p>}
                {metadata?.targetName && (
                    <p className="text-xs text-gray-500">{metadata.targetName}</p>
                )}
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
        </div>
    );
};

// Loading Skeleton
export const LoadingSkeleton = ({ count = 4 }) => (
    <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
        ))}
    </div>
);

// Empty State
export const EmptyState = ({ icon: Icon, title, description }) => (
    <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Icon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);