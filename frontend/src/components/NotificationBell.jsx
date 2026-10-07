import { apiUrl } from "../config/api";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CheckCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import "./NotificationBell.css";


const API_URL =
  apiUrl("/api/notifications/");


// Check deadline alerts every 5 minutes
const DEADLINE_CHECK_INTERVAL =
  5 * 60 * 1000;


// Refresh unread count every 30 seconds
const NOTIFICATION_REFRESH_INTERVAL =
  30 * 1000;


function NotificationBell() {
  const navigate = useNavigate();

  const wrapperRef = useRef(null);

  const [open, setOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(false);


  const token =
    localStorage.getItem("token");


  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getHeaders = () => ({
    Authorization:
      `Token ${token}`,
  });


  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications =
    async () => {

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            API_URL,
            {
              headers:
                getHeaders(),
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const list =
          Array.isArray(data)
            ? data
            : data.results || [];

        setNotifications(
          list
        );

      } catch (error) {
        console.error(
          "Notification loading error:",
          error
        );
      }
    };


  // =====================================================
  // FETCH UNREAD COUNT
  // =====================================================

  const fetchUnreadCount =
    async () => {

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}unread-count/`,
            {
              headers:
                getHeaders(),
            }
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setUnreadCount(
          data.unread_count || 0
        );

      } catch (error) {
        console.error(
          "Unread count error:",
          error
        );
      }
    };


  // =====================================================
  // AUTOMATIC DEADLINE CHECK
  // =====================================================

  const checkDeadlines =
    async () => {

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}check-deadlines/`,
            {
              method: "POST",

              headers:
                getHeaders(),
            }
          );

        if (!response.ok) {
          console.error(
            "Deadline check failed:",
            response.status
          );

          return;
        }

        // Refresh notification UI after
        // deadline notifications are generated.

        await Promise.all([
          fetchUnreadCount(),
          fetchNotifications(),
        ]);

      } catch (error) {
        console.error(
          "Automatic deadline check error:",
          error
        );
      }
    };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const initialize =
      async () => {

        // Check Tickets, Warranties,
        // and Licenses automatically.

        await checkDeadlines();

        // Refresh current notification data.

        await Promise.all([
          fetchUnreadCount(),
          fetchNotifications(),
        ]);
      };

    initialize();

  }, [token]);


  // =====================================================
  // REGULAR NOTIFICATION REFRESH
  // =====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const refreshInterval =
      setInterval(
        () => {
          fetchUnreadCount();

          if (open) {
            fetchNotifications();
          }
        },
        NOTIFICATION_REFRESH_INTERVAL
      );

    return () => {
      clearInterval(
        refreshInterval
      );
    };

  }, [token, open]);


  // =====================================================
  // AUTOMATIC DEADLINE INTERVAL
  // =====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const deadlineInterval =
      setInterval(
        () => {
          checkDeadlines();
        },
        DEADLINE_CHECK_INTERVAL
      );

    return () => {
      clearInterval(
        deadlineInterval
      );
    };

  }, [token]);


  // =====================================================
  // OUTSIDE CLICK
  // =====================================================

  useEffect(() => {
    const handleOutsideClick =
      (event) => {

        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(
            event.target
          )
        ) {
          setOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };

  }, []);


  // =====================================================
  // TOGGLE DROPDOWN
  // =====================================================

  const handleBellClick =
    async () => {

      const nextOpen =
        !open;

      setOpen(
        nextOpen
      );

      if (nextOpen) {
        setLoading(true);

        await Promise.all([
          fetchNotifications(),
          fetchUnreadCount(),
        ]);

        setLoading(false);
      }
    };


  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const handleNotificationClick =
    async (
      notification
    ) => {

      if (!token) {
        return;
      }

      try {
        if (
          !notification.is_read
        ) {
          const response =
            await fetch(
              `${API_URL}${notification.id}/mark-read/`,
              {
                method: "POST",

                headers:
                  getHeaders(),
              }
            );

          if (response.ok) {
            setNotifications(
              (previous) =>
                previous.map(
                  (item) =>
                    item.id ===
                    notification.id
                      ? {
                          ...item,
                          is_read: true,
                        }
                      : item
                )
            );

            setUnreadCount(
              (previous) =>
                Math.max(
                  previous - 1,
                  0
                )
            );
          }
        }

        setOpen(false);

        if (
          notification.link
        ) {
          navigate(
            notification.link
          );
        }

      } catch (error) {
        console.error(
          "Mark notification read error:",
          error
        );
      }
    };


  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const handleMarkAllRead =
    async () => {

      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}mark-all-read/`,
            {
              method: "POST",

              headers:
                getHeaders(),
            }
          );

        if (!response.ok) {
          return;
        }

        setNotifications(
          (previous) =>
            previous.map(
              (notification) => ({
                ...notification,
                is_read: true,
              })
            )
        );

        setUnreadCount(0);

      } catch (error) {
        console.error(
          "Mark all notifications error:",
          error
        );
      }
    };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate =
    (dateValue) => {

      if (!dateValue) {
        return "";
      }

      const date =
        new Date(
          dateValue
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "";
      }

      return (
        date.toLocaleString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }
        )
      );
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="notification-wrapper"
      ref={wrapperRef}
    >

      {/* BELL */}

      <button
        type="button"
        className="notification-bell-button"
        onClick={
          handleBellClick
        }
        aria-label="Notifications"
        title="Notifications"
      >

        <Bell size={20} />

        {unreadCount > 0 && (

          <span className="notification-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>

        )}

      </button>


      {/* DROPDOWN */}

      {open && (

        <div className="notification-dropdown">

          {/* HEADER */}

          <div className="notification-dropdown-header">

            <div>

              <h3>
                Notifications
              </h3>

              <span>
                {unreadCount} unread
              </span>

            </div>


            {unreadCount > 0 && (

              <button
                type="button"
                className="mark-all-button"
                onClick={
                  handleMarkAllRead
                }
              >

                <CheckCheck
                  size={15}
                />

                Mark all read

              </button>

            )}

          </div>


          {/* LIST */}

          <div className="notification-list">

            {loading ? (

              <div className="notification-state">
                Loading notifications...
              </div>

            ) : notifications.length ===
              0 ? (

              <div className="notification-state">
                No notifications yet.
              </div>

            ) : (

              notifications.map(
                (notification) => (

                  <button
                    type="button"
                    key={
                      notification.id
                    }
                    className={`notification-item ${
                      !notification.is_read
                        ? "unread"
                        : ""
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                  >

                    <div className="notification-item-icon">

                      <Bell
                        size={18}
                      />

                    </div>


                    <div className="notification-item-content">

                      <div className="notification-item-title-row">

                        <strong>
                          {
                            notification.title
                          }
                        </strong>


                        {!notification.is_read && (

                          <span className="notification-unread-dot" />

                        )}

                      </div>


                      <p>
                        {
                          notification.message
                        }
                      </p>


                      <span className="notification-time">
                        {formatDate(
                          notification.created_at
                        )}
                      </span>

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </div>

      )}

    </div>
  );
}


export default NotificationBell;
