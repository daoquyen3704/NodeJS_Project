import { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  HomeOutlined,
  DollarOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { requestGetAdmin } from '../../config/request';

// DÙNG HEADER TRANG CHỦ
import SiteHeader from '../../Components/Header/Header';

import Dashboard from './Components/Dashborad/Dashborad';
import ManagerUser from './Components/ManagerUser/ManagerUser';
import ManagerPost from './Components/ManagerPost/ManagerPost';
import ManagerRechange from './Components/ManagerRechange/ManagerRechange';

import classNames from 'classnames/bind';
import styles from './Index.module.scss';

const { Sider, Content } = Layout;
const cx = classNames.bind(styles);

function Admin() {
  const [collapsed, setCollapsed] = useState(false);
  const [type, setType] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await requestGetAdmin();
      } catch (error) {
        navigate('/');
      }
    };
    fetchData();
  }, [navigate]);

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Trang chủ' },
    { key: 'users', icon: <UserOutlined />, label: 'Quản lý người dùng' },
    { key: 'posts', icon: <HomeOutlined />, label: 'Quản lý bài viết' },
    { key: 'transactions', icon: <DollarOutlined />, label: 'Quản lý giao dịch' },
  ];

  const renderTitle = () => {
    switch (type) {
      case 'dashboard':
        return 'Trang chủ';
      case 'users':
        return 'Quản lý người dùng';
      case 'posts':
        return 'Quản lý bài viết';
      case 'transactions':
        return 'Quản lý giao dịch';
      default:
        return '';
    }
  };

  return (
    <>
      <SiteHeader />

      <Layout className={cx('admin-layout')}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={280}
          className={cx('sider')}
          onCollapse={setCollapsed}
        >
          <div className={cx('logo')}>
            <div className={cx('logo-icon')}>
              <GlobalOutlined />
            </div>
            {!collapsed && (
              <div className={cx('logo-text')}>
                <h1>ThueTroNao</h1>
                <span>Admin Portal</span>
              </div>
            )}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[type]}
            onClick={({ key }) => setType(key)}
            items={menuItems}
            className={cx('menu')}
          />
        </Sider>

        <Layout className={cx('main')}>
          <div className={cx('header')}>
            <h2 className={cx('title')}>{renderTitle()}</h2>
          </div>

          <Content className={cx('content')}>
            <div className={cx('card')}>
              {type === 'dashboard' && <Dashboard />}
              {type === 'users' && <ManagerUser />}
              {type === 'posts' && <ManagerPost />}
              {type === 'transactions' && <ManagerRechange />}
            </div>
          </Content>
        </Layout>
      </Layout>
    </>
  );
}

export default Admin;
