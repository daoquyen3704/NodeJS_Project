import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  DollarCircleOutlined,
  LockOutlined,
} from '@ant-design/icons';

import Header from '../../Components/Header/Header';
import PersonalInfo from './Components/PersonalInfo/PersonalInfo';
import ManagerPost from './Components/ManagerPost/ManagerPost';
import RechargeUser from './Components/RechargeUser/RechargeUser';
import ChangePassword from './Components/ChangePassword/ChangePassword';

import cx from 'classnames';
import styles from './InfoUser.module.scss';

const { Sider, Content } = Layout;

export default function InfoUser() {
  const [type, setType] = useState('personal');
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: 'personal', icon: <UserOutlined />, label: 'Thông tin cá nhân' },
    { key: 'posts', icon: <FileTextOutlined />, label: 'Quản lý bài viết' },
    { key: 'recharge', icon: <DollarCircleOutlined />, label: 'Nạp tiền' },
    { key: 'change-password', icon: <LockOutlined />, label: 'Đổi mật khẩu' },
  ];

  const renderTitle = () => {
    switch (type) {
      case 'personal': return 'Thông tin cá nhân';
      case 'posts': return 'Quản lý bài viết';
      case 'recharge': return 'Nạp tiền';
      case 'change-password': return 'Đổi mật khẩu';
      default: return '';
    }
  };

  return (
    <>
      <Header />

      <Layout className={cx(styles.layout)}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          className={cx(styles.sider)}
          onCollapse={setCollapsed}
        >
          <div className={cx(styles.logo)}>
            <div className={cx(styles['logo-icon'])}>U</div>
            {!collapsed && <div className={cx(styles['logo-text'])}>User Center</div>}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[type]}
            onClick={({ key }) => setType(key)}
            items={menuItems}
            className={cx(styles.menu)}
          />
        </Sider>

        <Layout className={cx(styles.main)}>
          <div className={cx(styles.header)}>
            <h2 className={cx(styles.title)}>{renderTitle()}</h2>
          </div>

          <Content className={cx(styles.content)}>
            <div className={cx(styles.card)}>
              {type === 'personal' && <PersonalInfo />}
              {type === 'posts' && <ManagerPost />}
              {type === 'recharge' && <RechargeUser />}
              {type === 'change-password' && <ChangePassword />}
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
