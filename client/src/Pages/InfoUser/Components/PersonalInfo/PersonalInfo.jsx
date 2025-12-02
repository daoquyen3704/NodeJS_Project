import {
  Row,
  Col,
  Card,
  Typography,
  Table,
  Modal,
  Form,
  Input,
  Button,
  Upload,
  message,
  AutoComplete,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  EditOutlined,
  UploadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import classNames from 'classnames/bind';
import styles from './PersonalInfo.module.scss';
import { useStore } from '../../../../hooks/useStore';
import { useState, useEffect } from 'react';
import {
  requestGetFavourite,
  requestUpdateUser,
} from '../../../../config/request';
import axios from 'axios';
import useDebounce from '../../../../hooks/useDebounce';

import userNotFound from '../../../../assets/images/img_default.svg';

const cx = classNames.bind(styles);
const { Text, Title } = Typography;

function PersonalInfo() {
  const { dataUser, fetchAuth } = useStore();
  const [favourite, setFavourite] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState(dataUser?.avatar || '');
  const [valueSearch, setValueSearch] = useState('');
  const [dataSearch, setDataSearch] = useState([]);

  const debouncedSearch = useDebounce(valueSearch, 500);

  useEffect(() => {
    const fetchData = async () => {
      if (debouncedSearch) {
        const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
          params: {
            input: debouncedSearch,
            api_key: '3HcKy9jen6utmzxno4HwpkN1fJYll5EM90k53N4K',
          },
        });
        setDataSearch(res.data.predictions);
      } else {
        setDataSearch([]);
      }
    };
    fetchData();
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchFavourite = async () => {
      const res = await requestGetFavourite();
      setFavourite(res.metadata || []);
    };
    fetchFavourite();
  }, []);

  const handleEdit = () => {
    form.setFieldsValue({
      fullName: dataUser.fullName,
      phone: dataUser.phone,
      email: dataUser.email,
      address: dataUser.address,
    });
    setAvatarUrl(dataUser?.avatar || '');
    setIsModalVisible(true);
  };

const handleOk = async () => {
  try {
    const values = await form.validateFields();

    const payload = {
      ...values,
      avatar: avatarUrl,
    };

    const res = await requestUpdateUser(payload);

    const msg = res?.message || res?.metadata?.message || 'Cập nhật thành công';
    message.success(msg);

    setIsModalVisible(false);

    // 🔧 Chỉ gọi nếu thực sự là function để tránh "fn is not a function"
    try {
      console.debug('fetchAuth type:', typeof fetchAuth);
      if (typeof fetchAuth === 'function') {
        await fetchAuth();
      } else {
        console.warn('fetchAuth is not a function, skipping call', fetchAuth);
      }
    } catch (err) {
      // Log stack so we can see where the error comes from in console
      console.error('Error when calling fetchAuth():', err);
    }
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      'Cập nhật thất bại, vui lòng thử lại';
    message.error(errMsg);
  }
};

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setAvatarUrl(dataUser?.avatar || '');
  };

  const beforeUpload = (file) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Ảnh phải nhỏ hơn 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleAvatarChange = async (info) => {
    if (info.file.status === 'done') {
      setAvatarUrl(info.file.response.image);
      message.success('Tải ảnh lên thành công!');
    } else if (info.file.status === 'error') {
      message.error('Tải ảnh lên thất bại!');
    }
  };

  const favoriteColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'endDate',
      key: 'status',
      render: (endDate) => {
        const currentDate = new Date();
        const postEndDate = new Date(endDate);
        const isExpired = postEndDate < currentDate;
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
            {isExpired ? 'Đã hết hạn' : 'Đã đăng'}
          </span>
        );
      },
    },
  ];

  const favoritePosts = favourite.map((item) => ({
    key: item._id,
    title: item.title,
    price: item.price,
    createdAt: item.createdAt,
    endDate: item.endDate,
  }));

  const handleSelectAddress = (value) => {
    form.setFieldsValue({ address: value });
  };

  return (
    <div className={cx('wrapper')}>
      {/* Header */}
      <div className={cx('header')}>
        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={handleEdit}
          className={cx('edit-btn')}
        >
          Chỉnh sửa thông tin
        </Button>
      </div>

      {/* Info grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card size="small" className={cx('info-card')}>
            <div className={cx('info-item')}>
              <UserOutlined className={cx('info-icon')} />
              <div>
                <Text strong>Họ và tên</Text>
                <div className={cx('info-value')}>{dataUser.fullName}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" className={cx('info-card')}>
            <div className={cx('info-item')}>
              <PhoneOutlined className={cx('info-icon')} />
              <div>
                <Text strong>Số điện thoại</Text>
                <div className={cx('info-value')}>{dataUser.phone}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" className={cx('info-card')}>
            <div className={cx('info-item')}>
              <MailOutlined className={cx('info-icon')} />
              <div>
                <Text strong>Email</Text>
                <div className={cx('info-value')}>{dataUser.email}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" className={cx('info-card')}>
            <div className={cx('info-item')}>
              <EnvironmentOutlined className={cx('info-icon')} />
              <div>
                <Text strong>Địa chỉ</Text>
                <div className={cx('info-value')}>{dataUser.address}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card size="small" className={cx('info-card')}>
            <div className={cx('info-item')}>
              <DollarOutlined className={cx('info-icon')} />
              <div>
                <Text strong>Số dư tài khoản</Text>
                <div className={cx('info-value', 'balance-value')}>
                  {dataUser.balance?.toLocaleString('vi-VN') || '0'} VNĐ
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Favourites */}
      <div className={cx('favorites-section')}>
        <Card className={cx('favorites-card')} bordered={false}>
          <div className={cx('favorites-header')}>
            <HeartOutlined className={cx('favorites-icon')} />
            <Title level={4} className={cx('favorites-title')}>
              Tin yêu thích
            </Title>
          </div>
          <Table
            columns={favoriteColumns}
            dataSource={favoritePosts}
            pagination={{ pageSize: 5 }}
            className={cx('favorites-table')}
          />
        </Card>
      </div>

      {/* Modal chỉnh sửa */}
      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={600}
        className={cx('edit-modal')}
      >
        <div className={cx('avatar-section')}>
          <div className={cx('avatar-wrapper')}>
            <img
              src={avatarUrl || userNotFound}
              alt="avatar"
              className={cx('avatar-img')}
            />
          </div>

          <Upload
            name="avatar"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleAvatarChange}
            action={`${import.meta.env.VITE_SOCKET_URL}/api/upload-image`}
          >
            <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
          </Upload>
        </div>


        <Form form={form} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <AutoComplete
              options={dataSearch.map((item) => ({
                value: item.description,
                label: item.description,
              }))}
              onSelect={handleSelectAddress}
              onSearch={setValueSearch}
              notFoundContent={valueSearch ? 'Không tìm thấy địa chỉ' : null}
            >
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="Nhập địa chỉ của bạn"
              />
            </AutoComplete>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PersonalInfo;
