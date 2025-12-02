import classNames from 'classnames/bind';
import styles from './RechargeUser.module.scss';
import {
  Form,
  InputNumber,
  Radio,
  Button,
  Row,
  Col,
  Modal,
  Result,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useState, useEffect } from 'react';
import { requestGetRechargeUser, requestPayments } from '../../../../config/request';
import { useStore } from '../../../../hooks/useStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const cx = classNames.bind(styles);

function RechargeUser() {
  const [form] = Form.useForm();
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const { dataPayment, setDataPayment } = useStore();

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    if (dataPayment) {
      setPaymentData(dataPayment);
      setIsSuccessModalVisible(true);
      setTimeout(() => {
        setDataPayment(null);
      }, 3000);
      fetchPaymentHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataPayment]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const res = await requestGetRechargeUser();
      setPaymentHistory(res.metadata || []);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handleSubmit = async (values) => {
    const data = {
      typePayment: paymentMethod,
      amountUser: values.amount,
    };

    if (!paymentMethod) return;

    if (paymentMethod === 'MOMO') {
      const res = await requestPayments(data);
      window.open(res.metadata.payUrl, '_blank');
    }

    if (paymentMethod === 'VNPAY') {
      const res = await requestPayments(data);
      window.open(res.metadata, '_blank');
    }
  };

  const handleModalClose = () => {
    setIsSuccessModalVisible(false);
    form.resetFields();
    setPaymentMethod(null);
  };

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('vi-VN') + ' VND';
  };

  const columns = [
    {
      title: 'Mã giao dịch',
      dataIndex: '_id',
      key: '_id',
      width: 150,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatCurrency(amount),
      width: 160,
    },
    {
      title: 'Phương thức',
      dataIndex: 'typePayment',
      key: 'typePayment',
      render: (type) => {
        const color = type === 'MOMO' ? 'magenta' : 'blue';
        return <Tag color={color}>{type}</Tag>;
      },
      width: 140,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let text = 'Thành công';

        if (status === 'pending') {
          color = 'orange';
          text = 'Đang xử lý';
        } else if (status === 'failed') {
          color = 'red';
          text = 'Thất bại';
        }

        return <Tag color={color}>{text}</Tag>;
      },
      width: 140,
    },
    {
      title: 'Ngày giao dịch',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      width: 200,
    },
  ];

  return (
    <div className={cx('wrapper')}>
      <Row gutter={[24, 24]}>
        {/* Form nạp tiền */}
        <Col xs={24} lg={10}>
          <div className={cx('panel', 'form-panel')}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className={cx('form')}
            >
              <Form.Item
                label="Số tiền cần nạp"
                name="amount"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng nhập số tiền cần nạp',
                  },
                ]}
              >
                <InputNumber
                  className={cx('amount-input')}
                  min={10000}
                  step={10000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  addonAfter="VND"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                label="Phương thức thanh toán"
                name="paymentMethod"
                rules={[
                  {
                    required: true,
                    message: 'Vui lòng chọn phương thức thanh toán',
                  },
                ]}
              >
                <Radio.Group
                  onChange={handlePaymentMethodChange}
                  className={cx('payment-methods')}
                >
                  <Radio.Button value="VNPAY">VNPay</Radio.Button>
                  <Radio.Button value="MOMO">MoMo</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item className={cx('actions')}>
                <Button
                  type="primary"
                  htmlType="submit"
                  className={cx('recharge-button')}
                  block
                >
                  Nạp tiền
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Col>

        {/* Lịch sử nạp tiền */}
        <Col xs={24} lg={14}>
          <div className={cx('panel', 'history-panel')}>
            <div className={cx('history-header')}>
              <Title level={4} className={cx('title')}>
                Lịch sử nạp tiền
              </Title>
              <Text className={cx('subtitle')}>
                Theo dõi các giao dịch nạp tiền gần đây của bạn.
              </Text>
            </div>

            <Table
              dataSource={paymentHistory}
              columns={columns}
              rowKey="_id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              className={cx('history-table')}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </Col>
      </Row>

      {/* Success Modal */}
      <Modal
        open={isSuccessModalVisible}
        footer={null}
        onCancel={handleModalClose}
        centered
        className={cx('success-modal')}
      >
        <Result
          status="success"
          title="Nạp tiền thành công!"
          subTitle={
            paymentData && (
              <div className={cx('payment-details')}>
                <p>
                  Số tiền đã nạp:{' '}
                  <strong>{formatCurrency(paymentData?.amount)}</strong>
                </p>
                <p>Tài khoản của bạn đã được cập nhật.</p>
                <p>Ngày nạp: {dayjs(paymentData?.date).format('DD/MM/YYYY')}</p>
                <p>Phương thức thanh toán: {paymentData?.typePayment}</p>
              </div>
            )
          }
          extra={[
            <Button type="primary" key="close" onClick={handleModalClose}>
              Đóng
            </Button>,
          ]}
        />
      </Modal>
    </div>
  );
}

export default RechargeUser;
