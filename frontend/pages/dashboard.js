// frontend/pages/dashboard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/common/Layout';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import ExpertDashboard from '../components/dashboard/ExpertDashboard';
import AdvisorDashboard from '../components/dashboard/AdvisorDashboard';
import {useInitData} from "../contexts/useInitData";

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const initData = useInitData(user)

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const renderDashboard = () => {
        switch(user.role) {
            case 'admin':
                return <AdminDashboard />;
            case 'manager':
                return <ManagerDashboard />;
            case 'reporter':
                return <ExpertDashboard />;
            case 'evaluator':
                return <AdvisorDashboard />;
            default:
                return <div>Dashboard not found for role: {user.role}</div>;
        }
    };

    return (
        <Layout>
            {renderDashboard()}
        </Layout>
    );
}