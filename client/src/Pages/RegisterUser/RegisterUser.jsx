import classNames from 'classnames/bind';
import styles from './RegisterUser.module.scss';
import Header from '../../Components/Header/Header';
import { Form, Input, Button, Tabs, Typography, message } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  HeatMapOutlined,
} from '@ant-design/icons';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const cx = classNames.bind(styles);
const { TabPane } = Tabs;
const { Text } = Typography;

import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { requestRegister, requestLoginGoogle } from '../../config/request';

function RegisterUser() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const data = {
      fullName: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone,
      address: values.address,
    };
    try {
      const res = await requestRegister(data);
      message.success(res.metadata.message);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  const handleSuccess = async (response) => {
    const { credential } = response;
    try {
      const res = await requestLoginGoogle({ credential });
      message.success(res.message);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Đăng nhập Google thất bại');
    }
  };

  useEffect(() => {
    document.title = 'Đăng ký';
  }, []);

  return (
    <div className={cx('wrapper')}>
      <header>
        <Header />
      </header>

      <main className={cx('main')}>
        <div className={cx('login-container')}>
          <div className={cx('login-card')}>
            <Tabs defaultActiveKey="1" centered className={cx('login-tabs')}>
              <TabPane
                key="1"
                tab={
                  <span className={cx('tab-title')}>
                    ĐĂNG KÝ TÀI KHOẢN
                  </span>
                }
              >
                <Form
                  form={form}
                  name="register"
                  className={cx('login-form')}
                  onFinish={onFinish}
                  layout="vertical"
                >
                  <Form.Item
                    name="name"
                    label="Họ tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Nhập họ tên của bạn"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email!' },
                      { type: 'email', message: 'Email không hợp lệ!' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="Nhập email"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Nhập số điện thoại"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu!' },
                      { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập mật khẩu"
                      size="large"
                    />
                  </Form.Item>

                  <div className={cx('footer-links')}>
                    <Link className={cx('link-text')} to="/login">
                      Đã có tài khoản? Đăng nhập
                    </Link>
                    <Link className={cx('link-text')} to="/forgot-password">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <div className={cx('or-divider')}>
                    <span className={cx('line')} />
                    <span className={cx('or-text')}>Hoặc</span>
                    <span className={cx('line')} />
                  </div>

                  <Form.Item className={cx('google-wrapper')}>
                    <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                      <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.log('Login Failed')}
                      />
                    </GoogleOAuthProvider>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className={cx('login-button')}
                      block
                      size="large"
                    >
                      Đăng ký
                    </Button>
                  </Form.Item>

                  <div className={cx('terms')}>
                    <Text>
                      Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các{' '}
                      <a href="#" className={cx('terms-link')}>quy định sử dụng</a> cũng như{' '}
                      <a href="#" className={cx('terms-link')}>chính sách bảo mật</a> của chúng tôi.
                    </Text>
                  </div>
                </Form>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterUser;
