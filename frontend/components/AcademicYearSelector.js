import React, { useState, useEffect } from 'react'
import {
    Select,
    Button,
    Badge,
    Tooltip,
    Modal,
    Form,
    Input,
    DatePicker,
    InputNumber,
    Switch,
    Space,
    Alert,
    Divider,
    Card,
    Row,
    Col,
    Statistic,
    message
} from 'antd'
import {
    CalendarOutlined,
    SwapOutlined,
    SettingOutlined,
    InfoCircleOutlined,
    CopyOutlined,
    CheckCircleOutlined
} from '@ant-design/icons'
import {
    useAcademicYearContext,
    formatAcademicYearName,
    getAcademicYearStatusColor,
    getAcademicYearStatusText,
    canSwitchAcademicYear,
    validateAcademicYearDates,
    generateAcademicYearCode,
    generateAcademicYearName,
    getNextAcademicYearSuggestion,
    academicYearAPI
} from '../utils/academicYear'
import { useAuth } from '../hooks/useAuth'

const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

/**
 * Academic Year Selector Component
 * Shows current academic year and allows switching for admin/manager
 */
export const AcademicYearSelector = ({ showManagement = false, size = 'default' }) => {
    const { user } = useAuth()
    const {
        currentYear,
        selectedYear,
        availableYears,
        effectiveYear,
        switchYear,
        clearSelection
    } = useAcademicYearContext()

    const [managementVisible, setManagementVisible] = useState(false)

    const canSwitch = canSwitchAcademicYear(user)

    const handleYearChange = (yearId) => {
        if (!yearId) {
            clearSelection()
            return
        }

        const year = availableYears.find(y => y._id === yearId)
        if (year) {
            switchYear(year)
            message.success(`Đã chuyển sang ${formatAcademicYearName(year)}`)
        }
    }

    const getSelectValue = () => {
        if (selectedYear) return selectedYear._id
        return 'current'
    }

    if (!effectiveYear) {
        return (
            <Alert
                message="Chưa có năm học nào được thiết lập"
                description="Vui lòng liên hệ quản trị viên để thiết lập năm học"
                type="warning"
                showIcon
            />
        )
    }

    return (
        <Space size="middle">
            <Space>
                <CalendarOutlined />
                <span>Năm học:</span>

                {canSwitch ? (
                    <Select
                        value={getSelectValue()}
                        onChange={handleYearChange}
                        style={{ minWidth: 200 }}
                        size={size}
                        placeholder="Chọn năm học"
                    >
                        <Option value="current">
                            <Space>
                                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                {formatAcademicYearName(currentYear)}
                                <Badge status="processing" text="Hiện tại" />
                            </Space>
                        </Option>
                        <Divider style={{ margin: '4px 0' }} />
                        {availableYears
                            .filter(year => year._id !== currentYear?._id)
                            .map(year => (
                                <Option key={year._id} value={year._id}>
                                    <Space>
                                        <Badge
                                            status={getAcademicYearStatusColor(year.status)}
                                            text={formatAcademicYearName(year)}
                                        />
                                    </Space>
                                </Option>
                            ))}
                    </Select>
                ) : (
                    <Badge
                        status={getAcademicYearStatusColor(effectiveYear.status)}
                        text={formatAcademicYearName(effectiveYear)}
                    />
                )}

                {selectedYear && (
                    <Tooltip title="Bạn đang xem dữ liệu của năm học khác">
                        <Badge status="warning" />
                    </Tooltip>
                )}
            </Space>

            {showManagement && canSwitch && (
                <>
                    <Button
                        icon={<SettingOutlined />}
                        onClick={() => setManagementVisible(true)}
                        size={size}
                    >
                        Quản lý
                    </Button>

                    <AcademicYearManagement
                        visible={managementVisible}
                        onClose={() => setManagementVisible(false)}
                    />
                </>
            )}
        </Space>
    )
}

/**
 * Academic Year Management Modal
 */
