// Cấu hình chức năng cho Manager
import React from "react";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import HandshakeIcon from "@mui/icons-material/Handshake";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import OutputIcon from "@mui/icons-material/Output";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PeopleIcon from "@mui/icons-material/People";
import ViewListIcon from "@mui/icons-material/ViewList";

export const managerFunctions = [
  // Core Management
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
  
  // Operations
  {
    title: "Nhập hàng",
    icon: <MoveToInboxIcon />,
    path: "/receipts",
    description: "Quản lý nhập hàng và đơn đặt hàng",
    category: "operations"
  },
  {
    title: "Xuất hàng",
    icon: <OutputIcon />,
    path: "/export",
    description: "Quản lý xuất hàng và bán thuốc",
    category: "operations"
  },
  {
    title: "Kiểm kê",
    icon: <FactCheckIcon />,
    path: "/stocktaking",
    description: "Kiểm kê tồn kho và quản lý kho",
    category: "operations"
  },
  
  // Dashboards
  {
    title: "Dashboard Bán Hàng",
    icon: <AnalyticsIcon />,
    path: "/sales",
    description: "Thống kê và báo cáo bán hàng",
    category: "dashboard"
  },
  {
    title: "Dashboard Mua Hàng",
    icon: <AnalyticsIcon />,
    path: "/purchases",
    description: "Thống kê và báo cáo mua hàng",
    category: "dashboard"
  },
  {
    title: "Dashboard Kho",
    icon: <AnalyticsIcon />,
    path: "/warehouse",
    description: "Thống kê và báo cáo kho",
    category: "dashboard"
  },
  
  // Management
  {
    title: "Quản lý nhân viên",
    icon: <PeopleIcon />,
    path: "/users",
    description: "Quản lý tài khoản nhân viên",
    category: "management"
  },
  {
    title: "Giao dịch",
    icon: <ViewListIcon />,
    path: "/list-transaction",
    description: "Xem lịch sử giao dịch",
    category: "management"
  },
  {
    title: "Báo cáo tổng hợp",
    icon: <AnalyticsIcon />,
    path: "/reports",
    description: "Xem báo cáo tổng hợp hệ thống",
    category: "management"
  },
  
  // Support
  {
    title: "Liên hệ",
    icon: <HandshakeIcon />,
    path: "/contact",
    description: "Thông tin liên hệ và hỗ trợ",
    category: "support"
  }
];

export const managerQuickActions = [
  {
    title: "Tổng quan",
    icon: <AnalyticsIcon />,
    path: "/sales",
    color: "#4CAF50"
  },
  {
    title: "Nhân viên",
    icon: <PeopleIcon />,
    path: "/users",
    color: "#2196F3"
  },
  {
    title: "Giao dịch",
    icon: <ViewListIcon />,
    path: "/list-transaction",
    color: "#FF9800"
  }
];
