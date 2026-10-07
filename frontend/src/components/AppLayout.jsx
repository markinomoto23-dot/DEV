import { apiUrl } from "../config/api";
import {
  useEffect,
  useRef,
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
  Settings,
  Search,
  LogOut,
  ChevronDown,
  BookOpen,
} from "lucide-react";

import expertLogo from "../assets/expert-technology-logo.png";
import NotificationBell from "./NotificationBell";
import PageSkeleton from "./PageSkeleton";

import "../pages/Dashboard.css";


const PERMISSIONS_API =
  apiUrl("/api/access/me/permissions/");

const LOGOUT_API =
  apiUrl("/api/accounts/logout/");


const PAGE_TRANSITION_CSS = `
.app-page-container {
  flex: 1;
  min-width: 0;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: #f4f7fa;
}

.app-page-transition {
  min-height: 100%;
  background: #f4f7fa;

  animation:
    appPageEnter
    0.22s
    cubic-bezier(0.22, 1, 0.36, 1);

  transform-origin: top center;

  /*
   * IMPORTANT:
   * Do not use will-change: transform here.
   * It causes position: fixed modals to become
   * trapped inside this page container.
   */
  will-change: auto;
}

@keyframes appPageEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-layout {
  background: #f4f7fa;
}

.dashboard-main {
  background: #f4f7fa;
}

.sidebar-item {
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;
}

.sidebar-item:hover {
  transform: translateX(2px);
}

.sidebar-item.active {
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

@media (
  prefers-reduced-motion:
  reduce
) {
  .app-page-transition {
    animation: none;
  }

  .sidebar-item {
    transition: none;
  }

  .sidebar-item:hover {
    transform: none;
  }
}
`;


