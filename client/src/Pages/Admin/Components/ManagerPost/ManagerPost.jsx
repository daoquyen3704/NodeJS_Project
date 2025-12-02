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
  Image,
  Divider,
  Input,
  Popconfirm,
  message,
} from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

import classNames from "classnames/bind";
import styles from "./ManagerPost.module.scss";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  requestGetAllPosts,
  requestApprovePost,
  requestRejectPost,
  requestUpdatePost,
  requestDeletePost,
} from "../../../../config/request";

const cx = classNames.bind(styles);

function ManagerPost() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [approvalReason, setApprovalReason] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    inactivePosts: 0,
    totalRevenue: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await requestGetAllPosts({});
      const data = res.metadata || [];

      setPosts(data);

      setStats({
        totalPosts: data.length,
        activePosts: data.filter((p) => p.status === "active").length,
        inactivePosts: data.filter((p) => p.status === "inactive").length,
        totalRevenue: data
          .filter((p) => p.status === "active")
          .reduce((sum, p) => sum + Number(p.price || 0), 0),
      });
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetails = (post) => {
    setSelectedPost(post);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setApprovalReason("");
    setIsModalVisible(false);
  };

  const handleApprove = async (id) => {
    await requestApprovePost({ id });
    message.success("Duyệt bài thành công!");
    fetchData();
  };

  const handleReject = async (id) => {
    await requestRejectPost({ id, reason: approvalReason });
    message.success("Đã từ chối bài viết!");
    setApprovalReason("");
    fetchData();
  };

  const handleToggleStatus = async (record) => {
    try {
      await requestUpdatePost({
        id: record._id,
        status: record.status === "active" ? "inactive" : "active",
      });
      message.success("Cập nhật trạng thái thành công!");
      fetchData();
    } catch (err) {
      message.error("Lỗi khi thay đổi trạng thái.");
    }
  };

  const handleResetEndDate = async (record) => {
    try {
      await requestUpdatePost({
        id: record._id,
        endDate: new Date(Date.now() + 7 * 86400000), // +7 ngày
      });
      message.success("Gia hạn thêm 7 ngày thành công!");
      fetchData();
    } catch (err) {
      message.error("Lỗi gia hạn bài viết.");
    }
  };

  const handleDeletePost = async (record) => {
    try {
      await requestDeletePost({ id: record._id });
      message.success("Xóa bài viết thành công!");
      fetchData();
    } catch (err) {
      message.error("Lỗi xóa bài viết.");
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
    },
    {
      title: "Người đăng",
      dataIndex: "username",
    },
    {
      title: "Giá",
      dataIndex: "price",
      render: (p) => `${Number(p).toLocaleString("vi-VN")} VNĐ`,
    },
    {
      title: "Loại tin",
      dataIndex: "typeNews",
      render: (t) => (
        <Tag color={t === "vip" ? "gold" : "blue"}>
          {t === "vip" ? "VIP" : "Thường"}
        </Tag>
      ),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "endDate",
      render: (endDate) => {
        const isExpired = dayjs(endDate).isBefore(dayjs());
        return (
          <span style={{ color: isExpired ? "red" : "inherit" }}>
            {dayjs(endDate).format("DD/MM/YYYY HH:mm")}
            {isExpired && " (Hết hạn)"}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s) =>
        s === "active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Thao tác",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewDetails(record)}>
            Chi tiết
          </Button>

          {/* KHOÁ / MỞ */}
          <Button
            icon={record.status === "active" ? <LockOutlined /> : <UnlockOutlined />}
            danger={record.status === "active"}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === "active" ? "Khóa" : "Mở"}
          </Button>

          {/* RESET END DATE */}
          <Button icon={<ReloadOutlined />} onClick={() => handleResetEndDate(record)}>
            +7 ngày
          </Button>

          {/* XÓA */}
          <Popconfirm
            title="Bạn có chắc muốn xóa bài viết này?"
            onConfirm={() => handleDeletePost(record)}
          >
            <Button icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={cx("manager-post")}>
      {/* Stats */}
      <Row gutter={[16, 16]} className={cx("stats-row")}>
        <Col span={8}>
          <Card className={cx("stat-card")}>
            <Statistic title="Tổng số bài viết" value={stats.totalPosts} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className={cx("stat-card")}>
            <Statistic title="Đã duyệt" value={stats.activePosts} valueStyle={{ color: "green" }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className={cx("stat-card")}>
            <Statistic
              title="Chờ duyệt"
              value={stats.inactivePosts}
              valueStyle={{ color: "orange" }}
            />
          </Card>
        </Col>
      </Row>

      {/* TABLE */}
      <Card className={cx("table-card")} title="Danh sách bài viết">
        <Table
          columns={columns}
          dataSource={posts}
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowKey="_id"
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* MODAL DETAIL */}
      <Modal
        title="Chi tiết bài viết"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
      >
        {selectedPost && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tiêu đề" span={2}>
              {selectedPost.title}
            </Descriptions.Item>
            <Descriptions.Item label="Người đăng">
              {selectedPost.username}
            </Descriptions.Item>
            <Descriptions.Item label="SĐT">
              {selectedPost.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Giá">
              {Number(selectedPost.price).toLocaleString("vi-VN")} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="Loại tin">
              {selectedPost.typeNews}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {selectedPost.status}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default ManagerPost;
