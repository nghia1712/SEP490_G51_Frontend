import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Space,
} from "antd";
import { motion } from "framer-motion";
import categoryAPI from "../../API/categoryAPI";

const { TextArea } = Input;

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const AddCategoryModal = ({ open, handleClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const categoryData = {
        Name: values.name,
        Description: values.description || "",
      };

      const response = await categoryAPI.add(categoryData);
      
      if (response.data && response.data.success) {
        message.success("Tạo danh mục thành công!");
        form.resetFields();
        handleClose();
        if (onSuccess) {
          onSuccess(response.data.data);
        }
      } else {
        message.error(response.data?.message || "Có lỗi xảy ra khi tạo danh mục");
      }
    } catch (error) {
      console.error("Lỗi khi tạo danh mục:", error);
      message.error("Không thể tạo danh mục. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    handleClose();
  };

  return (
    <Modal
      title="Thêm Danh Mục Mới"
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
    >
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Tên"
            name="name"
            rules={[
              { required: true, message: "Tên của loại sản phẩm là bắt buộc" },
              { min: 6, message: "Đảm bảo 6 ký tự" },
              { max: 100, message: "Đảm bảo 6 ký tự" },
            ]}
          >
            <Input 
              placeholder="Nhập tên danh mục (6-100 ký tự)"
              size="large"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[
              { max: 300, message: "Mô tả loại sản phẩm không được vượt quá 300 ký tự" },
            ]}
          >
            <TextArea
              placeholder="Nhập mô tả danh mục (tối đa 300 ký tự)"
              rows={3}
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel} size="large">
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
              >
                Lưu
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </motion.div>
    </Modal>
  );
};

export default AddCategoryModal;