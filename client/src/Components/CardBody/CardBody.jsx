import classNames from 'classnames/bind';
import styles from './CardBody.module.scss';

import { DollarOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';

import imgDefault from '../../assets/images/img_default.svg';

import { Link } from 'react-router-dom';

import dayjs from 'dayjs';

const cx = classNames.bind(styles);

function CardBody({ post }) {
  return (
    <Link to={`/chi-tiet-tin-dang/${post._id}`} className={cx('card-link')}>
      <div className={cx('list-item')}>
        {/* Ảnh bài đăng */}
        <div className={cx('parent')}>
          <div className={cx('div1')}>
            <img src={post.images?.[0] || imgDefault} alt="img-1" />
          </div>
        </div>

        {/* Thông tin phòng */}
        <div className={cx('room-info')}>
          <h2 className={cx('room-title')}>
            <HomeOutlined className={cx('icon')} />
            <span className={cx('room-title-text')}>{post.title}</span>
          </h2>

          <div className={cx('room-meta')}>
            <span className={cx('price')}>
              <DollarOutlined className={cx('icon')} />
              {Number(post.price || 0).toLocaleString('vi-VN')} VNĐ/tháng
            </span>

            <span className={cx('area')}>
              <HomeOutlined className={cx('icon')} />
              {post.area} m²
            </span>

            <span className={cx('location')}>
              <EnvironmentOutlined className={cx('icon')} />
              <span className={cx('location-text')}>{post.location}</span>
            </span>
          </div>
        </div>

        {/* Thông tin người đăng */}
        <div className={cx('user-info')}>
          <img src={post.user?.avatar || imgDefault} alt="" />
          <div className={cx('info-container')}>
            <div className={cx('user-header')}>
              <h4>{post.user?.fullName}</h4>
              <span>{dayjs(post.createdAt).format('HH:mm DD/MM/YYYY')}</span>
            </div>
            <div className={cx('user-actions')}>
              <span>{post.phone}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CardBody;