function AppLayout({
  children,
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const token =
    localStorage.getItem(
      "token"
    );


  let user = null;

  try {
    user =
      JSON.parse(
        localStorage.getItem(
          "user"
        )
      );
  } catch {
    user = null;
  }


  // =========================================
  // STATE
  // =========================================

  const [
    permissions,
    setPermissions,
  ] = useState(null);

  const [
    currentRole,
    setCurrentRole,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = useState(false);

  const [
    pageLoading,
    setPageLoading,
  ] = useState(false);

  const hasMounted = useRef(false);


  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout =
    async () => {
      try {
        if (token) {
          const response =
            await fetch(
              LOGOUT_API,
              {
                method:
                  "POST",

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

        navigate(
          "/login"
        );
      }
    };


  // =========================================
  // LOAD PERMISSIONS
  // =========================================

  useEffect(() => {
    const loadPermissions =
      async () => {
        if (!token) {
          navigate(
            "/login"
          );

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
            response.status ===
            401
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
            data.permissions ||
            {}
          );


          setCurrentRole(
            data.role ||
            ""
          );

        } catch (error) {
          console.error(
            "Permission loading error:",
            error
          );


          setPermissions(
            {}
          );
        }
      };


    loadPermissions();

  }, [token]);


  // =========================================
  // MENU ITEMS
  // =========================================

  const menuItems = [
    {
      name:
        "Dashboard",

      icon:
        LayoutDashboard,

      path:
        "/dashboard",

      permission:
        "dashboard",
      group:
        "Platform",
    },

    {
      name:
        "Customers",

      icon:
        Users,

      path:
        "/customers",

      permission:
        "customers",
      group:
        "CRM",
    },

    {
      name:
        "Locations",

      icon:
        MapPin,

      path:
        "/locations",

      permission:
        "locations",
      group:
        "CRM",
    },

    {
      name:
        "Equipment",

      icon:
        Monitor,

      path:
        "/equipment",

      permission:
        "equipment",
      group:
        "Assets",
    },

    {
      name:
        "Warranties",

      icon:
        ShieldCheck,

      path:
        "/warranties",

      permission:
        "warranties",
      group:
        "Assets",
    },

    {
      name:
        "Licenses",

      icon:
        KeyRound,

      path:
        "/licenses",

      permission:
        "licenses",
      group:
        "Assets",
    },

    {
      name:
        "Tickets",

      icon:
        Ticket,

      path:
        "/tickets",

      permission:
        "tickets",
      group:
        "Operations",
    },

    {
      name:
        "Technicians",

      icon:
        UserCog,

      path:
        "/technicians",

      permission:
        "technicians",
      group:
        "Operations",
    },

    {
      name:
        "Billing",

      icon:
        CreditCard,

      path:
        "/billing",

      permission:
        "billing",
      group:
        "Operations",
    },

    {
      name:
        "Reports",

      icon:
        BarChart3,

      path:
        "/reports",

      permission:
        "reports",
      group:
        "Operations",
    },

    {
      name:
        "Audit Trail",

      icon:
        ClipboardList,

      path:
        "/audit-trail",

      permission:
        "audit_trail",
      group:
        "Operations",
    },

    {
      name:
        "Roles",

      icon:
        ShieldCheck,

      path:
        "/roles",

      permission:
        "roles",
      group:
        "Administration",
    },

    {
      name:
        "Users",

      icon:
        UserCog,

      path:
        "/users",

      permission:
        "users",
      group:
        "Administration",
    },

    {
      name:
        "Settings",

      icon:
        Settings,

      path:
        "/settings",

      permission:
        "settings",
      group:
        "Administration",
    },

    {
      name:
        "Help & Documentation",

      icon:
        BookOpen,

      path:
        "/help",

      permission:
        null,
      group:
        "Administration",
    },
  ];


  // =========================================
  // GLOBAL SEARCH
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
      navigate(
        "/customers"
      );

    } else if (
      value.includes(
        "location"
      )
    ) {
      navigate(
        "/locations"
      );

    } else if (
      value.includes(
        "equipment"
      )
    ) {
      navigate(
        "/equipment"
      );

    } else if (
      value.includes(
        "warranty"
      )
    ) {
      navigate(
        "/warranties"
      );

    } else if (
      value.includes(
        "license"
      )
    ) {
      navigate(
        "/licenses"
      );

    } else if (
      value.includes(
        "technician"
      )
    ) {
      navigate(
        "/technicians"
      );

    } else if (
      value.includes(
        "billing"
      )
    ) {
      navigate(
        "/billing"
      );

    } else if (
      value.includes(
        "report"
      )
    ) {
      navigate(
        "/reports"
      );

    } else if (
      value.includes(
        "audit"
      )
    ) {
      navigate(
        "/audit-trail"
      );

    } else if (
      value.includes(
        "role"
      )
    ) {
      navigate(
        "/roles"
      );

    } else if (
      value.includes(
        "setting"
      )
    ) {
      navigate(
        "/settings"
      );

    } else if (
      value.includes(
        "help"
      ) ||
      value.includes(
        "manual"
      ) ||
      value.includes(
        "documentation"
      )
    ) {
      navigate(
        "/help"
      );

    } else if (
      value.includes(
        "user"
      )
    ) {
      navigate(
        "/users"
      );

    } else {
      navigate(
        "/tickets"
      );
    }
  };


  // =========================================
  // CLOSE PROFILE WHEN PAGE CHANGES
  // =========================================

  useEffect(() => {
    setProfileMenuOpen(
      false
    );

    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }

    setPageLoading(true);

    const timer = window.setTimeout(() => {
      setPageLoading(false);
    }, 320);

    return () => window.clearTimeout(timer);

  }, [
    location.pathname,
  ]);


  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="dashboard-layout">

      <style>
        {PAGE_TRANSITION_CSS}
      </style>


      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <img
            src={
              expertLogo
            }
            alt="DEV"
          />


          <span>
            Service Management <em className="dev-badge">DEV</em>
          </span>

        </div>


        <nav className="sidebar-menu">

          {[
            "Platform",
            "CRM",
            "Assets",
            "Operations",
            "Administration",
          ].map((group) => {
            const items = menuItems
              .filter((item) => item.group === group)
              .filter((item) => {
                if (item.permission == null) {
                  return true;
                }

                if (!permissions) {
                  return false;
                }

                return Boolean(
                  permissions[item.permission]
                );
              });

            if (!items.length) {
              return null;
            }

            return (
              <div
                className="sidebar-group"
                key={group}
              >
                <div className="sidebar-group-label">
                  {group}
                </div>

                {items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    location.pathname === item.path ||
                    location.pathname.startsWith(
                      `${item.path}/`
                    );

                  return (
                    <button
                      type="button"
                      key={item.name}
                      className={`sidebar-item ${
                        active ? "active" : ""
                      }`}
                      onClick={() =>
                        navigate(item.path)
                      }
                    >
                      <Icon size={19} />

                      <span>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}

        </nav>

      </aside>


      {/* =====================================
          MAIN
      ====================================== */}

      <main className="dashboard-main">


        {/* =================================
            TOP BAR
        ================================= */}

        <header className="topbar">

          <form
            className="search-box"
            onSubmit={
              handleSearch
            }
          >

            <Search
              size={18}
            />


            <input
              type="text"
              placeholder="Search customers, tickets, equipment..."
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </form>


          <div className="topbar-actions">

            <NotificationBell />


            <div className="profile-wrapper">

              <button
                type="button"
                className={
                  `profile ${
                    profileMenuOpen
                      ? "open"
                      : ""
                  }`
                }
                onClick={() =>
                  setProfileMenuOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={
                  profileMenuOpen
                }
                aria-haspopup="menu"
              >

                <div className="profile-avatar">

                  {(user?.username ||
                    "A")
                    .charAt(0)
                    .toUpperCase()}

                </div>


                <div className="profile-details">

                  <strong>
                    {user?.username ||
                      user?.first_name ||
                      "Administrator"}
                  </strong>


                  <span>
                    {currentRole ||
                      (
                        user?.is_superuser
                          ? "Super Admin"
                          : "User"
                      )}
                  </span>

                </div>


                <ChevronDown
                  size={17}
                  className={
                    profileMenuOpen
                      ? "profile-chevron open"
                      : "profile-chevron"
                  }
                />

              </button>


              {profileMenuOpen && (

                <div
                  className="profile-dropdown"
                  role="menu"
                >

                  <div className="profile-dropdown-header">

                    <div className="profile-dropdown-avatar">

                      {(user?.username ||
                        "A")
                        .charAt(0)
                        .toUpperCase()}

                    </div>


                    <div>

                      <strong>
                        {user?.username ||
                          "Administrator"}
                      </strong>


                      <span>
                        {currentRole ||
                          (
                            user?.is_superuser
                              ? "Super Admin"
                              : "User"
                          )}
                      </span>

                    </div>

                  </div>


                  <div className="profile-dropdown-divider" />


                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={() => {
                      setProfileMenuOpen(
                        false
                      );

                      navigate(
                        "/my-account"
                      );
                    }}
                  >

                    <UserRound
                      size={17}
                    />

                    My Account

                  </button>


                  {permissions?.users && (

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        setProfileMenuOpen(
                          false
                        );

                        navigate(
                          "/users"
                        );
                      }}
                    >

                      <UserCog
                        size={17}
                      />

                      Manage Users

                    </button>

                  )}


                  {permissions?.settings && (

                    <button
                      type="button"
                      className="profile-dropdown-item"
                      onClick={() => {
                        setProfileMenuOpen(
                          false
                        );

                        navigate(
                          "/settings"
                        );
                      }}
                    >

                      <Settings
                        size={17}
                      />

                      Settings

                    </button>

                  )}


                  {(permissions?.users ||
                    permissions?.settings) && (

                    <div className="profile-dropdown-divider" />

                  )}


                  <button
                    type="button"
                    className="profile-dropdown-item logout"
                    onClick={
                      handleLogout
                    }
                  >

                    <LogOut
                      size={17}
                    />

                    Sign out

                  </button>

                </div>

              )}

            </div>

          </div>

        </header>


        {/* =================================
            PAGE CONTENT
        ================================= */}

        <div className="app-page-container">

          <div
            key={
              location.pathname
            }
            className="app-page-transition"
          >
            {pageLoading ? (
              <PageSkeleton />
            ) : (
              children
            )}
          </div>

        </div>

      </main>

    </div>
  );
}


export default AppLayout;