export const AcademicYearManagement = ({ visible, onClose }) => {
    const [activeTab, setActiveTab] = useState('list')
    const [academicYears, setAcademicYears] = useState([])
    const [loading, setLoading] = useState(false)
    const [createModalVisible, setCreateModalVisible] = useState(false)

    const loadAcademicYears = async () => {
        try {
            setLoading(true)
            const response = await academicYearAPI.getAll()
            setAcademicYears(response.data.academicYears)
        } catch (error) {
            message.error('Lỗi khi tải danh sách năm học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (visible) {
            loadAcademicYears()
        }
    }, [visible])

    const handleSetCurrent = async (yearId) => {
        try {
            await academicYearAPI.setCurrent(yearId)
            message.success('Đã đặt làm năm học hiện tại')
            loadAcademicYears()
        } catch (error) {
            message.error('Lỗi khi đặt năm học hiện tại')
        }
    }

    return (
        <Modal
            title="Quản lý năm học"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={1000}
            destroyOnClose
        >
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    onClick={() => setCreateModalVisible(true)}
                >
                    Thêm năm học mới
                </Button>
            </div>

            <Row gutter={16}>
                {academicYears.map(year => (
                    <Col span={8} key={year._id} style={{ marginBottom: 16 }}>
                        <Card
                            size="small"
                            title={
                                <Space>
                                    {formatAcademicYearName(year)}
                                    {year.isCurrent && (
                                        <Badge status="processing" text="Hiện tại" />
                                    )}
                                </Space>
                            }
                            extra={
                                <Badge
                                    status={getAcademicYearStatusColor(year.status)}
                                    text={getAcademicYearStatusText(year.status)}
                                />
                            }
                            actions={[
                                <Tooltip title="Xem thống kê">
                                    <InfoCircleOutlined />
                                </Tooltip>,
                                <Tooltip title="Sao chép dữ liệu">
                                    <CopyOutlined />
                                </Tooltip>,
                                !year.isCurrent && (
                                    <Tooltip title="Đặt làm năm hiện tại">
                                        <CheckCircleOutlined
                                            onClick={() => handleSetCurrent(year._id)}
                                        />
                                    </Tooltip>
                                )
                            ].filter(Boolean)}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Statistic
                                        title="Minh chứng"
                                        value={year.metadata?.totalEvidences || 0}
                                        valueStyle={{ fontSize: 14 }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="File"
                                        value={year.metadata?.totalFiles || 0}
                                        valueStyle={{ fontSize: 14 }}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                ))}
            </Row>

            <CreateAcademicYearModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSuccess={() => {
                    loadAcademicYears()
                    setCreateModalVisible(false)
                }}
            />
        </Modal>
    )
}

/**
 * Create Academic Year Modal
 */
export const CreateAcademicYearModal = ({ visible, onClose, onSuccess }) => {
    const { currentYear } = useAcademicYearContext()
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    const nextYearSuggestion = getNextAcademicYearSuggestion(currentYear)

    const handleSubmit = async (values) => {
        try {
            setLoading(true)

            const data = {
                ...values,
                code: generateAcademicYearCode(values.startYear, values.endYear),
                name: values.name || generateAcademicYearName(values.startYear, values.endYear),
                startDate: values.dateRange[0].toDate(),
                endDate: values.dateRange[1].toDate()
            }

            // Validate dates
            const errors = validateAcademicYearDates(
                data.startDate,
                data.endDate,
                values.startYear,
                values.endYear
            )

            if (errors.length > 0) {
                message.error(errors[0])
                return
            }

            await academicYearAPI.create(data)
            message.success('Tạo năm học thành công')
            form.resetFields()
            onSuccess()
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Lỗi khi tạo năm học'
            message.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleYearChange = () => {
        const startYear = form.getFieldValue('startYear')
        const endYear = form.getFieldValue('endYear')

        if (startYear && endYear) {
            const code = generateAcademicYearCode(startYear, endYear)
            const name = generateAcademicYearName(startYear, endYear)

            form.setFieldsValue({ code, name })
        }
    }

    const fillSuggestion = () => {
        if (nextYearSuggestion) {
            form.setFieldsValue({
                startYear: nextYearSuggestion.startYear,
                endYear: nextYearSuggestion.endYear,
                code: nextYearSuggestion.code,
                name: nextYearSuggestion.name
            })
        }
    }

    return (
        <Modal
            title="Tạo năm học mới"
            open={visible}
            onCancel={onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            width={600}
            destroyOnClose
        >
            {nextYearSuggestion && (
                <Alert
                    message={
                        <Space>
                            <span>Gợi ý năm học tiếp theo: {nextYearSuggestion.name}</span>
                            <Button size="small" onClick={fillSuggestion}>
                                Sử dụng gợi ý
                            </Button>
                        </Space>
                    }
                    type="info"
                    style={{ marginBottom: 16 }}
                />
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    isCurrent: false,
                    status: 'draft'
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="startYear"
                            label="Năm bắt đầu"
                            rules={[
                                { required: true, message: 'Năm bắt đầu là bắt buộc' },
                                { type: 'number', min: 2020, max: 2050, message: 'Năm phải từ 2020-2050' }
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                onChange={handleYearChange}
                                placeholder="VD: 2024"
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="endYear"
                            label="Năm kết thúc"
                            rules={[
                                { required: true, message: 'Năm kết thúc là bắt buộc' },
                                { type: 'number', min: 2021, max: 2051, message: 'Năm phải từ 2021-2051' }
                            ]}
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                onChange={handleYearChange}
                                placeholder="VD: 2025"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="code"
                    label="Mã năm học"
                    rules={[
                        { required: true, message: 'Mã năm học là bắt buộc' },
                        { pattern: /^\d{4}-\d{4}$/, message: 'Mã phải có định dạng YYYY-YYYY' }
                    ]}
                >
                    <Input placeholder="VD: 2024-2025" />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Tên năm học"
                    rules={[{ required: true, message: 'Tên năm học là bắt buộc' }]}
                >
                    <Input placeholder="VD: Năm học 2024-2025" />
                </Form.Item>

                <Form.Item
                    name="dateRange"
                    label="Thời gian"
                    rules={[{ required: true, message: 'Thời gian là bắt buộc' }]}
                >
                    <RangePicker
                        style={{ width: '100%' }}
                        format="DD/MM/YYYY"
                        placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                    />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <TextArea rows={3} placeholder="Mô tả năm học..." />
                </Form.Item>

                <Form.Item
                    name="isCurrent"
                    valuePropName="checked"
                >
                    <Switch checkedChildren="Năm hiện tại" unCheckedChildren="Không" />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default AcademicYearSelector