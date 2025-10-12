// Cấu hình chức năng cho Warehouse Staff
import React from "react";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import HandshakeIcon from "@mui/icons-material/Handshake";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export const warehouseStaffFunctions = [
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
    path: "/suppliers",
    description: "Quản lý thông tin nhà cung cấp",
    category: "core"
  },
  {
    title: "Kiểm kê",
    icon: <FactCheckIcon />,
    path: "/development?function=Kiểm kê",
    description: "Kiểm kê tồn kho và quản lý kho",
    category: "warehouse"
  },
  {
    title: "Dashboard Kho",
    icon: <AnalyticsIcon />,
    path: "/warehouse",
    description: "Thống kê và báo cáo kho",
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

export const warehouseStaffQuickActions = [
  {
    title: "Kiểm kê",
    icon: <FactCheckIcon />,
    path: "/development?function=Kiểm kê",
    color: "#4CAF50"
  },
  {
    title: "Tồn kho",
    icon: <Inventory2Icon />,
    path: "/warehouse",
    color: "#2196F3"
  },
  {
    title: "Thống kê",
    icon: <AnalyticsIcon />,
    path: "/warehouse",
    color: "#FF9800"
  }
];
