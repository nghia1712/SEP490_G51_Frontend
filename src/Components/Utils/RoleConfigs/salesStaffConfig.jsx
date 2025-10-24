// Cấu hình chức năng cho Sales Staff
import React from "react";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import HandshakeIcon from "@mui/icons-material/Handshake";
import OutputIcon from "@mui/icons-material/Output";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export const salesStaffFunctions = [
  {
    title: "Quản lý thuốc",
    icon: <Inventory2Icon />,
    path: "/product",
    description: "Quản lý danh sách thuốc và thông tin chi tiết",
    category: "core"
  },
  {
    title: "Danh mục thuốc",
    icon: <CategoryIcon />,
    path: "/category",
    description: "Quản lý các danh mục thuốc",
    category: "core"
  },
  {
    title: "Nhà Cung Cấp",
    icon: <BusinessIcon />,
    path: "/supplier",
    description: "Quản lý thông tin nhà cung cấp",
    category: "core"
  },
  {
    title: "Xuất hàng",
    icon: <OutputIcon />,
    path: "/development?function=Xuất hàng",
    description: "Quản lý xuất hàng và bán thuốc",
    category: "sales"
  },
  {
    title: "Dashboard Bán Hàng",
    icon: <AnalyticsIcon />,
    path: "/sales",
    description: "Thống kê và báo cáo bán hàng",
    category: "dashboard"
  },
  {
    title: "Liên hệ",
    icon: <HandshakeIcon />,
    path: "/contact",
    description: "Thông tin liên hệ và hỗ trợ",
    category: "support"
  }
];

export const salesStaffQuickActions = [
  {
    title: "Bán thuốc",
    icon: <OutputIcon />,
    path: "/development?function=Bán thuốc",
    color: "#4CAF50"
  },
  {
    title: "Tìm thuốc",
    icon: <Inventory2Icon />,
    path: "/product",
    color: "#2196F3"
  },
  {
    title: "Thống kê",
    icon: <AnalyticsIcon />,
    path: "/sales",
    color: "#FF9800"
  }
];
