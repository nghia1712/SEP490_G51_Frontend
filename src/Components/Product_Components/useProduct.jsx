//useproductss
import { useState, useEffect } from "react";
import axios from "axios";

const useProduct = () => {
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:9999/products"; // Thay đổi URL này theo cấu hình server của bạn

  // Lấy tất cả sản phẩm
  const fetchAllProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/getAllProducts`);
      setProducts(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy sản phẩm theo ID
  const fetchProductById = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/getProductById/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Tạo mới sản phẩm
  const createProduct = async (productData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/createProduct`,
        productData
      );
      setProducts((prevProducts) => [
        ...prevProducts,
        response.data.newProduct,
      ]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật sản phẩm
  const updateProduct = async (id, updatedData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/updateProduct/${id}`,
        updatedData
      );
      setProducts((prevProducts) =>
        prevProducts.map((prod) => (prod._id === id ? response.data : prod))
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Xóa sản phẩm
  const deleteProduct = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/deleteProduct/${id}`);
      setProducts((prevProducts) =>
        prevProducts.filter((prod) => prod._id !== id)
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    product,
    loading,
    error,
    fetchAllProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

export default useProduct;









// //useproductss
// import { useState, useEffect } from "react";
// import axios from "axios";

// const useProduct = () => {
//   const [products, setProducts] = useState([]);
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const API_BASE_URL = "http://localhost:9999/products"; // Thay đổi URL này theo cấu hình server của bạn

//   // Lấy tất cả sản phẩm
//   const fetchAllProducts = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${API_BASE_URL}/getAllProducts`);
//       setProducts(response.data);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Lấy sản phẩm theo ID
//   const fetchProductById = async (id) => {
//     setLoading(true);
//     try {
//       const response = await axios.get(`${API_BASE_URL}/getProductById/${id}`);
//       setProduct(response.data);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Tạo mới sản phẩm
//   const createProduct = async (productData) => {
//     setLoading(true);
//     try {
//       const response = await axios.post(
//         `${API_BASE_URL}/createProduct`,
//         productData
//       );
//       setProducts((prevProducts) => [
//         ...prevProducts,
//         response.data.newProduct,
//       ]);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Cập nhật sản phẩm
//   const updateProduct = async (id, updatedData) => {
//     setLoading(true);
//     try {
//       const response = await axios.put(
//         `${API_BASE_URL}/updateProduct/${id}`,
//         updatedData
//       );
//       setProducts((prevProducts) =>
//         prevProducts.map((prod) => (prod._id === id ? response.data : prod))
//       );
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Xóa sản phẩm
//   const deleteProduct = async (id) => {
//     setLoading(true);
//     try {
//       await axios.delete(`${API_BASE_URL}/deleteProduct/${id}`);
//       setProducts((prevProducts) =>
//         prevProducts.filter((prod) => prod._id !== id)
//       );
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     products,
//     product,
//     loading,
//     error,
//     fetchAllProducts,
//     fetchProductById,
//     createProduct,
//     updateProduct,
//     deleteProduct,
//   };
// };

// export default useProduct;
