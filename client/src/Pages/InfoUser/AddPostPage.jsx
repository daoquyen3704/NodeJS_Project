import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Header/Header";
import AddPostForm from "./Components/ManagerPost/AddPostForm";
import { message } from "antd";

export default function AddPostPage() {
  const navigate = useNavigate();

  const handleFinish = (data) => {
    // After successful create, show a message and navigate back to personal page
    message.success("Tạo bài viết thành công");
    navigate("/trang-ca-nhan");
  };

  const handleCancel = () => {
    navigate("/trang-ca-nhan");
  };

  return (
    <>
      <Header />
      <div
        style={{
          padding: "24px",
          maxWidth: 1000,
          margin: "0 auto",
          marginTop: "24px",
          backgroundColor: "#fff", // 🟨 THÊM DÒNG NÀY
        }}
      >
        <h2 style={{ marginBottom: "24px", color: "#131954ff" }}>Thêm bài viết mới</h2>
        <AddPostForm onFinish={handleFinish} onCancel={handleCancel} />
      </div>
    </>
  );
}
