import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  message,
  Row,
  Col,
  Checkbox,
  Divider,
  Typography,
  AutoComplete,
  Table,
  Statistic,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import { Editor } from '@tinymce/tinymce-react';
import { requestCreatePost, requestUploadImages } from '../../../../config/request';

const { Option } = Select;
const { Title, Text } = Typography;

import axios from 'axios';
import useDebounce from '../../../../hooks/useDebounce';

import classNames from 'classnames/bind';
import styles from './AddPostForm.module.scss';

const cx = classNames.bind(styles);

// Helper function for Upload component
const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e && e.fileList;
};

const dataSource = [
  {
    key: '1',
    typeNews: 'Tin VIP',
    '3 ngày': 50000,
    '7 ngày': 315000,
    '30 ngày': 1200000,
  },
  {
    key: '2',
    typeNews: 'Tin thường',
    '3 ngày': 10000,
    '7 ngày': 50000,
    '30 ngày': 1000000,
  },
];

const columns = [
  {
    title: 'Loại Tin',
    dataIndex: 'typeNews',
    key: 'typeNews',
  },
  {
    title: '3 ngày',
    dataIndex: '3 ngày',
    key: '3 ngày',
    render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
  },
  {
    title: '7 ngày',
    dataIndex: '7 ngày',
    key: '7 ngày',
    render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
  },
  {
    title: '30 ngày',
    dataIndex: '30 ngày',
    key: '30 ngày',
    render: (price) => (typeof price === 'number' ? `${price.toLocaleString('vi-VN')} VNĐ` : price),
  },
];

const optionLabels = [
  'Đầy đủ nội thất',
  'Có gác',
  'Có kệ bếp',
  'Có máy lạnh',
  'Có máy giặt',
  'Có tủ lạnh',
  'Có thang máy',
  'Không chung chủ',
  'Giờ giấc tự do',
  'Có bảo vệ 24/24',
  'Có hầm để xe',
];

const durationOptions = [
  { label: '3 ngày', value: 3 },
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
];

