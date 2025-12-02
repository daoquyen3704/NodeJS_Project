import classNames from "classnames/bind";
import styles from "./LoginUser.module.scss";
import Header from "../../Components/Header/Header";
import { Form, Input, Button, Tabs, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const cx = classNames.bind(styles);
const { TabPane } = Tabs;
const { Text, Title } = Typography;

import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { requestLogin, requestLoginGoogle } from "../../config/request";

function LoginUser() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const res = await requestLogin(values);
      message.success(res.message);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      navigate("/");
    } catch (error) {
      message.error(error.response.data.message);
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
      navigate("/");
    } catch (error) {
      message.error(error.response.data.message);
    }
  };

  useEffect(() => {
    document.title = "Đăng nhập";
  }, []);

  return (
    <div className={cx("wrapper")}>
      <header>
        <Header />
      </header>

      <main className={cx("main")}>
        <div className={cx("login-container")}>
          <div className={cx("login-card")}>
            <Tabs defaultActiveKey="1" centered className={cx("login-tabs")}>
              <TabPane
                key="1"
                tab={
                  <span className={cx("tab-title")}>ĐĂNG NHẬP TÀI KHOẢN</span>
                }
              >
                <Form
                  form={form}
                  name="login"
                  className={cx("login-form")}
                  onFinish={onFinish}
                  layout="vertical"
                >
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập email!" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Nhập email của bạn"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: "Vui lòng nhập mật khẩu!" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="Nhập mật khẩu"
                      size="large"
                    />
                  </Form.Item>

                  <div className={cx("footer-links")}>
                    <Link className={cx("link-text")} to="/register">
                      Bạn chưa có tài khoản?
                    </Link>
                    <Link className={cx("link-text")} to="/forgot-password">
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <div className={cx("or-divider")}>
                    <span className={cx("line")} />
                    <span className={cx("or-text")}>Hoặc</span>
                    <span className={cx("line")} />
                  </div>

                  <Form.Item className={cx("google-wrapper")}>
                    <GoogleOAuthProvider
                      clientId={import.meta.env.VITE_CLIENT_ID}
                    >
                      <GoogleLogin
                        onSuccess={handleSuccess}
                        onError={() => console.log("Login Failed")}
                      />
                    </GoogleOAuthProvider>
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className={cx("login-button")}
                      block
                      size="large"
                    >
                      Đăng nhập
                    </Button>
                  </Form.Item>

                  <div className={cx("terms")}>
                    <Text>
                      Qua việc đăng nhập hoặc tạo tài khoản, bạn đồng ý với các{" "}
                      <a href="#" className={cx("terms-link")}>
                        quy định sử dụng
                      </a>{" "}
                      cũng như{" "}
                      <a href="#" className={cx("terms-link")}>
                        chính sách bảo mật
                      </a>{" "}
                      của chúng tôi.
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

export default LoginUser;
