import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Spin, message, Card } from 'antd';
import AddPostForm from '../ManagerPost/AddPostForm';
import { requestGetPostById, requestUpdatePostUser } from '../../../../config/request';

function EditPostUser() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await requestGetPostById(postId);
        const p = res.metadata.data;

        setInitialValues({
          ...p,
          address: p.location,      // vì AddPostForm đang dùng address/location
          images: p.images || [],
        });
      } catch (error) {
        message.error('Không tải được bài viết');
        navigate('/trang-ca-nhan');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, navigate]);

  const handleUpdate = async (dataFromForm) => {
    try {
      await requestUpdatePostUser({ id: postId, ...dataFromForm });
      message.success('Cập nhật bài viết thành công');
      navigate('/trang-ca-nhan');
    } catch (error) {
      message.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleCancel = () => {
    navigate('/trang-ca-nhan');
  };

  if (loading || !initialValues) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  return (
    <Card
      title="Chỉnh sửa bài viết"
      style={{ borderRadius: 12, border: '1px solid #c2b9c8', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
    >
      <AddPostForm
        mode="edit"
        initialValues={initialValues}
        onFinish={handleUpdate}
        onCancel={handleCancel}
      />
    </Card>
  );
}

export default EditPostUser;
