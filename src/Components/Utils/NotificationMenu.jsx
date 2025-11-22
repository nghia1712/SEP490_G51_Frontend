import React, { useEffect, useState } from "react";
import {
  IconButton,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
  Box,
  Typography,
  Tabs,
  Tab,
  Avatar,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import notificationAPI from "../../API/notificationAPI";
import poAPI from "../../API/poAPI";
import salesQuotationAPI from "../../API/salesQuotationAPI";
import requestSalesQuotationAPI from "../../API/requestSalesQuotationAPI";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useNavigate } from "react-router-dom";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

dayjs.extend(relativeTime);
dayjs.extend(utc);

export default function NotificationMenu() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tab, setTab] = useState(0); // 0: all, 1: unread
  const [userRole, setUserRole] = useState(null);
  const [clickedNotifications, setClickedNotifications] = useState(new Set());

  const currentToken = localStorage.getItem("authToken");

  useEffect(() => {
    setUserRole(getUserRoleFromToken());
  }, []);

  useEffect(() => {
    if (currentToken) {
      const fetchNotifications = async () => {
        try {
          const res = await notificationAPI.getUserNotifications();
          setNotifications(Array.isArray(res.data.data) ? res.data.data : []);
        } catch (err) {
          console.error("Error fetching notifications:", err);
        }
      };
      fetchNotifications();
    }
  }, [currentToken]);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleTabChange = (e, newValue) => setTab(newValue);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      try {
        await handleMarkAsRead(n.id);
      } catch (err) {
        console.error("Mark read failed, continue navigation", err);
      }
    }

    let poId = null;
    let state = {};

    if (/yêu cầu báo giá/i.test(n.message || "")) {
      handleClose();
      if (userRole === "sales_staff") {
        navigate("/request-quotation");
      } else if (userRole === "customer") {
        navigate("/customer/request-quotation");
      }
      return;
    }

    if (
      userRole === "customer" &&
      /báo giá mới/i.test(n.message || "")
    ) {
      handleClose();
      navigate("/customer/request-quotation");
      return;
    }

    // Xử lý notification về bình luận mới trong báo giá (cho sales_staff)
    if (userRole === "sales_staff" && /bình luận mới trong báo giá/i.test(n.message || "")) {
      handleClose();
      try {
        // Parse QuotationCode từ message: "Bạn có 1 bình luận mới trong báo giá SQ-20251122-D8863FDA"
        const match = n.message.match(/báo giá\s+([A-Z0-9-]+)/i);
        if (match && match[1]) {
          const quotationCode = match[1];
          console.log("NotificationMenu - Parsed quotationCode:", quotationCode);
          
          // Tìm sqId từ QuotationCode
          const quotationListResponse = await salesQuotationAPI.viewList();
          if (quotationListResponse.data && quotationListResponse.data.data) {
            const quotationList = Array.isArray(quotationListResponse.data.data) 
              ? quotationListResponse.data.data 
              : [];
            
            const matchingQuotation = quotationList.find(
              (q) => (q.QuotationCode || q.quotationCode) === quotationCode
            );
            
            if (matchingQuotation) {
              const sqId = matchingQuotation.Id || matchingQuotation.id;
              console.log("NotificationMenu - Found sqId:", sqId);
              navigate("/sales-quotation", { state: { openQuotationId: sqId } });
              return;
            } else {
              console.warn("NotificationMenu - Quotation not found with code:", quotationCode);
              // Fallback: navigate to sales-quotation page anyway
              navigate("/sales-quotation");
              return;
            }
          }
        } else {
          console.warn("NotificationMenu - Could not parse quotationCode from message:", n.message);
          // Fallback: navigate to sales-quotation page
          navigate("/sales-quotation");
          return;
        }
      } catch (err) {
        console.error("NotificationMenu - Error handling comment notification:", err);
        // Fallback: navigate to sales-quotation page
        navigate("/sales-quotation");
      }
      return;
    }

    // Xử lý notification về bình luận mới trong báo giá (cho customer)
    if (userRole === "customer" && /bình luận mới trong báo giá/i.test(n.message || "")) {
      handleClose();
      try {
        // Parse QuotationCode từ message: "Bạn có 1 bình luận mới trong báo giá SQ-20251122-D8863FDA"
        const match = n.message.match(/báo giá\s+([A-Z0-9-]+)/i);
        if (match && match[1]) {
          const quotationCode = match[1];
          console.log("NotificationMenu (Customer) - Parsed quotationCode:", quotationCode);
          
          // Tìm sqId từ QuotationCode
          const quotationListResponse = await salesQuotationAPI.viewList();
          if (quotationListResponse.data && quotationListResponse.data.data) {
            const quotationList = Array.isArray(quotationListResponse.data.data) 
              ? quotationListResponse.data.data 
              : [];
            
            const matchingQuotation = quotationList.find(
              (q) => (q.QuotationCode || q.quotationCode) === quotationCode
            );
            
            if (matchingQuotation) {
              const sqId = matchingQuotation.Id || matchingQuotation.id;
              console.log("NotificationMenu (Customer) - Found sqId:", sqId);
              
              // Navigate đến trang request quotation với sqId trong state để tự động mở dialog
              navigate("/customer/request-quotation", { state: { sqId } });
              return;
            } else {
              console.warn("NotificationMenu (Customer) - Quotation not found with code:", quotationCode);
              // Fallback: navigate to customer request quotation page
              navigate("/customer/request-quotation");
              return;
            }
          }
        } else {
          console.warn("NotificationMenu (Customer) - Could not parse quotationCode from message:", n.message);
          // Fallback: navigate to customer request quotation page
          navigate("/customer/request-quotation");
          return;
        }
      } catch (err) {
        console.error("NotificationMenu (Customer) - Error handling comment notification:", err);
        // Fallback: navigate to customer request quotation page
        navigate("/customer/request-quotation");
      }
      return;
    }

    if (userRole === "warehouse_staff") {

      const match = n.message.match(
        /yêu cầu Tạo phiếu nhập kho cho đơn hàng[:\s]+(\d+)/i
      );
      if (match) poId = Number(match[1]);
      console.log("Parsed poId:", poId);

      if (poId) {
        state = { poId, autoCreateGRN: true };

        try {
          const res = await poAPI.getFullyReceived();
          console.log("API getFullyReceived trả về:", res);
          const fullyReceivedPOs = (res.data || []).map((po) => po.poid);
          if (fullyReceivedPOs.includes(poId)) {
            handleClose();
            return;
          }
        } catch (err) {
          handleClose();
          return;
        }
      }
    }

    if (userRole === "accountant_staff") {
      const match = n.message.match(/Đơn hàng[:\s]+(\d+).*yêu cầu thanh toán/i);
      if (match) poId = Number(match[1]);
      if (poId) state = { poId, autoOpenDeposit: true };
    }

    console.log("Notification clicked:", n.message);
    console.log("Parsed poId:", poId);
    console.log("State to navigate:", state);

    if (poId) {
      navigate("/po", { state });
    }

    handleClose();
  };

  const filteredNotifications =
    tab === 1 ? notifications.filter((n) => !n.isRead) : notifications;

  const now = dayjs();
  const today = filteredNotifications.filter((n) =>
    dayjs(n.createdAt).isSame(now, "day")
  );
  const earlier = filteredNotifications.filter(
    (n) => !dayjs(n.createdAt).isSame(now, "day")
  );

  const renderNotification = (n) => (
    <MenuItem
      key={n.id}
      onClick={() => handleNotificationClick(n)}
      sx={{
        alignItems: "flex-start",
        backgroundColor: n.isRead ? "transparent" : "rgba(25, 118, 210, 0.08)",
        "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.15)" },
        py: 1,
      }}
    >
      <Avatar src={n.iconUrl || ""} sx={{ width: 32, height: 32, mr: 1 }} />
      <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.3 }}>
          {!n.isRead && (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mr: 1,
              }}
            />
          )}
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
            title={n.message}
          >
            {n.message}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {dayjs.utc(n.createdAt).local().fromNow()}
        </Typography>
      </Box>
    </MenuItem>
  );

  return (
    <>
      <Tooltip title="Thông báo">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge
            badgeContent={notifications.filter((n) => !n.isRead).length}
            color="error"
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 350, maxHeight: 500, px: 2, py: 1 } }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
          <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Tất cả" />
            <Tab label="Chưa đọc" />
          </Tabs>
        </Box>

        {today.length > 0 && (
          <Box>
            <Typography variant="caption" sx={{ mb: 0.5 }}>
              Mới
            </Typography>
            {today.map(renderNotification)}
          </Box>
        )}

        {earlier.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ mb: 0.5 }}>
              Trước đó
            </Typography>
            {earlier.map(renderNotification)}
          </Box>
        )}
      </Menu>
    </>
  );
}
