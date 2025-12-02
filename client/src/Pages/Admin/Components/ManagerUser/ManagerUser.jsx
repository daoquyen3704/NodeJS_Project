import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Popconfirm,
  message,
} from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  DollarOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import classNames from 'classnames/bind';
import styles from './ManagerUser.module.scss';
import { useEffect, useState } from 'react';
import {
  requestGetUsers,
  requestAdminBanUser,
  requestAdminDeleteUser,
  requestAdminResetPassword,
} from '../../../../config/request';

const cx = classNames.bind(styles);

function ManagerUser() {
  const [userData, setUserData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalRevenue: 0,
  });

  const fetchData = async () => {
    const res = await requestGetUsers();
    const data = res.metadata || [];
    setUserData(data);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats = {
      totalUsers: data.length,
      newUsers: data.filter((item) => new Date(item.user.createdAt) > thirtyDaysAgo).length,
      activeUsers: data.filter((item) => item.totalPost > 0).length,
      inactiveUsers: data.filter((item) => item.totalPost === 0).length,
      totalRevenue: data.reduce((sum, item) => sum + item.totalSpent, 0),
    };

    setStats(newStats);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDetails = (record) => {
    setSelectedUser(record);
    setModalVisible(true);
  };

  const handleToggleActive = async (record) => {
    try {
      await requestAdminBanUser({
        id: record.user._id,
        isActive: !record.user.isActive,
      });
      message.success(record.user.isActive ? "Khóa user thành công" : "Mở khóa user thành công");
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleResetPassword = async (record) => {
    try {
      await requestAdminResetPassword({
        id: record.user._id,
      });
      message.success("Đặt lại mật khẩu về '123456' thành công");
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi đặt lại mật khẩu");
    }
  };

  const handleDeleteUser = async (record) => {
    try {
      await requestAdminDeleteUser({
        id: record.user._id,
      });
      message.success("Xóa người dùng thành công");
      fetchData();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi xóa người dùng");
    }
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: ['user', 'fullName'],
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: ['user', 'email'],
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: ['user', 'phone'],
      key: 'phone',
    },
    {
      title: 'Địa chỉ',
      dataIndex: ['user', 'address'],
      key: 'address',
    },
    {
      title: 'Ngày tham gia',
      dataIndex: ['user', 'createdAt'],
      key: 'joinDate',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Số bài đăng',
      dataIndex: 'totalPost',
      key: 'totalPost',
    },
    {
      title: 'Tổng chi tiêu',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: ['user', 'isActive'],
      key: 'isActive',
      render: (isActive) =>
        isActive ? <Tag color="green">Đang hoạt động</Tag> : <Tag color="red">Bị khóa</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => openDetails(record)}>
            Chi tiết
          </Button>

          {/* Khoá / mở khóa */}
          <Button
            icon={record.user.isActive ? <LockOutlined /> : <UnlockOutlined />}
            type={record.user.isActive ? 'default' : 'primary'}
            danger={record.user.isActive}
            onClick={() => handleToggleActive(record)}
          >
            {record.user.isActive ? 'Khóa' : 'Mở khóa'}
          </Button>

          {/* Reset password */}
          <Button
            icon={<ReloadOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            Reset mật khẩu
          </Button>

          {/* Delete user */}
          <Popconfirm
            title="Bạn chắc chắn muốn xóa user này?"
            onConfirm={() => handleDeleteUser(record)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={cx('manager-user')}>
      {/* Stats */}
      <Row gutter={[16, 16]} className={cx('stats-row')}>
        <Col xs={24} sm={12} lg={8}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'total')}>
              <UserOutlined />
            </div>
            <Statistic title="Tổng số người dùng" value={stats.totalUsers} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'new')}>
              <UserAddOutlined />
            </div>
            <Statistic title="Người dùng mới (30 ngày)" value={stats.newUsers} />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'revenue')}>
              <DollarOutlined />
            </div>
            <Statistic
              title="Tổng chi tiêu"
              value={stats.totalRevenue}
              formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card className={cx('table-card')} bordered={false} title="Danh sách người dùng">
        <Table
          columns={columns}
          dataSource={userData}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1500 }}
          rowKey={(record) => record.user._id}
          className={cx('users-table')}
        />
      </Card>

      {/* Modal chi tiết */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        title="Thông tin chi tiết người dùng"
      >
        {selectedUser && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Họ tên">{selectedUser.user.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{selectedUser.user.email}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{selectedUser.user.phone}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{selectedUser.user.address}</Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {new Date(selectedUser.user.createdAt).toLocaleDateString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Số bài đăng">{selectedUser.totalPost}</Descriptions.Item>
            <Descriptions.Item label="Tổng chi tiêu">
              {selectedUser.totalSpent.toLocaleString('vi-VN')} VNĐ
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default ManagerUser;
