import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/common/Layout';
import api, { apiMethods } from '../../services/api';
import { Loader2, Calendar, User, FileText, MessageSquare, ExternalLink, Clock, Send, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssignmentViewPage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isLoading } = useAuth();
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);

    const breadcrumbItems = [
        { name: 'Phân quyền', path: '/assignments/my-assignments' },
        { name: assignment?.reportId?.code || 'Chi tiết', path: router.asPath }
    ];

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (id && user) {
            fetchAssignment();
        }
    }, [id, user]);

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            const res = await apiMethods.assignments.getById(id);
            const assignmentData = res.data.data;
            setAssignment(assignmentData);

            if (user.role === 'expert' && assignmentData.evaluatorId?._id === user.id) {
                const existingEvalRes = await apiMethods.evaluations.getAll({ assignmentId: id, limit: 1 });
                const existingEval = existingEvalRes.data?.data?.evaluations?.[0];

                if (existingEval) {
                    toast.info('Bạn đang được chuyển hướng đến bài đánh giá hiện tại của mình.', { duration: 4000 });

                    const targetPath = existingEval.status === 'draft'
                        ? `/evaluations/${existingEval._id}/edit`
                        : `/evaluations/${existingEval._id}`;

                    router.replace(targetPath);
                    return;
                } else if (['accepted', 'in_progress'].includes(assignmentData.status)) {
                    toast.info('Assignment đã được phân công. Bắt đầu khởi tạo đánh giá...', { duration: 4000 });
                    router.replace(`/evaluations/create?assignmentId=${id}&reportId=${assignmentData.reportId._id}`);
                    return;
                }
            }

        } catch (error) {
            console.error('Fetch assignment error:', error);
            toast.error(error.response?.data?.message || 'Không thể tải phân quyền');
            if (error.response?.status === 403) {
                setTimeout(() => router.back(), 1000);
            }
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || loading) {
        return (
            <Layout title="Chi tiết Phân quyền" breadcrumbItems={breadcrumbItems}>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </Layout>
        )
    }

    if (!assignment) {
        return (
            <Layout title="Chi tiết Phân quyền" breadcrumbItems={breadcrumbItems}>
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <h3 className="text-red-800 font-bold">Không tìm thấy</h3>
                    <p className="text-red-600">Phân quyền này không tồn tại hoặc bạn không có quyền xem.</p>
                </div>
            </Layout>
        )
    }

    const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin';

    return (
        <Layout title="Chi tiết Phân quyền" breadcrumbItems={breadcrumbItems}>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                    <h1 className="text-2xl font-bold mb-1">
                        Phân quyền: {assignment.reportId?.code}
                    </h1>
                    <p className="text-blue-100">{assignment.reportId?.title}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Trạng thái hiện tại</p>
                    <div className="flex items-center justify-between">
                        <span className={`text-xl font-bold ${assignment.status === 'completed' ? 'text-green-600' : assignment.status === 'overdue' ? 'text-red-600' : 'text-blue-600'}`}>
                            {assignment.statusText || assignment.status}
                        </span>

                        {isManagerOrAdmin && assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
                            <button
                                onClick={() => router.push(`/reports/assignments/${id}/edit`)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center"
                            >
                                <Edit className='w-4 h-4 mr-2' /> Chỉnh sửa phân quyền
                            </button>
                        )}
                        {isManagerOrAdmin && assignment.status === 'completed' && assignment.evaluationId && (
                            <button
                                onClick={() => router.push(`/evaluations/${assignment.evaluationId}`)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center"
                            >
                                <ExternalLink className='w-4 h-4 mr-2' /> Xem bài đánh giá
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailCard icon={Calendar} title="Hạn chót" value={new Date(assignment.deadline).toLocaleDateString('vi-VN')} />
                    <DetailCard icon={FileText} title="Báo cáo" value={assignment.reportId?.title} link={`/reports/${assignment.reportId?._id}`}/>
                    <DetailCard icon={User} title="Người đánh giá" value={assignment.evaluatorId?.fullName} />
                    <DetailCard icon={User} title="Người phân công" value={assignment.assignedBy?.fullName} />
                </div>

                {assignment.assignmentNote && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
                            Ghi chú phân công
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{assignment.assignmentNote}</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}

const DetailCard = ({ icon: Icon, title, value, link }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
        <Icon className="h-6 w-6 text-gray-500 mb-3" />
        <p className="text-sm font-semibold text-gray-600">{title}</p>
        {link ? (
            <a href={link} className="text-lg font-bold text-blue-600 hover:text-blue-700 flex items-center">
                {value} <ExternalLink className='w-4 h-4 ml-2'/>
            </a>
        ) : (
            <p className="text-lg font-bold text-gray-900">{value}</p>
        )}
    </div>
);