function AddPostForm({ mode = 'create', onFinish, onCancel, initialValues }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [description, setDescription] = useState(initialValues?.description || '');
  const [valueSearch, setValueSearch] = useState('');
  const [dataSearch, setDataSearch] = useState([]);
  const debouncedSearch = useDebounce(valueSearch, 500);
  const [mapQuery, setMapQuery] = useState(initialValues?.address || 'Lăng Chủ tịch Hồ Chí Minh');
  const [dateEnd, setDateEnd] = useState(null);

  const [estimatedCost, setEstimatedCost] = useState(0);

  const selectedDuration = Form.useWatch('duration', form);
  const selectedTypeNews = Form.useWatch('typeNews', form);

  useEffect(() => {
    let calculatedCost = 0;
    if (selectedDuration && selectedTypeNews) {
      const selectedTier = dataSource.find((item) => {
        const itemTypeKey = item.typeNews === 'Tin VIP' ? 'vip' : 'normal';
        return itemTypeKey === selectedTypeNews;
      });

      if (selectedTier) {
        const durationKey = `${selectedDuration} ngày`;
        setDateEnd(selectedDuration);
        calculatedCost = selectedTier[durationKey] || 0;
      }
    }
    setEstimatedCost(calculatedCost);
  }, [selectedDuration, selectedTypeNews]);

  useEffect(() => {
    const fetchData = async () => {
      if (debouncedSearch) {
        const res = await axios.get(`https://rsapi.goong.io/Place/AutoComplete`, {
          params: {
            input: debouncedSearch,
            api_key: import.meta.env.VITE_API_KEY,
          },
        });
        setDataSearch(res.data.predictions);
      }
    };
    fetchData();
  }, [debouncedSearch]);

  useEffect(() => {
    if (initialValues) {
      const initialData = {
        ...initialValues,
        location: initialValues.address,
        options: Array.isArray(initialValues.options) ? initialValues.options : [],
      };
      form.setFieldsValue(initialData);
      if (initialValues.description) {
        setDescription(initialValues.description);
      }
      setMapQuery(initialValues.address || 'Lăng Chủ tịch Hồ Chí Minh');

      if (initialValues.images && Array.isArray(initialValues.images)) {
        setFileList(
          initialValues.images.map((img, index) => {
            if (img && typeof img === 'object' && img.uid) {
              return img;
            }
            const name =
              typeof img === 'string' ? img.substring(img.lastIndexOf('/') + 1) : `image-${index + 1}.png`;
            return {
              uid: `-${index + 1}`,
              name: name,
              status: 'done',
              url: typeof img === 'string' ? img : undefined,
              thumbUrl: typeof img === 'string' ? img : undefined,
            };
          }),
        );
      } else {
        setFileList([]);
      }
    } else {
      form.resetFields();
      setFileList([]);
      setDescription('');
      setMapQuery('Lăng Chủ tịch Hồ Chí Minh');
      setEstimatedCost(0);
    }
  }, [initialValues, form]);

const handleFinish = async (values) => {
  try {
    const formData = new FormData();
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('images', file.originFileObj);
      }
    });

    const today = dayjs();
    const endDate = values.duration
      ? today.add(values.duration, 'day').utc().toISOString()
      : null;

    const resImages = fileList.length ? await requestUploadImages(formData) : { images: initialValues?.images || [] };

    const data = {
      title: values.title,
      price: values.price,
      description,
      category: values.category,
      area: values.area,
      phone: values.phone,
      username: values.username,
      options: values.options,
      location: values.location,
      typeNews: values.typeNews,
      endDate,
      images: resImages.images,
      dateEnd,
    };

    // 🔹 nếu là tạo mới: gọi API create
    if (mode === 'create') {
      await requestCreatePost(data);
      message.success('Tạo bài viết thành công');
      form.resetFields();
      setFileList([]);
      setDescription('');
      setEstimatedCost(0);
    }

    // 🔹 dù create hay edit, báo dữ liệu lên parent
    onFinish && onFinish(data);
  } catch (error) {
    message.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo/cập nhật bài viết.');
  }
};


  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setDescription('');
    setEstimatedCost(0);
    onCancel();
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleLocationSearch = (searchText) => {
    setValueSearch(searchText);
  };

  const handleLocationSelect = (selectedValue) => {
    form.setFieldsValue({ location: selectedValue });
    setMapQuery(selectedValue);
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <Text className={cx('subtitle')}>   
          Điền đầy đủ thông tin phòng, hình ảnh và thời gian đăng để tin hiển thị nổi bật trên hệ thống.
        </Text>
      </div>

      <div className={cx('form-card')}>
        <Form form={form} layout="vertical" onFinish={handleFinish} className={cx('form')}>
          {/* Thông tin cơ bản */}
          <Title level={5} className={cx('section-title')}>
            Thông tin cơ bản
          </Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
              >
                <Input placeholder="Ví dụ: Phòng trọ giá rẻ gần ĐH Bách Khoa" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá (VNĐ/tháng)"
                rules={[{ required: true, message: 'Vui lòng nhập giá' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="Ví dụ: 2,500,000"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className={cx('editor-wrapper')}>
            <Editor
              apiKey="hfm046cu8943idr5fja0r5l2vzk9l8vkj5cp3hx2ka26l84x"
              init={{
                plugins:
                  'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
                toolbar:
                  'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
              }}
              initialValue="Mô tả phòng trọ"
              onEditorChange={(content) => setDescription(content)}
            />
          </div>

          <Divider />

          {/* Thông tin chi tiết */}
          <Title level={5} className={cx('section-title')}>
            Thông tin chi tiết
          </Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Loại hình"
                rules={[{ required: true, message: 'Vui lòng chọn loại hình' }]}
              >
                <Select placeholder="Chọn loại hình">
                  <Option value="phong-tro">Phòng trọ</Option>
                  <Option value="nha-nguyen-can">Nhà nguyên căn</Option>
                  <Option value="can-ho-chung-cu">Căn hộ chung cư</Option>
                  <Option value="can-ho-mini">Căn hộ mini</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area"
                label="Diện tích (m²)"
                rules={[{ required: true, message: 'Vui lòng nhập diện tích' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="Ví dụ: 25" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Thông tin liên hệ */}
          <Title level={5} className={cx('section-title')}>
            Thông tin liên hệ
          </Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên người đăng"
                rules={[{ required: true, message: 'Vui lòng nhập tên người đăng' }]}
              >
                <Input placeholder="Tên người cho thuê" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại liên hệ"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="Số điện thoại người đăng" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn địa chỉ' }]}
          >
            <AutoComplete
              options={dataSearch?.map((item) => ({ value: item.description }))}
              onSearch={handleLocationSearch}
              onSelect={handleLocationSelect}
              placeholder="Nhập địa chỉ hoặc chọn từ gợi ý..."
            >
              <Input />
            </AutoComplete>
          </Form.Item>

          <div className={cx('map-section')}>
            <Title level={5} className={cx('section-title', 'map-title')}>
              Vị trí & bản đồ
            </Title>
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Property Location"
            />
          </div>

          <Divider />

          {/* Hình ảnh */}
          <Title level={5} className={cx('section-title')}>
            Hình ảnh
          </Title>
          <Form.Item name="images" valuePropName="fileList" getValueFromEvent={normFile}>
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
              fileList={fileList}
              onChange={handleUploadChange}
              accept="image/*"
            >
              {fileList.length >= 8 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Divider />

          {/* Tiện nghi */}
          <Title level={5} className={cx('section-title')}>
            Tiện nghi & Tùy chọn
          </Title>
          <Form.Item name="options">
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                {optionLabels.map((label) => (
                  <Col xs={24} sm={12} md={8} key={label}>
                    <Checkbox value={label}>{label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Divider />

          {/* Loại tin + thời gian + tạm tính */}
          <Row gutter={24} align="bottom">
            <Col xs={24} md={8}>
              <Form.Item
                name="typeNews"
                label="Loại tin"
                rules={[{ required: true, message: 'Vui lòng chọn loại tin' }]}
              >
                <Select placeholder="Chọn loại tin">
                  <Option value="vip">Tin VIP</Option>
                  <Option value="normal">Tin thường</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="duration"
                label="Thời gian đăng"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian đăng' }]}
              >
                <Select placeholder="Chọn số ngày">
                  {durationOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8} className={cx('summary-col')}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Tạm tính (VNĐ)"
                    value={estimatedCost > 0 ? estimatedCost : '-'}
                    precision={0}
                    formatter={(value) =>
                      typeof value === 'number' ? value.toLocaleString('vi-VN') : value
                    }
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          <div className={cx('price-table')}>
            <Title level={5} className={cx('section-title')}>
              Bảng giá dịch vụ
            </Title>
            <Table
              dataSource={dataSource}
              columns={columns}
              pagination={false}
              size="small"
              bordered
            />
          </div>

          <Form.Item className={cx('actions')}>
            <Button onClick={handleCancel} className={cx('btn-secondary')}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" className={cx('btn-primary')}>
              {initialValues ? 'Cập nhật bài viết' : 'Thêm bài viết'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

export default AddPostForm;
