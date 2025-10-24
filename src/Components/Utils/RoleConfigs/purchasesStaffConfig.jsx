// Cấu hình chức năng cho Purchases Staff
import React from "react";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import BusinessIcon from "@mui/icons-material/Business";
import HandshakeIcon from "@mui/icons-material/Handshake";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export const purchasesStaffFunctions = [
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
    title: "Nhập hàng",
    icon: <MoveToInboxIcon />,
    path: "/development?function=Nhập hàng",
    description: "Quản lý nhập hàng và đơn đặt hàng",
    category: "purchases"
  },
  {
    title: "Dashboard Mua Hàng",
    icon: <AnalyticsIcon />,
    path: "/purchases",
    description: "Thống kê và báo cáo mua hàng",
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

export const purchasesStaffQuickActions = [
  {
    title: "Đặt hàng",
    icon: <MoveToInboxIcon />,
    path: "/development?function=Đặt hàng",
    color: "#4CAF50"
  },
  {
    title: "Nhà cung cấp",
    icon: <BusinessIcon />,
    path: "/supplier",
    color: "#2196F3"
  },
  {
    title: "Thống kê",
    icon: <AnalyticsIcon />,
    path: "/purchases",
    color: "#FF9800"
  }
];
