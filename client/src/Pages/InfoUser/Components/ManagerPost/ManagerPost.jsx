import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Space, message, Card, Row, Col, Typography } from "antd";
import classNames from "classnames/bind";
import styles from "./ManagerPost.module.scss";
import { useNavigate } from "react-router-dom";
import { DollarOutlined } from "@ant-design/icons";

import {
  requestGetPostByUserId,
  requestExtendPost,
  requestDeletePostUser,
} from "../../../../config/request";
import { useStore } from "../../../../hooks/useStore";

const { Title, Text } = Typography;

const cx = classNames.bind(styles);

function ManagerPost() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchAuth } = useStore();

  // Fetch posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await requestGetPostByUserId();
      setPosts(res.metadata || []);
    } catch (error) {
      console.log(error);
      message.error("Lỗi tải bài viết!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Extend post by 7 days
  const handleExtend = async (id) => {
    try {
      const res = await requestExtendPost({ id });
      message.success(res.message || "Gia hạn 7 ngày thành công!");
      fetchPosts();
      // Refresh balance sau khi gia hạn
      if (fetchAuth && typeof fetchAuth === 'function') {
        await fetchAuth();
      }
    } catch (error) {
      message.error(error.response?.data?.message || "Gia hạn thất bại!");
    }
  };

  // Delete post
  const handleDelete = async (id) => {
    try {
      await requestDeletePostUser({ id });
      message.success("Xoá bài viết thành công!");
      fetchPosts();
    } catch {
      message.error("Xoá thất bại!");
    }
  };

  const columns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (v) => `${Number(v).toLocaleString("vi-VN")} đ`,
    },
    {
      title: "Loại tin",
      dataIndex: "typeNews",
      key: "typeNews",
      render: (v) => <Tag color={v === "vip" ? "gold" : "blue"}>{v}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const now = new Date();
        const endDate = record.endDate ? new Date(record.endDate) : null;
        const isExpired = endDate && endDate < now;

        if (isExpired) {
          return <Tag color="red">Hết hạn</Tag>;
        }
        return (
          <Tag color={status === "active" ? "green" : "orange"}>
            {status === "active" ? "Đã duyệt" : "Chờ duyệt"}
          </Tag>
        );
      },
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "endDate",
      key: "endDate",
      render: (d) => {
        if (!d) return <i>Chưa có</i>;
        const endDate = new Date(d);
        const now = new Date();
        const isExpired = endDate < now;
        return (
          <span style={{ color: isExpired ? "#ff4d4f" : "inherit" }}>
            {endDate.toLocaleDateString("vi-VN")}
            {isExpired && " (Đã hết hạn)"}
          </span>
        );
      },
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() =>
              navigate(`/trang-ca-nhan/sua-bai-viet/${record._id}`)
            }
          >
            Sửa
          </Button>

          <Button type="link" onClick={() => handleExtend(record._id)}>
            Gia hạn +7 ngày
          </Button>

          <Button type="link" danger onClick={() => handleDelete(record._id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  // Bảng giá gia hạn
  const extendPriceTable = [
    { type: "Tin thường", price: 50000, days: 7 },
    { type: "Tin VIP", price: 250000, days: 7 },
  ];

  return (
    <div className={cx("wrapper")}>
      <div className={cx("panel")}>
        <div className={cx("header")}>
          <Button
            type="primary"
            onClick={() => navigate("/trang-ca-nhan/them-bai-viet")}
          >
            + Thêm bài viết mới
          </Button>
        </div>

        {/* Bảng giá gia hạn */}
        <Card className={cx("price-card")} title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarOutlined />
            <span>Bảng giá gia hạn bài viết</span>
          </div>
        }>
          <Row gutter={[16, 16]}>
            {extendPriceTable.map((item, index) => (
              <Col xs={24} sm={12} key={index}>
                <div className={cx("price-item")}>
                  <div className={cx("price-header")}>
                    <Text strong>{item.type}</Text>
                    <Tag color={item.type === "Tin VIP" ? "gold" : "blue"}>
                      {item.type}
                    </Tag>
                  </div>
                  <div className={cx("price-detail")}>
                    <Text className={cx("price-value")}>
                      {item.price.toLocaleString("vi-VN")} VNĐ
                    </Text>
                    <Text type="secondary" className={cx("price-days")}>
                      / {item.days} ngày
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={posts}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          scroll={{ x: "max-content" }}
          className={cx("table")}
        />
      </div>
    </div>
  );
}

export default ManagerPost;
