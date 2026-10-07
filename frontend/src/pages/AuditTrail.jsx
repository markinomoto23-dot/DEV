import { apiUrl } from "../config/api";
import PageGuide from "../components/PageGuide";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  formatDateTime,
} from "../utils/dateFormatter";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";

import "./AuditTrail.css";


const AUDIT_API =
  apiUrl("/api/audit-trail/");

const PAGE_SIZE = 10;


const PAGINATION_CSS = `
.audit-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}

.audit-pagination-info {
  color: #64748b;
  font-size: 13px;
}

.audit-pagination-info strong {
  color: #1e293b;
  font-weight: 700;
}

.audit-pagination-controls {
  display: flex;
  align-items: center;
  gap: 7px;
}

.audit-page-button,
.audit-page-number {
  height: 38px;
  min-width: 38px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.audit-page-button:hover:not(:disabled),
.audit-page-number:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #b8c5d3;
}

.audit-page-number.active {
  border-color: #286ea6;
  background: #286ea6;
  color: #ffffff;
}

.audit-page-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.audit-page-dots {
  min-width: 25px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

@media (max-width: 760px) {
  .audit-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .audit-pagination-info {
    text-align: center;
  }

  .audit-pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .audit-page-button span {
    display: none;
  }
}
`;


function AuditTrail() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );


  // =========================================
  // DATA
  // =========================================

  const [
    logs,
    setLogs,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // =========================================
  // FILTERS
  // =========================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    moduleFilter,
    setModuleFilter,
  ] = useState("");

  const [
    actionFilter,
    setActionFilter,
  ] = useState("");


  // =========================================
  // PAGINATION
  // =========================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  // =========================================
  // DETAILS MODAL
  // =========================================

  const [
    selectedLog,
    setSelectedLog,
  ] = useState(null);


  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate(
      "/login"
    );
  };


  // =========================================
  // LOAD LOGS
  // =========================================

  const fetchLogs = async (
    searchValue = search,
    moduleValue = moduleFilter,
    actionValue = actionFilter
  ) => {
    try {
      setLoading(true);
      setError("");


      const params =
        new URLSearchParams();


      if (searchValue.trim()) {
        params.append(
          "search",
          searchValue.trim()
        );
      }


      if (moduleValue) {
        params.append(
          "module",
          moduleValue
        );
      }


      if (actionValue) {
        params.append(
          "action",
          actionValue
        );
      }


      const query =
        params.toString();


      const url =
        query
          ? `${AUDIT_API}?${query}`
          : AUDIT_API;


      const response =
        await fetch(
          url,
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
        logout();
        return;
      }


      if (
        response.status === 403
      ) {
        navigate(
          "/access-denied"
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          "Unable to load audit trail."
        );
      }


      const data =
        await response.json();


      const auditLogs =
        Array.isArray(data)
          ? data
          : data.results || [];


      setLogs(
        auditLogs
      );


    } catch (error) {
      console.error(
        "Audit Trail error:",
        error
      );


      setError(
        "Unable to load audit trail records."
      );


    } finally {
      setLoading(false);
    }
  };


  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    if (!token) {
      logout();
      return;
    }


    fetchLogs(
      "",
      "",
      ""
    );

  }, []);


  // =========================================
  // FILTER CHANGE
  // =========================================

  useEffect(() => {
    if (!token) {
      return;
    }


    setCurrentPage(
      1
    );


    fetchLogs(
      search,
      moduleFilter,
      actionFilter
    );

  }, [
    moduleFilter,
    actionFilter,
  ]);


  // =========================================
  // SEARCH
  // =========================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();


    setCurrentPage(
      1
    );


    fetchLogs(
      search,
      moduleFilter,
      actionFilter
    );
  };


  // =========================================
  // RESET
  // =========================================

  const clearFilters = () => {
    setSearch("");
    setModuleFilter("");
    setActionFilter("");
    setCurrentPage(1);


    fetchLogs(
      "",
      "",
      ""
    );
  };


  // =========================================
  // ACTION LABEL
  // =========================================

  const actionLabel = (
    action
  ) => {
    const labels = {
      login:
        "Login",

      logout:
        "Logout",

      create:
        "Create",

      update:
        "Update",

      delete:
        "Delete",

      status_change:
        "Status Change",

      assignment:
        "Assignment",

      payment:
        "Payment",

      other:
        "Other",
    };


    return (
      labels[action] ||
      action
    );
  };


  // =========================================
  // UNIQUE MODULES
  // =========================================

  const modules =
    useMemo(() => {
      const defaults = [
        "Accounts",
        "Tickets",
        "Customers",
        "Locations",
        "Equipment",
        "Warranties",
        "Licenses",
        "Technicians",
        "Billing",
        "Users",
        "Roles",
        "Settings",
        "System",
      ];


      const fromLogs =
        logs
          .map(
            (log) =>
              log.module
          )
          .filter(
            Boolean
          );


      return [
        ...new Set([
          ...defaults,
          ...fromLogs,
        ]),
      ];

    }, [
      logs,
    ]);


  // =========================================
  // PAGINATION CALCULATIONS
  // =========================================

  const totalRecords =
    logs.length;


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalRecords /
        PAGE_SIZE
      )
    );


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }

  }, [
    totalPages,
    currentPage,
  ]);


  const startIndex =
    (
      currentPage - 1
    ) * PAGE_SIZE;


  const endIndex =
    Math.min(
      startIndex +
      PAGE_SIZE,
      totalRecords
    );


  const paginatedLogs =
    useMemo(() => {
      return logs.slice(
        startIndex,
        startIndex +
          PAGE_SIZE
      );

    }, [
      logs,
      startIndex,
    ]);


  // =========================================
  // PAGE NUMBERS
  // =========================================

  const visiblePages =
    useMemo(() => {
      if (
        totalPages <= 5
      ) {
        return Array.from(
          {
            length:
              totalPages,
          },
          (
            _,
            index
          ) =>
            index + 1
        );
      }


      let start =
        Math.max(
          currentPage - 2,
          1
        );


      let end =
        Math.min(
          start + 4,
          totalPages
        );


      if (
        end - start < 4
      ) {
        start =
          Math.max(
            end - 4,
            1
          );
      }


      return Array.from(
        {
          length:
            end - start + 1,
        },
        (
          _,
          index
        ) =>
          start + index
      );

    }, [
      currentPage,
      totalPages,
    ]);


  // =========================================
  // CHANGE PAGE
  // =========================================

  const goToPage = (
    page
  ) => {
    if (
      page < 1 ||
      page > totalPages
    ) {
      return;
    }


    setCurrentPage(
      page
    );
  };


  // =========================================
  // CHANGES
  // =========================================

  const changeEntries =
    (
      selectedLog?.changes &&
      typeof selectedLog.changes ===
        "object"
    )
      ? Object.entries(
          selectedLog.changes
        )
      : [];


  return (
    <div className="audit-page">

      <style>
        {PAGINATION_CSS}
      </style>


      {/* =====================================
          HEADER
      ====================================== */}

      <div className="audit-header">

        <div>

          <button
            type="button"
            className="audit-back"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >

            <ArrowLeft
              size={16}
            />

            Dashboard

          </button>


          <h1>
            Audit Trail<PageGuide title="Audit Trail" text="Review a chronological record of system actions, including user activity, account changes, and other tracked events." />
          </h1>


          <p>
            Review system activity,
            user actions, record
            changes, and timestamps.
          </p>

        </div>


        <div className="audit-header-icon">

          <ClipboardList
            size={25}
          />

        </div>

      </div>


      {/* =====================================
          TOOLBAR
      ====================================== */}

      <div className="audit-toolbar">

        <form
          className="audit-search"
          onSubmit={
            handleSearch
          }
        >

          <Search
            size={18}
          />


          <input
            type="text"
            value={
              search
            }
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              setCurrentPage(1);
              fetchLogs(
                value,
                moduleFilter,
                actionFilter
              );
            }}
            placeholder="Search user, action, record, description..."
          />


          <button
            type="submit"
            className="audit-search-button"
          >
            Search
          </button>

        </form>


        <select
          value={
            moduleFilter
          }
          onChange={(
            event
          ) =>
            setModuleFilter(
              event.target.value
            )
          }
        >

          <option value="">
            All Modules
          </option>


          {modules.map(
            (module) => (

              <option
                key={
                  module
                }
                value={
                  module
                }
              >
                {module}
              </option>

            )
          )}

        </select>


        <select
          value={
            actionFilter
          }
          onChange={(
            event
          ) =>
            setActionFilter(
              event.target.value
            )
          }
        >

          <option value="">
            All Actions
          </option>

          <option value="login">
            Login
          </option>

          <option value="logout">
            Logout
          </option>

          <option value="create">
            Create
          </option>

          <option value="update">
            Update
          </option>

          <option value="delete">
            Delete
          </option>

          <option value="status_change">
            Status Change
          </option>

          <option value="assignment">
            Assignment
          </option>

          <option value="payment">
            Payment
          </option>

          <option value="other">
            Other
          </option>

        </select>


        <button
          type="button"
          className="audit-reset"
          onClick={
            clearFilters
          }
        >

          <RefreshCcw
            size={15}
          />

          Reset

        </button>

      </div>


      {/* =====================================
          ERROR
      ====================================== */}

      {error && (

        <div className="audit-error">
          {error}
        </div>

      )}


      {/* =====================================
          TABLE CARD
      ====================================== */}

      <div className="audit-card">

        <div className="audit-card-header">

          <div>

            <h2>
              Activity Log
            </h2>


            <p>
              {totalRecords} record
              {totalRecords !== 1
                ? "s"
                : ""}
            </p>

          </div>

        </div>


        {loading ? (

          <div className="audit-empty">
            Loading audit trail...
          </div>

        ) :
        logs.length === 0 ? (

          <div className="audit-empty">

            <ClipboardList
              size={45}
            />


            <h3>
              No audit records found
            </h3>


            <p>
              System activity will
              appear here.
            </p>

          </div>

        ) : (

          <>
            <div className="audit-table-wrapper">

              <table className="audit-table">

                <thead>

                  <tr>

                    <th>
                      User
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Module
                    </th>

                    <th>
                      Record
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      IP Address
                    </th>

                    <th>
                      Date & Time
                    </th>

                    <th>
                      Details
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {paginatedLogs.map(
                    (log) => (

                      <tr
                        key={
                          log.id
                        }
                      >

                        {/* USER */}

                        <td>

                          <div className="audit-user">

                            <div className="audit-avatar">

                              {(log.username ||
                                "S")
                                .charAt(0)
                                .toUpperCase()}

                            </div>


                            <div>

                              <strong>
                                {log.full_name ||
                                  log.username ||
                                  "System"}
                              </strong>


                              {log.username && (

                                <small>
                                  @{log.username}
                                </small>

                              )}

                            </div>

                          </div>

                        </td>


                        {/* ACTION */}

                        <td>

                          <span
                            className={`audit-action audit-action-${log.action}`}
                          >
                            {actionLabel(
                              log.action
                            )}
                          </span>

                        </td>


                        {/* MODULE */}

                        <td>

                          <strong>
                            {log.module}
                          </strong>

                        </td>


                        {/* RECORD */}

                        <td>

                          <span className="audit-record">
                            {log.object_repr ||
                              log.object_id ||
                              "\u2014"}
                          </span>

                        </td>


                        {/* DESCRIPTION */}

                        <td>

                          <div className="audit-description">
                            {log.description ||
                              "\u2014"}
                          </div>

                        </td>


                        {/* IP ADDRESS */}

                        <td>
                          {log.ip_address ||
                            "\u2014"}
                        </td>


                        {/* DATE */}

                        <td>
                          {formatDateTime(
                            log.created_at
                          )}
                        </td>


                        {/* DETAILS */}

                        <td>

                          <button
                            type="button"
                            className="audit-view"
                            onClick={() =>
                              setSelectedLog(
                                log
                              )
                            }
                            title="View details"
                          >

                            <Eye
                              size={16}
                            />

                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* =================================
                PAGINATION
            ================================== */}

            <div className="audit-pagination">

              <div className="audit-pagination-info">

                Showing{" "}

                <strong>
                  {totalRecords === 0
                    ? 0
                    : startIndex + 1}
                </strong>

                {"\u2013"}

                <strong>
                  {endIndex}
                </strong>

                {" of "}

                <strong>
                  {totalRecords}
                </strong>

                {" records"}

              </div>


              <div className="audit-pagination-controls">

                <button
                  type="button"
                  className="audit-page-button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    goToPage(
                      currentPage - 1
                    )
                  }
                >

                  <ChevronLeft
                    size={16}
                  />

                  <span>
                    Previous
                  </span>

                </button>


                {visiblePages[0] > 1 && (

                  <>
                    <button
                      type="button"
                      className="audit-page-number"
                      onClick={() =>
                        goToPage(
                          1
                        )
                      }
                    >
                      1
                    </button>


                    {visiblePages[0] > 2 && (
                      <span className="audit-page-dots">
                        {"\u2026"}
                      </span>
                    )}

                  </>

                )}


                {visiblePages.map(
                  (page) => (

                    <button
                      type="button"
                      key={
                        page
                      }
                      className={
                        `audit-page-number ${
                          currentPage === page
                            ? "active"
                            : ""
                        }`
                      }
                      onClick={() =>
                        goToPage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>

                  )
                )}


                {visiblePages[
                  visiblePages.length - 1
                ] < totalPages && (

                  <>
                    {visiblePages[
                      visiblePages.length - 1
                    ] < totalPages - 1 && (

                      <span className="audit-page-dots">
                        {"\u2026"}
                      </span>

                    )}


                    <button
                      type="button"
                      className="audit-page-number"
                      onClick={() =>
                        goToPage(
                          totalPages
                        )
                      }
                    >
                      {totalPages}
                    </button>

                  </>

                )}


                <button
                  type="button"
                  className="audit-page-button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    goToPage(
                      currentPage + 1
                    )
                  }
                >

                  <span>
                    Next
                  </span>

                  <ChevronRight
                    size={16}
                  />

                </button>

              </div>

            </div>

          </>

        )}

      </div>


      {/* =====================================
          DETAILS MODAL
      ====================================== */}

      {selectedLog && (

        <div className="audit-modal-overlay">

          <div className="audit-modal">

            <div className="audit-modal-header">

              <div>

                <h2>
                  Activity Details
                </h2>


                <p>
                  Audit Log #
                  {selectedLog.id}
                </p>

              </div>


              <button
                type="button"
                className="audit-modal-close"
                onClick={() =>
                  setSelectedLog(
                    null
                  )
                }
              >

                <X
                  size={21}
                />

              </button>

            </div>


            <div className="audit-detail-grid">

              <div>

                <span>
                  User
                </span>

                <strong>
                  {selectedLog.full_name ||
                    selectedLog.username ||
                    "System"}
                </strong>

              </div>


              <div>

                <span>
                  Action
                </span>

                <strong>
                  {actionLabel(
                    selectedLog.action
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Module
                </span>

                <strong>
                  {selectedLog.module}
                </strong>

              </div>


              <div>

                <span>
                  Record
                </span>

                <strong>
                  {selectedLog.object_repr ||
                    selectedLog.object_id ||
                    "\u2014"}
                </strong>

              </div>


              <div>

                <span>
                  IP Address
                </span>

                <strong>
                  {selectedLog.ip_address ||
                    "\u2014"}
                </strong>

              </div>


              <div>

                <span>
                  Date & Time
                </span>

                <strong>
                  {formatDateTime(
                    selectedLog.created_at
                  )}
                </strong>

              </div>

            </div>


            <div className="audit-detail-description">

              <span>
                Description
              </span>


              <p>
                {selectedLog.description ||
                  "No description."}
              </p>

            </div>


            <div className="audit-changes">

              <h3>
                Changes
              </h3>


              {changeEntries.length === 0 ? (

                <div className="audit-no-changes">
                  No field changes recorded.
                </div>

              ) : (

                <div className="audit-changes-list">

                  {changeEntries.map(
                    ([
                      field,
                      value,
                    ]) => {

                      const isChange =
                        value &&
                        typeof value ===
                          "object" &&
                        !Array.isArray(
                          value
                        ) &&
                        (
                          "old" in value ||
                          "new" in value ||
                          "from" in value ||
                          "to" in value
                        );


                      return (

                        <div
                          className="audit-change-row"
                          key={
                            field
                          }
                        >

                          <strong className="audit-change-field">

                            {field
                              .replaceAll(
                                "_",
                                " "
                              )
                              .replace(
                                /\b\w/g,
                                (char) =>
                                  char.toUpperCase()
                              )}

                          </strong>


                          {isChange ? (

                            <div className="audit-change-values">

                              <div>

                                <span>
                                  From
                                </span>

                                <strong className="audit-old-value">
                                  {String(
                                    value.old ??
                                    value.from ??
                                    "None"
                                  )}
                                </strong>

                              </div>


                              <div className="audit-arrow">
                                {"\u2192"}
                              </div>


                              <div>

                                <span>
                                  To
                                </span>

                                <strong className="audit-new-value">
                                  {String(
                                    value.new ??
                                    value.to ??
                                    "None"
                                  )}
                                </strong>

                              </div>

                            </div>

                          ) : (

                            <div className="audit-created-value">

                              {String(
                                value ??
                                "None"
                              )}

                            </div>

                          )}

                        </div>

                      );
                    }
                  )}

                </div>

              )}

            </div>


            <div className="audit-modal-actions">

              <button
                type="button"
                onClick={() =>
                  setSelectedLog(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default AuditTrail;