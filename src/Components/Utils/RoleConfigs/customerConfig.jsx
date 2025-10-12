// Cấu hình chức năng cho Customer
import React from "react";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ViewListIcon from "@mui/icons-material/ViewList";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PersonIcon from "@mui/icons-material/Person";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PaymentIcon from "@mui/icons-material/Payment";

export const customerFunctions = [
  {
    title: "Tìm kiếm thuốc",
    icon: <Inventory2Icon />,
    path: "/search-medicine",
    description: "Tìm kiếm và xem thông tin thuốc",
    category: "search"
  },
  {
    title: "Giỏ hàng",
    icon: <ShoppingCartIcon />,
    path: "/cart",
    description: "Xem và quản lý giỏ hàng",
    category: "shopping"
  },
  {
    title: "Đơn hàng của tôi",
    icon: <ViewListIcon />,
    path: "/my-orders",
    description: "Xem lịch sử đơn hàng",
    category: "orders"
  },
  {
    title: "Lịch sử mua hàng",
    icon: <AnalyticsIcon />,
    path: "/purchase-history",
    description: "Xem chi tiết lịch sử mua hàng",
    category: "history"
  },
  {
    title: "Thuốc yêu thích",
    icon: <FavoriteIcon />,
    path: "/favorites",
    description: "Danh sách thuốc đã lưu",
    category: "favorites"
  },
  {
    title: "Thanh toán",
    icon: <PaymentIcon />,
    path: "/payment",
    description: "Quản lý phương thức thanh toán",
    category: "payment"
  },
  {
    title: "Thông tin cá nhân",
    icon: <PersonIcon />,
    path: "/profile",
    description: "Cập nhật thông tin cá nhân",
    category: "profile"
  },
  {
    title: "Liên hệ",
    icon: <HandshakeIcon />,
    path: "/contact",
    description: "Thông tin liên hệ và hỗ trợ",
    category: "support"
  }
];

export const customerQuickActions = [
  {
    title: "Tìm thuốc",
    icon: <Inventory2Icon />,
    path: "/search-medicine",
    color: "#4CAF50"
  },
  {
    title: "Giỏ hàng",
    icon: <ShoppingCartIcon />,
    path: "/cart",
    color: "#2196F3"
  },
  {
    title: "Đơn hàng",
    icon: <ViewListIcon />,
    path: "/my-orders",
    color: "#FF9800"
  }
];
