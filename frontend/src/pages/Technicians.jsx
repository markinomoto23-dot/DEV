import { showSuccessToast } from "../components/SuccessToast";
import PageGuide from "../components/PageGuide";
import { apiUrl } from "../config/api";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Pencil,
  Search,
  Trash2,
  UserRoundCog,
  X,
} from "lucide-react";

import "./Technicians.css";

import {
  formatDate,
} from "../utils/dateFormatter";


const TECHNICIANS_API =
  apiUrl("/api/technicians/");

const TICKETS_CALENDAR_API =
  apiUrl("/api/tickets/calendar/");


function Technicians() {
  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");


  // =====================================================
  // STATE
  // =====================================================

  const [
    technicians,
    setTechnicians,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // =====================================================
  // EDIT
  // =====================================================

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingTechnician,
    setEditingTechnician,
  ] = useState(null);


  // =====================================================
  // DELETE
  // =====================================================

  const [
    deleteTechnician,
    setDeleteTechnician,
  ] = useState(null);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");


  // =====================================================
  // TECHNICIAN CALENDAR
  // =====================================================

  const [
    calendarTechnician,
    setCalendarTechnician,
  ] = useState(null);

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState(() => {
    const today = new Date();
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  });

  const [
    calendarEvents,
    setCalendarEvents,
  ] = useState([]);

  const [
    calendarLoading,
    setCalendarLoading,
  ] = useState(false);

  const [
    calendarError,
    setCalendarError,
  ] = useState("");

  const [
    selectedCalendarDate,
    setSelectedCalendarDate,
  ] = useState("");

  // =====================================================
  // FORM
  // =====================================================

  const emptyForm = {
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialization: "",
    hourly_rate: "0.00",
    hire_date: "",
    status: "active",
    notes: "",
  };


  const [
    form,
    setForm,
  ] = useState(emptyForm);


  // =====================================================
  // AUTH
  // =====================================================

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };


  const authHeaders = {
    Authorization:
      `Token ${token}`,
  };


  // =====================================================
  // LOAD TECHNICIANS
  // =====================================================

  const fetchTechnicians = async (
    searchValue = search
  ) => {
    try {
      setLoading(true);
      setError("");

      const cleanSearch =
        searchValue.trim();

      const url =
        cleanSearch
          ? `${TECHNICIANS_API}?search=${encodeURIComponent(
              cleanSearch
            )}`
          : TECHNICIANS_API;


      const response =
        await fetch(
          url,
          {
            headers:
              authHeaders,
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
        setError(
          "You do not have permission to access technicians."
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          "Unable to load technicians."
        );
      }


      const data =
        await response.json();


      setTechnicians(
        Array.isArray(data)
          ? data
          : data.results || []
      );

    } catch (error) {
      console.error(
        "Technician loading error:",
        error
      );

      setError(
        "Unable to load technicians."
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) {
      logout();
      return;
    }

    fetchTechnicians("");
  }, []);


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;


    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    if (error) {
      setError("");
    }
  };


  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (
    technician
  ) => {
    setEditingTechnician(
      technician
    );


    setForm({
      employee_id:
        technician.employee_id ||
        "",

      first_name:
        technician.first_name ||
        "",

      last_name:
        technician.last_name ||
        "",

      email:
        technician.email ||
        "",

      phone:
        technician.phone ||
        "",

      specialization:
        technician.specialization ||
        "",

      hourly_rate:
        technician.hourly_rate ??
        "0.00",

      hire_date:
        technician.hire_date ||
        "",

      status:
        technician.status ||
        "active",

      notes:
        technician.notes ||
        "",
    });


    setError("");

    setShowModal(true);
  };


  // =====================================================
  // CLOSE EDIT MODAL
  // =====================================================

  const closeModal = () => {
    setShowModal(false);

    setEditingTechnician(
      null
    );

    setForm(
      emptyForm
    );

    setError("");
  };


  // =====================================================
  // API ERROR
  // =====================================================

  const getApiError = (
    data
  ) => {
    if (!data) {
      return (
        "Unable to save technician."
      );
    }


    if (
      typeof data.detail ===
      "string"
    ) {
      return data.detail;
    }


    if (
      typeof data.message ===
      "string"
    ) {
      return data.message;
    }


    const firstValue =
      Object.values(
        data
      )[0];


    if (
      Array.isArray(
        firstValue
      )
    ) {
      return firstValue[0];
    }


    if (
      typeof firstValue ===
      "string"
    ) {
      return firstValue;
    }


    return (
      "Unable to save technician. Please check the information."
    );
  };


  // =====================================================
  // SAVE EDIT
  // =====================================================

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    setError("");


    if (!editingTechnician) {
      setError(
        "No technician selected."
      );

      return;
    }




    const hourlyRate =
      Number(
        form.hourly_rate ||
        0
      );


    if (
      Number.isNaN(
        hourlyRate
      ) ||
      hourlyRate < 0
    ) {
      setError(
        "Hourly rate must be a valid positive number."
      );

      return;
    }


    const payload = {
      employee_id:
        form.employee_id.trim(),

      first_name:
        form.first_name.trim(),

      last_name:
        form.last_name.trim(),

      email:
        form.email.trim(),

      phone:
        form.phone.trim(),

      specialization:
        form.specialization.trim(),

      hourly_rate:
        hourlyRate,

      hire_date:
        form.hire_date ||
        null,

      status:
        form.status,

      notes:
        form.notes.trim(),
    };


    try {
      const response =
        await fetch(
          `${TECHNICIANS_API}${editingTechnician.id}/`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Token ${token}`,
            },

            body:
              JSON.stringify(
                payload
              ),
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
        setError(
          "You do not have permission to manage technicians."
        );

        return;
      }


      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }


      if (!response.ok) {
        setError(
          getApiError(data)
        );

        return;
      }


      showSuccessToast(editingTechnician ? "Technician Updated" : "Technician Created", editingTechnician ? "Technician information was successfully saved." : "New technician was successfully added.");

      closeModal();

      await fetchTechnicians(
        search
      );

    } catch (error) {
      console.error(
        "Technician save error:",
        error
      );

      setError(
        "Unable to connect to the DEV server."
      );
    }
  };


  // =====================================================
  // DELETE MODAL
  // =====================================================

  const openDeleteModal = (
    technician
  ) => {
    setDeleteTechnician(
      technician
    );

    setDeleteError("");
  };


  const closeDeleteModal = () => {
    if (
      deleteLoading
    ) {
      return;
    }


    setDeleteTechnician(
      null
    );

    setDeleteError("");
  };


  // =====================================================
  // DELETE
  // =====================================================

  const confirmDelete =
    async () => {
      if (
        !deleteTechnician
      ) {
        return;
      }


      try {
        setDeleteLoading(
          true
        );

        setDeleteError("");


        const response =
          await fetch(
            `${TECHNICIANS_API}${deleteTechnician.id}/`,
            {
              method:
                "DELETE",

              headers:
                authHeaders,
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
          setDeleteError(
            "You do not have permission to delete technicians."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to delete technician.";


          try {
            const data =
              await response.json();

            message =
              data.detail ||
              data.message ||
              message;

          } catch {
            // Keep default.
          }


          setDeleteError(
            message
          );

          return;
        }


        showSuccessToast("Technician Deleted", "The technician was successfully deleted.");

        setDeleteTechnician(
          null
        );


        await fetchTechnicians(
          search
        );

      } catch (error) {
        console.error(
          "Delete technician error:",
          error
        );

        setDeleteError(
          "Unable to connect to the DEV server."
        );

      } finally {
        setDeleteLoading(
          false
        );
      }
    };


  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    fetchTechnicians(
      search
    );
  };


  const clearSearch = () => {
    setSearch("");

    fetchTechnicians("");
  };


  // =====================================================
  // TECHNICIAN CALENDAR HELPERS
  // =====================================================

  const padNumber = (value) =>
    String(value).padStart(2, "0");


  const toLocalDateKey = (value) =>
    `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}`;


  const monthKey = (value) =>
    `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}`;


  const formatCalendarMonth = (value) =>
    value.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );


  const formatCalendarDay = (dateKey) => {
    if (!dateKey) {
      return "Select a date";
    }

    const [year, month, day] =
      dateKey.split("-").map(Number);

    return new Date(
      year,
      month - 1,
      day
    ).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );
  };


  const formatBookingTime = (
    startTime,
    endTime
  ) => {
    if (!startTime || !endTime) {
      return "All day";
    }

    const formatOne = (timeValue) => {
      const [hourValue, minuteValue] =
        String(timeValue)
          .slice(0, 5)
          .split(":")
          .map(Number);

      const period =
        hourValue >= 12
          ? "PM"
          : "AM";

      const displayHour =
        hourValue % 12 || 12;

      return `${displayHour}:${padNumber(minuteValue)} ${period}`;
    };

    return `${formatOne(startTime)} - ${formatOne(endTime)}`;
  };


  const getEventsForDate = (
    dateKey
  ) =>
    calendarEvents.filter(
      (event) =>
        event.service_date ===
        dateKey
    );


  const fetchTechnicianCalendar = async (
    technician,
    targetMonth
  ) => {
    if (!technician) {
      return;
    }

    try {
      setCalendarLoading(true);
      setCalendarError("");

      const url =
        `${TICKETS_CALENDAR_API}?month=${monthKey(targetMonth)}&technician=${encodeURIComponent(technician.id)}`;

      const response =
        await fetch(
          url,
          {
            headers:
              authHeaders,
          }
        );

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.status === 403) {
        setCalendarError(
          "You do not have permission to view this technician calendar."
        );
        setCalendarEvents([]);
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load technician calendar."
        );
      }

      const data =
        await response.json();

      const calendarItems =
        Array.isArray(data)
          ? data
          : data.results || [];

      // Closed tickets do not block technician availability.
      setCalendarEvents(
        calendarItems.filter(
          (event) =>
            event.status !== "closed"
        )
      );

    } catch (calendarLoadError) {
      console.error(
        "Technician calendar loading error:",
        calendarLoadError
      );

      setCalendarError(
        "Unable to load technician availability calendar."
      );
      setCalendarEvents([]);

    } finally {
      setCalendarLoading(false);
    }
  };


  const openCalendarModal = (
    technician
  ) => {
    const today = new Date();
    const firstOfMonth =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    setCalendarTechnician(
      technician
    );
    setCalendarMonth(
      firstOfMonth
    );
    setSelectedCalendarDate(
      toLocalDateKey(today)
    );
    setCalendarEvents([]);
    setCalendarError("");

    fetchTechnicianCalendar(
      technician,
      firstOfMonth
    );
  };


  const closeCalendarModal = () => {
    setCalendarTechnician(null);
    setCalendarEvents([]);
    setCalendarError("");
    setSelectedCalendarDate("");
  };


  const changeCalendarMonth = (
    offset
  ) => {
    if (!calendarTechnician) {
      return;
    }

    const nextMonth =
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth() + offset,
        1
      );

    setCalendarMonth(
      nextMonth
    );
    setSelectedCalendarDate("");

    fetchTechnicianCalendar(
      calendarTechnician,
      nextMonth
    );
  };


  const goToCurrentMonth = () => {
    if (!calendarTechnician) {
      return;
    }

    const today = new Date();
    const currentMonth =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    setCalendarMonth(
      currentMonth
    );
    setSelectedCalendarDate(
      toLocalDateKey(today)
    );

    fetchTechnicianCalendar(
      calendarTechnician,
      currentMonth
    );
  };


  const calendarDays = (() => {
    const firstDay =
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        1
      );

    const gridStart =
      new Date(firstDay);

    gridStart.setDate(
      firstDay.getDate() -
      firstDay.getDay()
    );

    return Array.from(
      { length: 42 },
      (_, index) => {
        const value =
          new Date(gridStart);

        value.setDate(
          gridStart.getDate() +
          index
        );

        return value;
      }
    );
  })();


  const selectedCalendarEvents =
    selectedCalendarDate
      ? getEventsForDate(
          selectedCalendarDate
        )
      : [];


  const selectedHasAllDayBooking =
    selectedCalendarEvents.some(
      (event) =>
        !event.start_time ||
        !event.end_time
    );


  const selectedDateIsPast =
    Boolean(
      selectedCalendarDate &&
      selectedCalendarDate <
        toLocalDateKey(new Date())
    );

  // =====================================================
  // FILTER
  // =====================================================

  const visibleTechnicians =
    technicians.filter(
      (technician) => {
        if (
          statusFilter &&
          technician.status !==
            statusFilter
        ) {
          return false;
        }

        return true;
      }
    );


  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (
    status
  ) => {
    const labels = {
      active:
        "Active",

      inactive:
        "Inactive",

      on_leave:
        "On Leave",
    };


    return (
      labels[status] ||
      status
    );
  };


  // =====================================================
  // RATE
  // =====================================================

  const formatRate = (
    value
  ) => {
    const number =
      Number(value || 0);


    if (
      Number.isNaN(number)
    ) {
      return "$‚±0.00";
    }


    return `$‚${number.toLocaleString(
      "en-PH",
      {
        minimumFractionDigits:
          2,

        maximumFractionDigits:
          2,
      }
    )}`;
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="technicians-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="technicians-header">

        <div>

          <button
            type="button"
            className="technicians-back"
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
            Technicians<PageGuide title="Technicians" text="Manage technician records, availability, contact information, and assignment-related details." />
          </h1>


          <p>
            View and manage technician
            information, specialties,
            rates, and availability.
          </p>

        </div>

      </div>


      {/* =================================================
          CARD
      ================================================= */}

      <div className="technicians-card">


        {/* TOOLBAR */}

        <div className="technicians-toolbar">


          <form
            className="technician-search"
            onSubmit={
              handleSearch
            }
          >

            <Search
              size={18}
            />


            <input
              type="text"
              placeholder="Search technician, employee ID, email, specialization..."
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                fetchTechnicians(value);
              }}
            />


            {search && (

              <button
                type="button"
                className="technician-search-clear"
                onClick={
                  clearSearch
                }
                title="Clear search"
              >
                <X
                  size={15}
                />
              </button>

            )}


            <button
              type="submit"
              className="technician-search-btn"
            >
              Search
            </button>

          </form>


          <div className="technician-filters">

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="">
                All Statuses
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="on_leave">
                On Leave
              </option>

            </select>

          </div>

        </div>


        {/* ERROR */}

        {error &&
          !showModal && (

          <div className="technicians-error">

            <CircleAlert
              size={17}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (

          <div className="technicians-empty">

            <UserRoundCog
              size={46}
            />

            <h3>
              Loading technicians...
            </h3>

          </div>

        ) :
        visibleTechnicians.length ===
        0 ? (

          <div className="technicians-empty">

            <UserRoundCog
              size={46}
            />

            <h3>
              No technicians found
            </h3>

            <p>
              Adjust your search and
              filters, or create a new
              technician from Users.
            </p>

          </div>

        ) : (

          <div className="technicians-table-wrapper">

            <table className="technicians-table">

              <thead>

                <tr>

                  <th>
                    Employee ID
                  </th>

                  <th>
                    Technician
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Specialization
                  </th>

                  <th>
                    Hourly Rate
                  </th>

                  <th>
                    Hire Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {visibleTechnicians.map(
                  (technician) => (

                    <tr
                      key={
                        technician.id
                      }
                    >


                      {/* EMPLOYEE ID */}

                      <td>

                        <strong className="technician-id">

                          {
                            technician.employee_id
                          }

                        </strong>

                      </td>


                      {/* NAME */}

                      <td>

                        <div className="technician-name-cell">

                          <strong>

                            {
                              technician.full_name ||
                              `${technician.first_name || ""} ${technician.last_name || ""}`.trim() ||
                              "Unnamed Technician"
                            }

                          </strong>

                        </div>

                      </td>


                      {/* CONTACT */}

                      <td>

                        <div className="technician-contact">

                          <span>

                            {
                              technician.email ||
                              "â€”"
                            }

                          </span>


                          {technician.phone && (

                            <small>

                              {
                                technician.phone
                              }

                            </small>

                          )}

                        </div>

                      </td>


                      {/* SPECIALIZATION */}

                      <td>

                        {
                          technician.specialization ||
                          "â€”"
                        }

                      </td>


                      {/* RATE */}

                      <td>

                        {
                          formatRate(
                            technician.hourly_rate
                          )
                        }

                      </td>


                      {/* HIRE DATE */}

                      <td>

                        {
                          formatDate(
                            technician.hire_date
                          )
                        }

                      </td>


                      {/* STATUS */}

                      <td>

                        <span
                          className={`technician-status status-${technician.status}`}
                        >

                          {
                            getStatusLabel(
                              technician.status
                            )
                          }

                        </span>

                      </td>


                      {/* ACTIONS */}

                      <td>

                    <div className="technician-actions">

                      <button
                        type="button"
                        className="technician-calendar-button"
                        title="View availability calendar"
                        onClick={() =>
                          openCalendarModal(
                            technician
                          )
                        }
                      >
                        <CalendarDays
                          size={16}
                        />
                      </button>

                      <button
                        type="button"
                        className="technician-edit"
                        title="Edit technician"
                        onClick={() =>
                          openEditModal(
                            technician
                          )
                        }
                      >
                        <Pencil
                          size={16}
                        />
                      </button>

                    </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          AVAILABILITY CALENDAR MODAL
      ================================================= */}

      {calendarTechnician && (

        <div className="technician-calendar-overlay">

          <div className="technician-calendar-modal">

            <div className="technician-calendar-header">

              <div>
                <div className="technician-calendar-title-row">
                  <CalendarDays size={22} />
                  <h2>
                    Technician Availability
                  </h2>
                </div>

                <p>
                  {calendarTechnician.full_name ||
                    `${calendarTechnician.first_name || ""} ${calendarTechnician.last_name || ""}`.trim() ||
                    calendarTechnician.employee_id}
                  {calendarTechnician.employee_id
                    ? ` • ${calendarTechnician.employee_id}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="technician-calendar-close"
                onClick={
                  closeCalendarModal
                }
                title="Close calendar"
              >
                <X size={22} />
              </button>

            </div>


            <div className="technician-calendar-status-strip">
              <span
                className={`technician-status status-${calendarTechnician.status}`}
              >
                {getStatusLabel(
                  calendarTechnician.status
                )}
              </span>

              <span>
                {calendarTechnician.status === "active"
                  ? "Green days have no bookings. Days with booked time still may have open time outside the listed schedule."
                  : "This technician is not available for new bookings while this status is active. Existing bookings remain visible."}
              </span>
            </div>


            <div className="technician-calendar-toolbar">

              <div className="technician-calendar-nav">
                <button
                  type="button"
                  onClick={() =>
                    changeCalendarMonth(-1)
                  }
                  title="Previous month"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  className="technician-calendar-today"
                  onClick={
                    goToCurrentMonth
                  }
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeCalendarMonth(1)
                  }
                  title="Next month"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <h3>
                {formatCalendarMonth(
                  calendarMonth
                )}
              </h3>

              <div className="technician-calendar-legend">
                <span className="legend-item">
                  <i className="legend-dot available" />
                  Available
                </span>
                <span className="legend-item">
                  <i className="legend-dot booked" />
                  Booking
                </span>
              </div>

            </div>


            {calendarError && (
              <div className="technician-calendar-error">
                <CircleAlert size={17} />
                <span>{calendarError}</span>
              </div>
            )}


            <div className="technician-calendar-layout">

              <div className="technician-calendar-grid-wrap">

                <div className="technician-calendar-weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (dayName) => (
                      <div key={dayName}>
                        {dayName}
                      </div>
                    )
                  )}
                </div>

                {calendarLoading ? (
                  <div className="technician-calendar-loading">
                    Loading technician schedule...
                  </div>
                ) : (
                  <div className="technician-calendar-grid">
                    {calendarDays.map(
                      (dayValue) => {
                        const dateKey =
                          toLocalDateKey(dayValue);
                        const dayEvents =
                          getEventsForDate(dateKey);
                        const isCurrentMonth =
                          dayValue.getMonth() === calendarMonth.getMonth() &&
                          dayValue.getFullYear() === calendarMonth.getFullYear();
                        const todayKey =
                          toLocalDateKey(new Date());
                        const isPast =
                          dateKey < todayKey;
                        const isToday =
                          dateKey === todayKey;
                        const isSelected =
                          dateKey === selectedCalendarDate;
                        const allDayBooked =
                          dayEvents.some(
                            (event) =>
                              !event.start_time ||
                              !event.end_time
                          );
                        const canShowAvailable =
                          isCurrentMonth &&
                          !isPast &&
                          calendarTechnician.status === "active" &&
                          dayEvents.length === 0;

                        return (
                          <button
                            type="button"
                            key={dateKey}
                            className={[
                              "technician-calendar-day",
                              !isCurrentMonth ? "outside-month" : "",
                              isPast ? "past-day" : "",
                              isToday ? "today-day" : "",
                              isSelected ? "selected-day" : "",
                              dayEvents.length ? "has-bookings" : "",
                              canShowAvailable ? "available-day" : "",
                              allDayBooked ? "all-day-booked" : "",
                            ].filter(Boolean).join(" ")}
                            onClick={() =>
                              setSelectedCalendarDate(
                                dateKey
                              )
                            }
                          >
                            <div className="technician-calendar-day-number">
                              <span>
                                {dayValue.getDate()}
                              </span>
                              {isToday && (
                                <small>Today</small>
                              )}
                            </div>

                            <div className="technician-calendar-day-content">
                              {canShowAvailable && (
                                <span className="technician-calendar-available-label">
                                  Available
                                </span>
                              )}

                              {dayEvents.slice(0, 2).map(
                                (event) => (
                                  <span
                                    className="technician-calendar-event-chip"
                                    key={event.id}
                                    title={`${event.ticket_number} • ${event.subject || "Ticket"}`}
                                  >
                                    <Clock3 size={11} />
                                    {formatBookingTime(
                                      event.start_time,
                                      event.end_time
                                    )}
                                  </span>
                                )
                              )}

                              {dayEvents.length > 2 && (
                                <small className="technician-calendar-more">
                                  +{dayEvents.length - 2} more
                                </small>
                              )}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

              </div>


              <aside className="technician-calendar-details">

                <h3>
                  {formatCalendarDay(
                    selectedCalendarDate
                  )}
                </h3>

                {!selectedCalendarDate ? (
                  <p className="technician-calendar-detail-help">
                    Select a date to see booked times and availability.
                  </p>
                ) : (
                  <>
                    <div className={[
                      "technician-calendar-summary",
                      selectedDateIsPast
                        ? "unavailable"
                        : calendarTechnician.status !== "active"
                          ? "unavailable"
                          : selectedHasAllDayBooking
                            ? "unavailable"
                          : selectedCalendarEvents.length
                            ? "partial"
                            : "available",
                    ].join(" ")}>
                      {selectedDateIsPast ? (
                        <>
                          <CircleAlert size={18} />
                          <div>
                            <strong>
                              Past date
                            </strong>
                            <span>
                              Past service dates cannot be booked.
                            </span>
                          </div>
                        </>
                      ) : calendarTechnician.status !== "active" ? (
                        <>
                          <CircleAlert size={18} />
                          <div>
                            <strong>
                              Unavailable for new bookings
                            </strong>
                            <span>
                              Technician status: {getStatusLabel(calendarTechnician.status)}
                            </span>
                          </div>
                        </>
                      ) : selectedHasAllDayBooking ? (
                        <>
                          <CircleAlert size={18} />
                          <div>
                            <strong>
                              Booked all day
                            </strong>
                            <span>
                              Choose another date or technician.
                            </span>
                          </div>
                        </>
                      ) : selectedCalendarEvents.length ? (
                        <>
                          <Clock3 size={18} />
                          <div>
                            <strong>
                              Partially booked
                            </strong>
                            <span>
                              Available outside the booked times below.
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>
                              Available all day
                            </strong>
                            <span>
                              No ticket bookings are scheduled for this date.
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="technician-calendar-bookings">
                      <h4>
                        Scheduled Tickets
                      </h4>

                      {selectedCalendarEvents.length === 0 ? (
                        <p>
                          No bookings for this date.
                        </p>
                      ) : (
                        selectedCalendarEvents.map(
                          (event) => (
                            <div
                              className="technician-calendar-booking-card"
                              key={event.id}
                            >
                              <div className="technician-calendar-booking-top">
                                <strong>
                                  {event.ticket_number}
                                </strong>
                                <span>
                                  {formatBookingTime(
                                    event.start_time,
                                    event.end_time
                                  )}
                                </span>
                              </div>

                              <p>
                                {event.subject || "Service ticket"}
                              </p>

                              <small>
                                {event.customer_name || "Customer"}
                                {event.location_name
                                  ? ` • ${event.location_name}`
                                  : ""}
                              </small>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </>
                )}

              </aside>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {showModal &&
        editingTechnician && (

        <div className="technician-modal-overlay">

          <div className="technician-modal">


            <div className="technician-modal-header">

              <div>

                <h2>
                  Edit Technician
                </h2>


                <p>
                  Update technician
                  information and
                  availability.
                </p>

              </div>


              <button
                type="button"
                className="technician-modal-close"
                onClick={
                  closeModal
                }
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {error && (

              <div className="technician-modal-error">

                <CircleAlert
                  size={17}
                />

                <span>
                  {error}
                </span>

              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="technician-form-grid">


                <div className="technician-field">

                  <label>
                    Employee ID
                  </label>


                  <input
                    type="text"
                    name="employee_id"
                    value={
                      form.employee_id
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Status
                  </label>


                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="on_leave">
                      On Leave
                    </option>

                  </select>

                </div>


                <div className="technician-field">

                  <label>
                    First Name
                  </label>


                  <input
                    type="text"
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Last Name
                  </label>


                  <input
                    type="text"
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Email
                  </label>


                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Phone
                  </label>


                  <input
                    type="text"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Specialization
                  </label>


                  <input
                    type="text"
                    name="specialization"
                    value={
                      form.specialization
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Hourly Rate
                  </label>


                  <input
                    type="number"
                    name="hourly_rate"
                    min="0"
                    step="0.01"
                    value={
                      form.hourly_rate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field">

                  <label>
                    Hire Date
                  </label>


                  <input
                    type="date"
                    name="hire_date"
                    value={
                      form.hire_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="technician-field full">

                  <label>
                    Notes
                  </label>


                  <textarea
                    name="notes"
                    rows="4"
                    value={
                      form.notes
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Skills, certifications, availability, or internal notes..."
                  />

                </div>

              </div>


              <div className="technician-modal-actions">

                <button
                  type="button"
                  className="technician-cancel"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="technician-save"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deleteTechnician && (

        <div
          className="technician-delete-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >

          <div
            className="technician-delete-modal"
            role="dialog"
            aria-modal="true"
          >

            <div className="technician-delete-icon">

              <Trash2
                size={24}
              />

            </div>


            <div className="technician-delete-content">

              <h2>
                Delete technician?
              </h2>


              <p>
                This will permanently
                delete{" "}

                <strong>

                  {
                    deleteTechnician.full_name ||
                    deleteTechnician.employee_id
                  }

                </strong>

                . This action cannot
                be undone.
              </p>


              <div className="technician-delete-record">

                <span>
                  Technician
                </span>

                <strong>
                  {
                    deleteTechnician.employee_id
                  }
                </strong>

                <small>
                  {
                    deleteTechnician.full_name
                  }
                </small>

              </div>


              {deleteError && (

                <div className="technician-delete-error">

                  <CircleAlert
                    size={17}
                  />

                  <span>
                    {deleteError}
                  </span>

                </div>

              )}

            </div>


            <div className="technician-delete-actions">

              <button
                type="button"
                className="technician-delete-cancel"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deleteLoading
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="technician-delete-confirm"
                onClick={
                  confirmDelete
                }
                disabled={
                  deleteLoading
                }
              >

                <Trash2
                  size={16}
                />


                {deleteLoading
                  ? "Deleting..."
                  : "Delete Technician"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Technicians;