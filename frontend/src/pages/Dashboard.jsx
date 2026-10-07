import PageGuide from "../components/PageGuide";
/*Adjusted the Upcoming Due Dates*/

import { apiUrl } from "../config/api";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  MapPin,
  Monitor,
  ShieldCheck,
  KeyRound,
  Ticket,
  UserCog,
  UserRound,
  CreditCard,
  BarChart3,
  ClipboardList,
  CalendarDays,
  Settings,
  BookOpen,

  Search,
  LogOut,
  ChevronDown,
} from "lucide-react";

import expertLogo from "../assets/expert-technology-logo.png";
import NotificationBell from "../components/NotificationBell";
import "./Dashboard.css";


const DASHBOARD_API =
  apiUrl("/api/tickets/dashboard-stats/");

const TICKETS_API =
  apiUrl("/api/tickets/");

const PERMISSIONS_API =
  apiUrl("/api/access/me/permissions/");


const LOGOUT_API =
  apiUrl("/api/accounts/logout/");


function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const token =
    localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    user = null;
  }


  // =========================================
  // STATE
  // =========================================

  const [stats, setStats] =
    useState({
      total_tickets: 0,
      open_tickets: 0,
      resolved_tickets: 0,
      past_due_tickets: 0,

      status_counts: {
        open: 0,
        in_progress: 0,
        on_hold: 0,
        resolved: 0,
        closed: 0,
      },

      last_7_days: [],
      upcoming_jobs: [],
    });


  const [tickets, setTickets] =
    useState([]);


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [search, setSearch] =
    useState("");


  const [permissions, setPermissions] =
    useState(null);

  const [permissionActions, setPermissionActions] =
    useState({});


  const [currentRole, setCurrentRole] =
    useState("");

  const normalizedRole =
    String(currentRole || "")
      .trim()
      .toLowerCase();

  const isTechnician =
    normalizedRole === "technician";

  const canCreateTicket =
    Boolean(permissionActions?.can_create_tickets);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);


  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = async () => {
    try {
      if (token) {
        const response =
          await fetch(
            LOGOUT_API,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Token ${token}`,
              },
            }
          );

        if (!response.ok) {
          console.warn(
            "Backend logout failed:",
            response.status
          );
        }
      }
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      navigate("/login");
    }
  };


  // =========================================
  // LOAD PERMISSIONS
  // =========================================

  useEffect(() => {
    const loadPermissions =
      async () => {

        if (!token) {
          navigate("/login");
          return;
        }

        try {
          const response =
            await fetch(
              PERMISSIONS_API,
              {
                headers: {
                  Authorization:
                    `Token ${token}`,
                },
              }
            );


          if (
            response.status === 401
          ) {
            handleLogout();
            return;
          }


          if (!response.ok) {
            throw new Error(
              "Unable to load permissions."
            );
          }


          const data =
            await response.json();


          setPermissions(
            data.permissions || {}
          );

          setPermissionActions(
            data.actions || {}
          );


          setCurrentRole(
            data.role || ""
          );

        } catch (error) {
          console.error(
            "Permission loading error:",
            error
          );

          setPermissions({});
        }
      };


    loadPermissions();

  }, [token]);


  // =========================================
  // LOAD LIVE DASHBOARD DATA
  // =========================================

  useEffect(() => {
    const loadDashboard =
      async () => {

        if (!token) {
          navigate("/login");
          return;
        }


        try {
          setLoading(true);

          setError("");


          const [
            statsResponse,
            ticketsResponse,
          ] =
            await Promise.all([
              fetch(
                DASHBOARD_API,
                {
                  headers: {
                    Authorization:
                      `Token ${token}`,
                  },
                }
              ),

              fetch(
                TICKETS_API,
                {
                  headers: {
                    Authorization:
                      `Token ${token}`,
                  },
                }
              ),
            ]);


          if (
            statsResponse.status ===
            401 ||
            ticketsResponse.status ===
            401
          ) {
            handleLogout();
            return;
          }


          if (
            statsResponse.status ===
            403 ||
            ticketsResponse.status ===
            403
          ) {
            navigate(
              "/access-denied"
            );

            return;
          }


          if (
            !statsResponse.ok
          ) {
            throw new Error(
              "Unable to load dashboard statistics."
            );
          }


          if (
            !ticketsResponse.ok
          ) {
            throw new Error(
              "Unable to load tickets."
            );
          }


          const statsData =
            await statsResponse.json();


          const ticketsData =
            await ticketsResponse.json();


          setStats({
            total_tickets:
              statsData.total_tickets ||
              0,

            open_tickets:
              statsData.open_tickets ||
              0,

            resolved_tickets:
              statsData.resolved_tickets ||
              0,

            past_due_tickets:
              statsData.past_due_tickets ||
              0,

            status_counts: {
              open:
                statsData
                  .status_counts
                  ?.open || 0,

              in_progress:
                statsData
                  .status_counts
                  ?.in_progress || 0,

              on_hold:
                statsData
                  .status_counts
                  ?.on_hold || 0,

              resolved:
                statsData
                  .status_counts
                  ?.resolved || 0,

              closed:
                statsData
                  .status_counts
                  ?.closed || 0,
            },

            last_7_days:
              statsData.last_7_days ||
              [],

            upcoming_jobs:
              statsData.upcoming_jobs ||
              [],
          });


          setTickets(
            Array.isArray(
              ticketsData
            )
              ? ticketsData
              : ticketsData.results ||
              []
          );

        } catch (error) {
          console.error(
            "Dashboard loading error:",
            error
          );

          setError(
            "Unable to load live dashboard data."
          );

        } finally {
          setLoading(false);
        }
      };


    loadDashboard();

  }, [navigate, token]);


  // =========================================
  // MENU
  // =========================================

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      permission: "dashboard",
      group: "Platform",
    },

    {
      name: "Customers",
      icon: Users,
      path: "/customers",
      permission: "customers",
      group: "CRM",
    },

    {
      name: "Locations",
      icon: MapPin,
      path: "/locations",
      permission: "locations",
      group: "CRM",
    },

    {
      name: "Equipment",
      icon: Monitor,
      path: "/equipment",
      permission: "equipment",
      group: "Assets",
    },

    {
      name: "Warranties",
      icon: ShieldCheck,
      path: "/warranties",
      permission: "warranties",
      group: "Assets",
    },

    {
      name: "Licenses",
      icon: KeyRound,
      path: "/licenses",
      permission: "licenses",
      group: "Assets",
    },

    {
      name: "Tickets",
      icon: Ticket,
      path: "/tickets",
      permission: "tickets",
      group: "Operations",
    },

    {
      name: "Technicians",
      icon: UserCog,
      path: "/technicians",
      permission:
        "technicians",
      group:
        "Operations",
    },

    {
      name: "Billing",
      icon: CreditCard,
      path: "/billing",
      permission: "billing",
      group: "Operations",
    },

    {
      name: "Reports",
      icon: BarChart3,
      path: "/reports",
      permission: "reports",
      group: "Operations",
    },

    {
      name: "Audit Trail",
      icon: ClipboardList,
      path: "/audit-trail",
      permission: "audit_trail",
      group: "Operations",
    },

    {
      name: "Roles",
      icon: ShieldCheck,
      path: "/roles",
      permission: "roles",
      group: "Administration",
    },

    {
      name: "Users",
      icon: UserCog,
      path: "/users",
      permission: "users",
      group: "Administration",
    },

    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
      permission: "settings",
      group: "Administration",
    },

    {
      name: "Help & Documentation",
      icon: BookOpen,
      path: "/help",
      permission: null,
      group: "Administration",
    },
  ];


  // =========================================
  // SEARCH
  // =========================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();


    const value =
      search
        .trim()
        .toLowerCase();


    if (!value) {
      return;
    }


    if (
      value.includes(
        "customer"
      )
    ) {
      navigate("/customers");

    } else if (
      value.includes(
        "location"
      )
    ) {
      navigate("/locations");

    } else if (
      value.includes(
        "equipment"
      )
    ) {
      navigate("/equipment");

    } else if (
      value.includes(
        "warranty"
      )
    ) {
      navigate("/warranties");

    } else if (
      value.includes(
        "license"
      )
    ) {
      navigate("/licenses");

    } else if (
      value.includes(
        "technician"
      )
    ) {
      navigate("/technicians");

    } else if (
      value.includes(
        "billing"
      )
    ) {
      navigate("/billing");

    } else if (
      value.includes(
        "report"
      )
    ) {
      navigate("/reports");

    } else if (
      value.includes(
        "audit"
      )
    ) {
      navigate("/audit-trail");

    } else if (
      value.includes(
        "role"
      )
    ) {
      navigate("/roles");

    } else if (
      value.includes(
        "user"
      )
    ) {
      navigate("/users");

    } else {
      navigate("/tickets");
    }
  };


  // =========================================
  // WEEKLY BAR CHART
  // =========================================

  const maxDailyTickets =
    Math.max(
      ...stats.last_7_days.map(
        (item) =>
          Number(
            item.count || 0
          )
      ),

      1
    );


  const weeklyDateRange =
    useMemo(() => {

      const days =
        stats.last_7_days || [];


      if (!days.length) {
        return "";
      }


      const startDate =
        new Date(
          `${days[0].date}T00:00:00`
        );


      const endDate =
        new Date(
          `${days[days.length - 1].date}T00:00:00`
        );


      const startLabel =
        startDate.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        );


      const endLabel =
        endDate.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        );


      return `${startLabel} - ${endLabel}`;

    }, [stats.last_7_days]);


  // =========================================
  // STATUS DONUT
  // =========================================

  const statusTotal =
    stats.status_counts.open +
    stats.status_counts
      .in_progress +
    stats.status_counts.on_hold +
    stats.status_counts.resolved +
    stats.status_counts.closed;


  const percent = (
    value
  ) => {

    if (!statusTotal) {
      return 0;
    }


    return (
      (value / statusTotal) *
      100
    );
  };


  const openStop =
    percent(
      stats.status_counts.open
    );


  const progressStop =
    openStop +
    percent(
      stats.status_counts
        .in_progress
    );


  const holdStop =
    progressStop +
    percent(
      stats.status_counts
        .on_hold
    );


  const resolvedStop =
    holdStop +
    percent(
      stats.status_counts
        .resolved
    );


  const donutBackground =
    statusTotal === 0
      ? "#d8e0e8"
      : `conic-gradient(
          #22679b 0% ${openStop}%,
          #4ca3d5 ${openStop}% ${progressStop}%,
          #9bacc0 ${progressStop}% ${holdStop}%,
          #5fb98b ${holdStop}% ${resolvedStop}%,
          #d6dde5 ${resolvedStop}% 100%
        )`;


  // =========================================
  // RECENT TICKETS
  // =========================================

  const recentTickets =
    useMemo(() => {

      return [...tickets]
        .sort(
          (a, b) =>
            new Date(
              b.created_at
            ) -
            new Date(
              a.created_at
            )
        )
        .slice(0, 3);

    }, [tickets]);


  // =========================================
  // UPCOMING DUE TICKETS
  // =========================================

  const upcomingTickets =
    useMemo(() => {

      const now =
        new Date().setHours(
          0,
          0,
          0,
          0
        );


      return tickets
        .filter(
          (ticket) => {

            if (
              !ticket.due_date
            ) {
              return false;
            }


            const due =
              new Date(
                `${ticket.due_date}T00:00:00`
              ).getTime();


            return due >= now;
          }
        )
        .sort(
          (a, b) =>
            new Date(
              a.due_date
            ) -
            new Date(
              b.due_date
            )
        )
        .slice(0, 3);

    }, [tickets]);


  // =========================================
  // HELPERS
  // =========================================

  const getStatusLabel = (
    status
  ) => {

    const labels = {
      open: "Open",
      in_progress:
        "In Progress",
      on_hold: "On Hold",
      resolved: "Resolved",
      closed: "Closed",
    };


    return (
      labels[status] ||
      status
    );
  };


  const getStatusBadgeClass =
    (status) => {

      if (
        status === "open"
      ) {
        return "open";
      }


      if (
        status ===
        "resolved" ||
        status === "closed"
      ) {
        return "closed";
      }


      return "progress";
    };


  const formatDate = (
    dateValue
  ) => {

    if (!dateValue) {
      return "No date";
    }


    const date =
      new Date(
        `${dateValue}T00:00:00`
      );


    return date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  };


  // =========================================
  // RENDER
  // =========================================

  return (
        <div className="dashboard-content">

          <div className="page-heading">

            <div>

              <h1>
                Dashboard<PageGuide title="Dashboard" text="Shows a quick overview of tickets, customers, service activity, upcoming scheduled work, and other key system information." />
              </h1>


              <p>
                Welcome back,{" "}

                {user?.first_name ||
                  user?.username ||
                  "Administrator"}.

                {" "}

                Here's what's happening
                today.
              </p>

            </div>


            {canCreateTicket && (

              <button
                className="create-ticket-button"
                onClick={() =>
                  navigate(
                    "/tickets"
                  )
                }
              >
                + New Ticket
              </button>

            )}

          </div>


          {error && (

            <div
              style={{
                padding:
                  "12px 15px",

                marginBottom:
                  "20px",

                background:
                  "#fff1f2",

                border:
                  "1px solid #fecaca",

                borderRadius:
                  "7px",

                color:
                  "#b42318",
              }}
            >
              {error}
            </div>

          )}


          {/* =================================
              LIVE KPI CARDS
          ================================= */}

          <section className="stats-grid">

            <div
              className="stat-card"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate("/tickets")
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  navigate("/tickets");
                }
              }}
            >

              <div>

                <span>
                  Total Tickets
                </span>

                <h2>
                  {loading
                    ? "..."
                    : stats.total_tickets}
                </h2>

                <p>
                  All service requests
                </p>

              </div>

              <div className="stat-icon">

                <Ticket
                  size={24}
                />

              </div>

            </div>


            <div
              className="stat-card"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(
                  "/tickets?status=open"
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  navigate(
                    "/tickets?status=open"
                  );
                }
              }}
            >

              <div>

                <span>
                  Active Tickets
                </span>

                <h2>
                  {loading
                    ? "..."
                    : stats.open_tickets}
                </h2>

                <p>
                  Require attention
                </p>

              </div>

              <div className="stat-icon">

                <Ticket
                  size={24}
                />

              </div>

            </div>


            <div
              className="stat-card"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(
                  "/tickets?status=closed"
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  navigate(
                    "/tickets?status=closed"
                  );
                }
              }}
            >

              <div>

                <span>
                  Resolved Tickets
                </span>

                <h2>
                  {loading
                    ? "..."
                    : stats.resolved_tickets}
                </h2>

                <p>
                  Completed requests
                </p>

              </div>

              <div className="stat-icon">

                <ShieldCheck
                  size={24}
                />

              </div>

            </div>


            <div
              className="stat-card"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate(
                  "/tickets?past_due=1"
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  navigate(
                    "/tickets?past_due=1"
                  );
                }
              }}
            >

              <div>

                <span>
                  Past Due Tickets
                </span>

                <h2>
                  {loading
                    ? "..."
                    : stats.past_due_tickets}
                </h2>

                <p>
                  Overdue open tickets
                </p>

              </div>

              <div className="stat-icon">

                <CalendarDays
                  size={24}
                />

              </div>

            </div>

          </section>


          {/* =================================
              LIVE CHARTS
          ================================= */}

          <section className="dashboard-grid">

            {/* TICKETS OVERVIEW */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Tickets Overview
                  </h3>


                  <p>
                    Ticket activity
                    during the last
                    7 days
                  </p>


                  {weeklyDateRange && (

                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "7px",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {weeklyDateRange}
                    </span>

                  )}

                </div>


                {permissions?.reports && (

                  <button
                    onClick={() =>
                      navigate(
                        "/reports"
                      )
                    }
                  >
                    View report
                  </button>

                )}

              </div>


              <div className="fake-chart">

                <div className="chart-grid-line" />
                <div className="chart-grid-line" />
                <div className="chart-grid-line" />
                <div className="chart-grid-line" />


                <div className="chart-bars">

                  {stats.last_7_days.map(
                    (day) => {

                      const calculatedHeight =
                        day.count === 0
                          ? 4
                          : Math.max(
                            12,

                            (
                              day.count /
                              maxDailyTickets
                            ) *
                            100
                          );


                      return (
                        <div
                          key={
                            day.date
                          }
                          className="chart-bar"
                          title={`${day.label}: ${day.count} ticket(s)`}
                          style={{
                            height:
                              `${calculatedHeight}%`,
                          }}
                        />
                      );
                    }
                  )}

                </div>

              </div>


              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    `repeat(${Math.max(
                      stats.last_7_days.length,
                      1
                    )}, minmax(0, 1fr))`,
                  gap: "6px",
                  margin: "0 20px",
                  paddingTop: "9px",
                  borderTop: "1px solid #e7edf3",
                }}
              >

                {stats.last_7_days.map(
                  (day) => (

                    <div
                      key={`${day.date}-chart-label`}
                      style={{
                        minWidth: 0,
                        textAlign: "center",
                      }}
                    >

                      <strong
                        style={{
                          display: "block",
                          color: "#334155",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {day.label}
                      </strong>


                      <span
                        style={{
                          display: "block",
                          marginTop: "2px",
                          color: "#94a3b8",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(
                          day.date
                        )}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* UPCOMING SERVICE CALENDAR */}

            <div className="dashboard-panel dashboard-calendar-panel">

              <div className="panel-header">
                <div>
                  <h3>Upcoming Service Calendar</h3>
                  <p>Assigned jobs and upcoming appointments</p>
                </div>

                {permissions?.tickets && (
                  <button onClick={() => navigate("/tickets?view=calendar")}>
                    Open calendar
                  </button>
                )}
              </div>

              <div className="dashboard-upcoming-list">
                {(stats.upcoming_jobs || []).length === 0 ? (
                  <div className="dashboard-upcoming-empty">
                    <CalendarDays size={30} />
                    <strong>No upcoming scheduled jobs</strong>
                    <span>Assigned tickets with a service date will appear here.</span>
                  </div>
                ) : (
                  stats.upcoming_jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      className="dashboard-upcoming-job"
                      onClick={() => navigate("/tickets")}
                    >
                      <div className="dashboard-upcoming-date">
                        <CalendarDays size={17} />
                        <span>{formatDate(job.service_date)}</span>
                      </div>
                      <div className="dashboard-upcoming-copy">
                        <strong>{job.ticket_number} · {job.subject}</strong>
                        <span>{job.customer_name}</span>
                        <small>
                          {(job.technician_names || []).join(", ") || "Unassigned"}
                          {job.start_time ? ` · ${String(job.start_time).slice(0, 5)}` : ""}
                        </small>
                      </div>
                    </button>
                  ))
                )}
              </div>

            </div>

          </section>


          {/* =================================
              RECENT TICKETS
          ================================= */}

          <section className="dashboard-grid bottom-grid">

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Recent Tickets
                  </h3>


                  <p>
                    Latest service
                    requests
                  </p>

                </div>


                {permissions?.tickets && (

                  <button
                    onClick={() =>
                      navigate(
                        "/tickets"
                      )
                    }
                  >
                    View all tickets
                  </button>

                )}

              </div>


              <div className="ticket-table">

                <div className="ticket-row ticket-heading">

                  <span>
                    Ticket
                  </span>

                  <span>
                    Issue
                  </span>

                  <span>
                    Status
                  </span>

                </div>


                {recentTickets.length ===
                  0 ? (

                  <div
                    style={{
                      padding:
                        "25px 0",

                      textAlign:
                        "center",

                      color:
                        "#8b97a3",
                    }}
                  >
                    No tickets yet.
                  </div>

                ) : (

                  recentTickets.map(
                    (ticket) => (

                      <div
                        key={
                          ticket.id
                        }
                        className="ticket-row"
                      >

                        <span>
                          {
                            ticket.ticket_number
                          }
                        </span>


                        <span>
                          {
                            ticket.subject
                          }
                        </span>


                        <span
                          className={`badge ${getStatusBadgeClass(
                            ticket.status
                          )}`}
                        >
                          {getStatusLabel(
                            ticket.status
                          )}
                        </span>

                      </div>

                    )
                  )

                )}

              </div>

            </div>


            {/* =================================
                UPCOMING DUE DATES
            ================================= */}

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h3>
                    Upcoming Due Dates
                  </h3>


                  <p>
                    Upcoming service
                    deadlines
                  </p>

                </div>


                {permissions?.tickets && (

                  <button
                    onClick={() =>
                      navigate(
                        "/tickets"
                      )
                    }
                  >
                    View tickets
                  </button>

                )}

              </div>


              <div className="schedule">

                {upcomingTickets.length ===
                  0 ? (

                  <div
                    style={{
                      padding:
                        "25px 0",

                      textAlign:
                        "center",

                      color:
                        "#8b97a3",
                    }}
                  >
                    No upcoming due
                    dates.
                  </div>

                ) : (

                  upcomingTickets.map(
                    (ticket) => (

                      <div
                        key={
                          ticket.id
                        }
                        className="schedule-item"
                      >

                        <strong>
                          {formatDate(
                            ticket.due_date
                          )}
                        </strong>


                        <div>

                          <span>
                            {
                              ticket.subject
                            }
                          </span>


                          <p>
                            {ticket.customer_name ||
                              "No customer"}
                          </p>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

          </section>

        </div>
  );
}


export default Dashboard;
