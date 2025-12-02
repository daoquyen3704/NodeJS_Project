import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Space, Tag } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import classNames from 'classnames/bind';

import { requestGetRechargeStats } from '../../../../config/request';
import styles from './ManagerRechange.module.scss';

const cx = classNames.bind(styles);

function ManagerRechange() {
  const [rechargeStats, setRechargeStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    recentTransactions: 0,
    transactionGrowth: 0,
    recentRevenue: 0,
    revenueGrowth: 0,
  });
  const [rechargeData, setRechargeData] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Phương thức',
      dataIndex: 'typePayment',
      key: 'typePayment',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isSuccess = status === 'success';
        return (
          <Tag
            icon={isSuccess ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            color={isSuccess ? 'success' : 'error'}
          >
            {isSuccess ? 'Thành công' : 'Thất bại'}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const fetchRechargeData = async () => {
    try {
      setLoading(true);
      const response = await requestGetRechargeStats();
      const { metadata } = response;

      setRechargeStats({
        totalTransactions: metadata.totalTransactions,
        totalRevenue: metadata.totalRevenue,
        recentTransactions: metadata.recentTransactions,
        transactionGrowth: metadata.transactionGrowth,
        recentRevenue: metadata.recentRevenue,
        revenueGrowth: metadata.revenueGrowth,
      });

      setRechargeData(metadata.transactions);
    } catch (error) {
      console.error('Error fetching recharge data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRechargeData();
  }, []);

  return (
    <div className={cx('manager-recharge')}>
      {/* Stat cards */}
      <Row gutter={[16, 16]} className={cx('stats-row')}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'transactions-total')}>
              <ShoppingOutlined />
            </div>
            <Statistic
              title="Tổng số giao dịch"
              value={rechargeStats.totalTransactions}
              loading={loading}
              suffix={
                <span
                  className={cx(
                    'growth',
                    rechargeStats.transactionGrowth >= 0 ? 'positive' : 'negative',
                  )}
                >
                  {rechargeStats.transactionGrowth >= 0 ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )}
                  {Math.abs(rechargeStats.transactionGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'transactions-recent')}>
              <ClockCircleOutlined />
            </div>
            <Statistic
              title="Giao dịch gần đây"
              value={rechargeStats.recentTransactions}
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'revenue-total')}>
              <DollarOutlined />
            </div>
            <Statistic
              title="Tổng doanh thu"
              value={rechargeStats.totalRevenue}
              loading={loading}
              formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
              suffix={
                <span
                  className={cx(
                    'growth',
                    rechargeStats.revenueGrowth >= 0 ? 'positive' : 'negative',
                  )}
                >
                  {rechargeStats.revenueGrowth >= 0 ? (
                    <ArrowUpOutlined />
                  ) : (
                    <ArrowDownOutlined />
                  )}
                  {Math.abs(rechargeStats.revenueGrowth)}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className={cx('stat-card')} bordered={false}>
            <div className={cx('stat-icon', 'revenue-recent')}>
              <ClockCircleOutlined />
            </div>
            <Statistic
              title="Doanh thu gần đây"
              value={rechargeStats.recentRevenue}
              loading={loading}
              formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`}
            />
          </Card>
        </Col>
      </Row>

      {/* Table card */}
      <Card
        className={cx('table-card')}
        bordered={false}
        title="Danh sách giao dịch gần đây"
      >
        <Table
          columns={columns}
          dataSource={rechargeData}
          loading={loading}
          pagination={{ pageSize: 10 }}
          className={cx('recharge-table')}
          rowKey="_id"
        />
      </Card>
    </div>
  );
}

export default ManagerRechange;
