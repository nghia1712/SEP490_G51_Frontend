import React, { useEffect, useState, useCallback } from "react";
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
import salesOrderAPI from "../../API/salesOrderAPI";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useNavigate } from "react-router-dom";
import getUserRoleFromToken from "../../Utils/getUserRoleFromToken";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const normalizeOrderCode = (code) => {
  if (!code && code !== 0) return "";
  return String(code).trim().toUpperCase();
};

const extractOrderCodeFromMessage = (message) => {
  if (!message) return "";
  const match = message.match(/SO[0-9]+/i);
  return match?.[0]?.trim().toUpperCase() || "";
};

export default function NotificationMenu() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tab, setTab] = useState(0); // 0: all, 1: unread
  const [userRole, setUserRole] = useState(null);
  const [clickedNotifications, setClickedNotifications] = useState(new Set());

  const currentToken = localStorage.getItem("authToken");

  const fetchNotifications = useCallback(async () => {
    if (!currentToken) return;
    try {
      const res = await notificationAPI.getUserNotifications();
      const notificationList = Array.isArray(res.data.data)
        ? res.data.data
        : [];
      setNotifications(notificationList);

    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [currentToken]);

  useEffect(() => {
    setUserRole(getUserRoleFromToken());
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleOpen = async (event) => {
    setAnchorEl(event.currentTarget);
    await fetchNotifications();
  };
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

    const customerProfileMatch = n.message?.match(/Khách hàng.*id\s+([a-f0-9-]+)/i);
    if (
      customerProfileMatch &&
      (userRole === "admin" || userRole === "manager")
    ) {
      const userId = customerProfileMatch[1];
      handleClose();
      navigate("/admin/users/customer", { state: { openUserId: userId } });
      return;
    }

    let poId = null;
    let state = {};

    if (/yêu cầu báo giá/i.test(n.message || "")) {
      handleClose();
      if (userRole === "sales_staff") {
        // Parse RequestCode từ message cho sales staff
        const message = n.message || "";
        console.log("NotificationMenu (Sales) - Message:", message);
        
        let match = message.match(/RSQ-([A-F0-9]{8})/i);
        if (!match) {
          match = message.match(/RSQ-([A-Z0-9]+)/i);
        }
        if (!match) {
          match = message.match(/(RSQ-[A-Z0-9]+)/i);
        }
        
        if (match && match[0]) {
          const requestCode = match[0].trim().toUpperCase();
          console.log("NotificationMenu (Sales) - Parsed requestCode:", requestCode);
          
          try {
            const requestListResponse = await requestSalesQuotationAPI.viewList();
            if (requestListResponse?.data?.data) {
              const requestList = Array.isArray(requestListResponse.data.data) 
                ? requestListResponse.data.data 
                : [];
              
              const matchingRequest = requestList.find(
                (r) => {
                  const code = String(r.RequestCode || r.requestCode || '').trim().toUpperCase();
                  return code === requestCode;
                }
              );
              
              if (matchingRequest) {
                const rsqId = matchingRequest.Id || matchingRequest.id;
                console.log("NotificationMenu (Sales) - Found matching request with rsqId:", rsqId);
                navigate("/request-quotation", { 
                  state: { openRsqId: Number(rsqId) } 
                });
                return;
              }
            }
          } catch (err) {
            console.error("NotificationMenu (Sales) - Error:", err);
          }
        }
        // Fallback: navigate to request quotation page
        navigate("/request-quotation");
      } else if (userRole === "customer") {
        // Parse RequestCode từ message: "Yêu cầu báo giá RSQ-D89A2F89"
        // Thử nhiều pattern để parse RequestCode
        const message = n.message || "";
        console.log("NotificationMenu - Full notification:", n);
        console.log("NotificationMenu - Message:", message);
        
        // Pattern 1: RSQ- theo sau là 8 ký tự hex
        let match = message.match(/RSQ-([A-F0-9]{8})/i);
        // Pattern 2: RSQ- theo sau là bất kỳ ký tự nào
        if (!match) {
          match = message.match(/RSQ-([A-Z0-9]+)/i);
        }
        // Pattern 3: Tìm RSQ ở bất kỳ đâu trong message
        if (!match) {
          match = message.match(/(RSQ-[A-Z0-9]+)/i);
        }
        
        console.log("NotificationMenu - Match result:", match);
        
        if (match && match[0]) {
          const requestCode = match[0].trim().toUpperCase(); // RSQ-D89A2F89
          console.log("NotificationMenu - Parsed requestCode:", requestCode);
          
          try {
            // Tìm rsqId từ RequestCode
            const requestListResponse = await requestSalesQuotationAPI.viewList();
            console.log("NotificationMenu - Request list response:", requestListResponse);
            
            if (requestListResponse?.data?.data) {
              const requestList = Array.isArray(requestListResponse.data.data) 
                ? requestListResponse.data.data 
                : [];
              
              console.log("NotificationMenu - Request list length:", requestList.length);
              console.log("NotificationMenu - All request codes:", requestList.map(r => (r.RequestCode || r.requestCode || '').toUpperCase()));
              
              // Tìm request matching với RequestCode (case-insensitive)
              const matchingRequest = requestList.find(
                (r) => {
                  const code = String(r.RequestCode || r.requestCode || '').trim().toUpperCase();
                  return code === requestCode;
                }
              );
              
              if (matchingRequest) {
                const rsqId = matchingRequest.Id || matchingRequest.id;
                console.log("NotificationMenu - Found matching request with rsqId:", rsqId, "for code:", requestCode);
                // Navigate đến trang request quotation với rsqId trong state để tự động mở dialog chi tiết
                navigate("/customer/request-quotation", { 
                  state: { openRsqId: Number(rsqId) } 
                });
                return;
              } else {
                console.warn("NotificationMenu - Request not found with code:", requestCode);
                console.warn("NotificationMenu - Available codes:", requestList.map(r => (r.RequestCode || r.requestCode || '').toUpperCase()));
                // Fallback: navigate to customer request quotation page
                navigate("/customer/request-quotation");
                return;
              }
            } else {
              console.warn("NotificationMenu - No data in response");
              navigate("/customer/request-quotation");
              return;
            }
          } catch (err) {
            console.error("NotificationMenu - Error handling request quotation notification:", err);
            console.error("NotificationMenu - Error details:", err.response?.data || err.message);
            // Fallback: navigate to customer request quotation page
            navigate("/customer/request-quotation");
            return;
          }
        } else {
          console.warn("NotificationMenu - Could not parse RequestCode from message:", message);
          // Không parse được RequestCode, chỉ navigate đến trang danh sách
          navigate("/customer/request-quotation");
        }
      }
      return;
    }

    const messageText = n.message || "";
    const parsedOrderCode = extractOrderCodeFromMessage(messageText);
    const isApprovedMessage = /chấp thuận/i.test(messageText);
    const isRejectedMessage = /từ chối/i.test(messageText);
    const isOrderDecisionNotification =
      userRole === "customer" &&
      parsedOrderCode &&
      (isApprovedMessage || isRejectedMessage);

    if (isOrderDecisionNotification) {
      handleClose();
      const orderCode = parsedOrderCode;
      console.log("NotificationMenu (Customer) - Parsed orderCode:", orderCode);

      try {
        const orderListResponse = await salesOrderAPI.myListSalesOrder();
        if (orderListResponse?.data?.data) {
          const orderList = Array.isArray(orderListResponse.data.data)
            ? orderListResponse.data.data
            : [];

          const matchingOrder = orderList.find((order) => {
            const code = normalizeOrderCode(
              order.SalesOrderCode ||
                order.salesOrderCode ||
                order.OrderCode ||
                order.orderCode ||
                order.Code ||
                order.code ||
                "",
            );
            return code === orderCode;
          });

          if (matchingOrder) {
            const orderId =
              matchingOrder.SalesOrderId ||
              matchingOrder.salesOrderId ||
              matchingOrder.Id ||
              matchingOrder.id;
            if (orderId) {
              const navigationState = isRejectedMessage
                ? { openRejectOrderId: Number(orderId) }
                : { openOrderId: Number(orderId) };
              navigate("/customer/orders", {
                state: navigationState,
              });
              return;
            }
          } else {
            console.warn(
              "NotificationMenu (Customer) - Order not found with code:",
              orderCode,
            );
          }
        } else {
          console.warn("NotificationMenu (Customer) - No orders data found");
        }
      } catch (err) {
        console.error(
          "NotificationMenu (Customer) - Error handling order notification:",
          err,
        );
      }
      navigate("/customer/orders");
      return;
    }

    if (
      userRole === "customer" &&
      /báo giá mới/i.test(n.message || "")
    ) {
      handleClose();
      try {
        // Parse QuotationCode từ message: "Báo giá mới SQ-20251122-D8863FDA"
        const message = n.message || "";
        console.log("NotificationMenu (Customer) - Message for new quotation:", message);
        
        // Pattern 1: SQ- theo sau là date và code
        let match = message.match(/SQ-([A-Z0-9-]+)/i);
        // Pattern 2: Tìm SQ ở bất kỳ đâu trong message
        if (!match) {
          match = message.match(/(SQ-[A-Z0-9-]+)/i);
        }
        
        console.log("NotificationMenu (Customer) - Match result:", match);
        
        if (match && match[0]) {
          const quotationCode = match[0].trim().toUpperCase(); // SQ-20251122-D8863FDA
          console.log("NotificationMenu (Customer) - Parsed quotationCode:", quotationCode);
          
          // Tìm sqId từ QuotationCode
          const quotationListResponse = await salesQuotationAPI.viewList();
          console.log("NotificationMenu (Customer) - Quotation list response:", quotationListResponse);
          
          if (quotationListResponse?.data?.data) {
            const quotationList = Array.isArray(quotationListResponse.data.data) 
              ? quotationListResponse.data.data 
              : [];
            
            console.log("NotificationMenu (Customer) - Quotation list length:", quotationList.length);
            console.log("NotificationMenu (Customer) - All quotation codes:", quotationList.map(q => (q.QuotationCode || q.quotationCode || '').toUpperCase()));
            
            // Tìm quotation matching với QuotationCode (case-insensitive)
            const matchingQuotation = quotationList.find(
              (q) => {
                const code = String(q.QuotationCode || q.quotationCode || '').trim().toUpperCase();
                return code === quotationCode;
              }
            );
            
            if (matchingQuotation) {
              const sqId = matchingQuotation.Id || matchingQuotation.id;
              console.log("NotificationMenu (Customer) - Found matching quotation with sqId:", sqId, "for code:", quotationCode);
              // Navigate đến trang request quotation với sqId trong state để tự động mở dialog chi tiết báo giá
              navigate("/customer/request-quotation", { 
                state: { sqId: Number(sqId) } 
              });
              return;
            } else {
              console.warn("NotificationMenu (Customer) - Quotation not found with code:", quotationCode);
              console.warn("NotificationMenu (Customer) - Available codes:", quotationList.map(q => (q.QuotationCode || q.quotationCode || '').toUpperCase()));
              // Fallback: navigate to customer request quotation page
              navigate("/customer/request-quotation");
              return;
            }
          } else {
            console.warn("NotificationMenu (Customer) - No data in response");
            navigate("/customer/request-quotation");
            return;
          }
        } else {
          console.warn("NotificationMenu (Customer) - Could not parse QuotationCode from message:", message);
          // Không parse được QuotationCode, chỉ navigate đến trang danh sách
          navigate("/customer/request-quotation");
        }
      } catch (err) {
        console.error("NotificationMenu (Customer) - Error handling new quotation notification:", err);
        console.error("NotificationMenu (Customer) - Error details:", err.response?.data || err.message);
        // Fallback: navigate to customer request quotation page
        navigate("/customer/request-quotation");
      }
      return;
    }

    // Xử lý notification khi khách gửi đơn hàng (cho sales_staff)
    if (userRole === "sales_staff" && /đơn hàng/i.test(n.message || "")) {
      handleClose();
          const message = n.message || "";
          const orderCode = extractOrderCodeFromMessage(message);
          if (orderCode) {
            console.log("NotificationMenu (Sales) - Parsed orderCode:", orderCode);
        try {
          const orderListResponse = await salesOrderAPI.listSalesOrder();
          if (orderListResponse?.data?.data) {
            const orderList = Array.isArray(orderListResponse.data.data)
              ? orderListResponse.data.data
              : [];

            const matchingOrder = orderList.find((order) => {
              const code = String(
                order.SalesOrderCode ||
                  order.salesOrderCode ||
                  order.OrderCode ||
                  order.orderCode ||
                  order.Code ||
                  order.code ||
                  ""
              )
                .trim()
                .toUpperCase();
              return code === orderCode;
            });

            if (matchingOrder) {
              const orderId =
                matchingOrder.SalesOrderId ||
                matchingOrder.salesOrderId ||
                matchingOrder.Id ||
                matchingOrder.id;
              if (orderId) {
                console.log(
                  "NotificationMenu (Sales) - Found matching orderId:",
                  orderId
                );
                navigate("/sales/orders", {
                  state: { openOrderId: Number(orderId) },
                });
                return;
              }
            } else {
              console.warn(
                "NotificationMenu (Sales) - Order not found with code:",
                orderCode
              );
            }
          } else {
            console.warn("NotificationMenu (Sales) - No orders data found");
          }
        } catch (err) {
          console.error(
            "NotificationMenu (Sales) - Error handling order notification:",
            err
          );
        }
      } else {
        console.warn(
          "NotificationMenu (Sales) - Could not parse order code from message:",
          message
        );
      }
      navigate("/sales/orders");
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
                flexShrink: 0,
              }}
            />
          )}
          <Tooltip title={n.message} arrow>
            <Typography
              variant="body2"
              sx={{
                overflow: "hidden",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                textOverflow: "ellipsis",
                whiteSpace: "normal",
              }}
            >
              {n.message}
            </Typography>
          </Tooltip>
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
