import { showSuccessToast } from "../components/SuccessToast";
import { apiUrl } from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageGuide from "../components/PageGuide";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  FileText,
  List,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Ticket as TicketIcon,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import "./Tickets.css";
import { formatDate } from "../utils/dateFormatter";

const TICKETS_API = apiUrl("/api/tickets/");
const CALENDAR_API = apiUrl("/api/tickets/calendar/");
const AVAILABILITY_API = apiUrl("/api/tickets/availability/");
const CUSTOMERS_API = apiUrl("/api/customers/");
const QUICK_CUSTOMER_API = apiUrl("/api/customers/quick-create/");
const LOCATIONS_API = apiUrl("/api/locations/");
const EQUIPMENT_API = apiUrl("/api/equipment/");
const NEXT_ASSET_TAG_API = apiUrl("/api/equipment/next-asset-tag/");
const TECHNICIANS_API = apiUrl("/api/technicians/");
const PERMISSIONS_API = apiUrl("/api/access/me/permissions/");

const EMPTY_FORM = {
  customer: "",
  location: "",
  equipment: "",
  subject: "",
  description: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  category: "service",
  priority: "medium",
  status: "open",
  technicians: [],
  due_date: "",
  service_date: "",
  start_time: "",
  end_time: "",
  recurrence_type: "none",
  recurrence_end_date: "",
  notes: "",
  work_performed: "",
  time_on_site: "",
  equipment_materials_used: "",
};

const CATEGORY_LABELS = {
  service: "Service Request",
  repair: "Repair",
  maintenance: "Maintenance",
  installation: "Installation",
  inspection: "Inspection",
  other: "Other",
};

const ERROR_SECTION_BY_FIELD = {
  customer: "Customer & Issue",
  location: "Customer & Issue",
  equipment: "Customer & Issue",
  subject: "Customer & Issue",
  description: "Customer & Issue",
  contact_name: "Contact Details",
  contact_email: "Contact Details",
  contact_phone: "Contact Details",
  priority: "Priority & Status",
  status: "Priority & Status",
  due_date: "Priority & Status",
  technicians: "Technician Assignment & Calendar",
  service_date: "Technician Assignment & Calendar",
  start_time: "Technician Assignment & Calendar",
  end_time: "Technician Assignment & Calendar",
  recurrence_type: "Technician Assignment & Calendar",
  recurrence_end_date: "Technician Assignment & Calendar",
  work_performed: "Work Ticket",
  time_on_site: "Work Ticket",
  equipment_materials_used: "Work Ticket",
  notes: "Work Ticket",
  file: "Attachments / Photos",
  attachments: "Attachments / Photos",
};


function normalizeCustomerDuplicateText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeCustomerDuplicatePhone(value) {
  return String(value || "")
    .replace(/\D+/g, "");
}

function customerDuplicateReason(customer, candidate) {
  const existingContact =
    normalizeCustomerDuplicateText(
      customer?.contact_name
    );

  const candidateContact =
    normalizeCustomerDuplicateText(
      candidate?.contact_name
    );

  const existingEmail =
    String(
      customer?.email || ""
    )
      .trim()
      .toLowerCase();

  const candidateEmail =
    String(
      candidate?.email || ""
    )
      .trim()
      .toLowerCase();

  const existingPhone =
    normalizeCustomerDuplicatePhone(
      customer?.phone
    );

  const candidatePhone =
    normalizeCustomerDuplicatePhone(
      candidate?.phone
    );

  const allFieldsPresent =
    existingContact
    &&
    candidateContact
    &&
    existingEmail
    &&
    candidateEmail
    &&
    existingPhone
    &&
    candidatePhone;

  if (
    allFieldsPresent
    &&
    existingContact === candidateContact
    &&
    existingEmail === candidateEmail
    &&
    existingPhone === candidatePhone
  ) {
    return "same contact name, email, and phone";
  }

  return "";
}



function errorMessageValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  if (value && typeof value === "object") {
    return errorMessageValue(Object.values(value)[0]);
  }

  return value ? String(value) : "";
}

function apiErrorDetails(data, fallback = "Unable to save ticket.") {
  if (data?.detail) {
    return {
      message: errorMessageValue(data.detail) || fallback,
      section: inferErrorSection(data.detail),
      fields: [],
    };
  }

  const entries = Object.entries(data || {});
  const firstEntry = entries[0];

  if (!firstEntry) {
    return {
      message: fallback,
      section: "Ticket",
      fields: [],
    };
  }

  const [field, value] = firstEntry;

  return {
    message: errorMessageValue(value) || fallback,
    section: ERROR_SECTION_BY_FIELD[field] || inferErrorSection(value),
    fields: entries
      .map(([entryField]) => entryField)
      .filter((entryField) => ERROR_SECTION_BY_FIELD[entryField]),
  };
}

function inferErrorSection(message) {
  const text = String(message || "").toLowerCase();

  if (text.includes("customer") || text.includes("subject") || text.includes("location") || text.includes("equipment")) {
    return "Customer & Issue";
  }

  if (text.includes("contact") || text.includes("email") || text.includes("phone")) {
    return "Contact Details";
  }

  if (text.includes("due date") || text.includes("priority") || text.includes("status")) {
    return "Priority & Status";
  }

  if (
    text.includes("technician")
    || text.includes("service date")
    || text.includes("start time")
    || text.includes("end time")
    || text.includes("repeat until")
    || text.includes("recurr")
    || text.includes("schedule")
    || text.includes("booking")
  ) {
    return "Technician Assignment & Calendar";
  }

  if (text.includes("attach") || text.includes("upload") || text.includes("file")) {
    return "Attachments / Photos";
  }

  if (text.includes("work performed") || text.includes("time on site") || text.includes("materials") || text.includes("notes")) {
    return "Work Ticket";
  }

  return "Ticket";
}

function normalizeList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function isoMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      key: localDateKey(date),
      currentMonth: date.getMonth() === month,
    };
  });
}

function Tickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [permissions, setPermissions] = useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("status") || "";
  });

  const [priorityFilter, setPriorityFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState("");

  const pastDueOnly = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("past_due") === "1";
  }, [location.search]);

  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(location.search);

    return params.get("view") === "calendar"
      ? "calendar"
      : "table";
  });

  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("view") === "calendar") {
      setViewMode("calendar");
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setStatusFilter(params.get("status") || "");
  }, [location.search]);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomerSaving, setQuickCustomerSaving] = useState(false);
  const [quickCustomerError, setQuickCustomerError] = useState("");
  const [
    quickCustomerDuplicate,
    setQuickCustomerDuplicate,
  ] = useState(null);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
  });

  const [showQuickLocation, setShowQuickLocation] = useState(false);
  const [quickLocationSaving, setQuickLocationSaving] = useState(false);
  const [quickLocationError, setQuickLocationError] = useState("");
  const [quickLocationForm, setQuickLocationForm] = useState({
    location_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "United States",
    contact_name: "",
    contact_email: "",
    phone: "",
  });

  const [showQuickEquipment, setShowQuickEquipment] = useState(false);
  const [quickEquipmentSaving, setQuickEquipmentSaving] = useState(false);
  const [quickEquipmentError, setQuickEquipmentError] = useState("");
  const [quickEquipmentForm, setQuickEquipmentForm] = useState({
    equipment_name: "",
    equipment_type: "",
    manufacturer: "",
    model_number: "",
    serial_number: "",
    asset_tag: "",
    ownership_type: "owned",
    status: "active",
    notes: "",
  });

  const [pendingFiles, setPendingFiles] = useState([]);
  const [
    completedWorkTicketUploading,
    setCompletedWorkTicketUploading,
  ] = useState(false);
  const [saving, setSaving] = useState(false);

  const [technicianAvailability, setTechnicianAvailability] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  const [dueDateCalendarDate, setDueDateCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [dueDateCalendarEvents, setDueDateCalendarEvents] = useState([]);
  const [dueDateCalendarLoading, setDueDateCalendarLoading] = useState(false);
  const [dueDateCalendarError, setDueDateCalendarError] = useState("");
  const [dueDatePreviewKey, setDueDatePreviewKey] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [deleteTicket, setDeleteTicket] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showTicketError = (message, section, fields = []) => {
    const safeMessage = String(message || "Something went wrong.");
    const nextFieldErrors = {};

    fields.forEach((field) => {
      if (field) {
        nextFieldErrors[field] = safeMessage;
      }
    });

    setError("");
    setFieldErrors(nextFieldErrors);
    setErrorModal({
      message: safeMessage,
      section: section || inferErrorSection(safeMessage),
    });
  };

  const clearFieldError = (field) => {
    if (!field) {
      return;
    }

    setFieldErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const closeErrorModalAndFocusField = () => {
    setErrorModal(null);

    window.setTimeout(() => {
      const firstInvalid = document.querySelector(
        ".ticket-field-invalid, .ticket-picker-invalid"
      );

      if (!firstInvalid) {
        return;
      }

      firstInvalid.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      if (typeof firstInvalid.focus === "function") {
        firstInvalid.focus({ preventScroll: true });
      } else {
        const focusable = firstInvalid.querySelector(
          "input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)"
        );
        focusable?.focus({ preventScroll: true });
      }
    }, 80);
  };

  const actions = permissions?.actions || {};

  const role = String(
    permissions?.role || ""
  ).toLowerCase();

  const isTechnician =
    role === "technician";

  // Technician accounts are strictly read-only in the MVP.
  // They can view ticket details and print work tickets, but
  // they cannot create, edit, delete, assign, upload, or save.
  const canCreate =
    !isTechnician &&
    Boolean(actions.can_create_tickets);

  const canEdit =
    !isTechnician &&
    Boolean(actions.can_edit_tickets);

  const canDelete =
    !isTechnician &&
    Boolean(actions.can_delete_tickets);

  const canManageEquipment =
    !isTechnician &&
    Boolean(actions.can_manage_equipment) &&
    Boolean(permissions?.permissions?.equipment);

  const canPrint =
    isTechnician ||
    Boolean(actions.can_print_tickets);

  const canAssign =
    !isTechnician &&
    Boolean(actions.can_assign_technicians);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Token ${token}`,
    }),
    [token]
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const apiFetch = async (
    url,
    options = {}
  ) => {
    const response = await fetch(
      url,
      {
        ...options,

        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      }
    );

    if (response.status === 401) {
      logout();

      throw new Error(
        "Unauthorized"
      );
    }

    return response;
  };

  const loadReferenceData = async () => {
    const endpoints = [
      [CUSTOMERS_API, setCustomers],
      [LOCATIONS_API, setLocations],
      [EQUIPMENT_API, setEquipment],
      [TECHNICIANS_API, setTechnicians],
    ];

    await Promise.all(
      endpoints.map(
        async ([url, setter]) => {
          try {
            const response =
              await apiFetch(url);

            if (response.ok) {
              setter(
                normalizeList(
                  await response.json()
                )
              );
            }
          } catch (err) {
            console.warn(
              "Reference data load failed",
              url,
              err
            );
          }
        }
      )
    );
  };

  const loadPermissions = async () => {
    const response =
      await apiFetch(
        PERMISSIONS_API
      );

    if (!response.ok) {
      throw new Error(
        "Unable to load permissions."
      );
    }

    const data =
      await response.json();

    setPermissions(data);
  };

  const loadTicketsWithSearch = async (
    searchValue = search
  ) => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (searchValue.trim()) {
        params.set(
          "search",
          searchValue.trim()
        );
      }

      if (location.state?.customerId) {
        params.set(
          "customer",
          location.state.customerId
        );
      }

      const response =
        await apiFetch(
          `${TICKETS_API}${
            params.toString()
              ? `?${params}`
              : ""
          }`
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load tickets."
        );
      }

      setTickets(
        normalizeList(
          await response.json()
        )
      );
    } catch (err) {
      if (
        err.message !== "Unauthorized"
      ) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (location.state?.customerId) {
        params.set(
          "customer",
          location.state.customerId
        );
      }

      const response =
        await apiFetch(
          `${TICKETS_API}${
            params.toString()
              ? `?${params}`
              : ""
          }`
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load tickets."
        );
      }

      setTickets(
        normalizeList(
          await response.json()
        )
      );
    } catch (err) {
      if (
        err.message !== "Unauthorized"
      ) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const scheduleDateMin = localDateKey(new Date());

  const localTechnicianAvailability = () => {
    return technicians.reduce((result, technician) => {
      const status = String(technician.status || "active");
      const active = status === "active";

      result[String(technician.id)] = {
        id: technician.id,
        available: active,
        reason:
          status === "on_leave"
            ? "On Leave"
            : status === "inactive"
              ? "Inactive"
              : "Active",
        existing_assignment: false,
        conflicts: [],
      };

      return result;
    }, {});
  };

  const parseLocalDateKey = (value) => {
    if (!value) {
      return null;
    }

    const [year, month, day] = String(value)
      .split("-")
      .map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  };

  const openDueDateAvailabilityCalendar = () => {
    if (isTechnician || !canAssign) {
      return;
    }

    const selectedDate = parseLocalDateKey(form.due_date) || new Date();
    const selectedKey = form.due_date || localDateKey(selectedDate);

    setDueDateCalendarDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    );
    setDueDatePreviewKey(selectedKey);
    setDueDateCalendarError("");
    setDueDatePickerOpen(true);
  };

  const loadDueDateAvailabilityCalendar = async () => {
    if (!canAssign || !dueDatePickerOpen) {
      return;
    }

    try {
      setDueDateCalendarLoading(true);
      setDueDateCalendarError("");

      const params = new URLSearchParams({
        month: isoMonth(dueDateCalendarDate),
      });

      const response = await apiFetch(
        `${CALENDAR_API}?${params.toString()}`
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load technician availability calendar."
        );
      }

      setDueDateCalendarEvents(normalizeList(data));
    } catch (err) {
      if (err.message !== "Unauthorized") {
        setDueDateCalendarError(err.message);
      }
    } finally {
      setDueDateCalendarLoading(false);
    }
  };

  const changeDueDateCalendarMonth = (offset) => {
    setDueDateCalendarDate((current) => {
      const next = new Date(
        current.getFullYear(),
        current.getMonth() + offset,
        1
      );

      setDueDatePreviewKey(localDateKey(next));
      return next;
    });
  };

  const selectDueDateFromCalendar = () => {
    if (!dueDatePreviewKey) {
      return;
    }

    clearFieldError("due_date");
    clearFieldError("service_date");

    setForm((previous) => {
      const next = {
        ...previous,
        due_date: dueDatePreviewKey,
      };

      if (next.service_date && next.service_date > dueDatePreviewKey) {
        next.service_date = "";
        next.start_time = "";
        next.end_time = "";
      }

      return next;
    });

    setDueDatePickerOpen(false);
  };

  const loadTechnicianAvailability = async () => {
    if (!canAssign || !showModal) {
      return;
    }

    if (!form.service_date) {
      setTechnicianAvailability(localTechnicianAvailability());
      setAvailabilityError("Choose a service date to check technician availability.");
      return;
    }

    if (Boolean(form.start_time) !== Boolean(form.end_time)) {
      setTechnicianAvailability(localTechnicianAvailability());
      setAvailabilityError("Set both Start Time and End Time, or leave both blank for an all-day booking.");
      return;
    }

    if (
      form.recurrence_type !== "none"
      && !form.recurrence_end_date
    ) {
      setTechnicianAvailability(localTechnicianAvailability());
      setAvailabilityError("Choose Repeat Until to check recurring technician availability.");
      return;
    }

    try {
      setAvailabilityLoading(true);
      setAvailabilityError("");

      const params = new URLSearchParams({
        service_date: form.service_date,
        recurrence_type: form.recurrence_type || "none",
      });

      if (form.start_time) {
        params.set("start_time", form.start_time);
      }

      if (form.end_time) {
        params.set("end_time", form.end_time);
      }

      if (form.recurrence_end_date) {
        params.set("recurrence_end_date", form.recurrence_end_date);
      }

      if (editingTicket?.id) {
        params.set("ticket_id", String(editingTicket.id));
      }

      const response = await apiFetch(
        `${AVAILABILITY_API}?${params.toString()}`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstError = Object.values(data || {})[0];

        throw new Error(
          data.detail
          || (Array.isArray(firstError) ? firstError[0] : firstError)
          || "Unable to check technician availability."
        );
      }

      const nextAvailability = {};

      for (const item of data.technicians || []) {
        nextAvailability[String(item.id)] = item;
      }

      setTechnicianAvailability(nextAvailability);

      if ((data.available_count || 0) === 0) {
        setAvailabilityError(
          "No technicians are available for this schedule. Save the ticket unassigned or choose another date/time."
        );
      }
    } catch (err) {
      if (err.message !== "Unauthorized") {
        setAvailabilityError(err.message);
      }
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadCalendar = async () => {
    try {
      setCalendarLoading(true);

      const params =
        new URLSearchParams({
          month: isoMonth(
            calendarDate
          ),
        });

      if (technicianFilter) {
        params.set(
          "technician",
          technicianFilter
        );
      }

      const response =
        await apiFetch(
          `${CALENDAR_API}?${params}`
        );

      if (!response.ok) {
        throw new Error(
          "Unable to load calendar."
        );
      }

      setCalendarEvents(
        await response.json()
      );
    } catch (err) {
      if (
        err.message !== "Unauthorized"
      ) {
        setError(err.message);
      }
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      logout();
      return;
    }

    Promise.all([
      loadPermissions(),
      loadReferenceData(),
    ]).catch((err) => {
      if (
        err.message !== "Unauthorized"
      ) {
        setError(err.message);
      }
    });

    loadTickets();
  }, []);

  useEffect(() => {
    if (
      viewMode === "calendar"
      && permissions
    ) {
      loadCalendar();
    }
  }, [
    viewMode,
    calendarDate,
    technicianFilter,
    permissions,
  ]);

  useEffect(() => {
    if (!dueDatePickerOpen || !canAssign) {
      return;
    }

    loadDueDateAvailabilityCalendar();
  }, [
    dueDatePickerOpen,
    canAssign,
    dueDateCalendarDate,
  ]);

  useEffect(() => {
    if (!showModal || !canAssign) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadTechnicianAvailability();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    showModal,
    canAssign,
    form.service_date,
    form.start_time,
    form.end_time,
    form.recurrence_type,
    form.recurrence_end_date,
    editingTicket?.id,
    technicians.length,
  ]);

  const filteredTickets =
    useMemo(() => {
      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      return tickets.filter(
        (ticket) => {
          if (
            statusFilter
            && ticket.status
              !== statusFilter
          ) {
            return false;
          }

          if (
            priorityFilter
            && ticket.priority
              !== priorityFilter
          ) {
            return false;
          }

          if (
            technicianFilter
            && !ticket
              .technician_details
              ?.some(
                (technician) =>
                  String(
                    technician.id
                  )
                  ===
                  String(
                    technicianFilter
                  )
              )
          ) {
            return false;
          }

          if (pastDueOnly) {
            if (!ticket.due_date) {
              return false;
            }

            if (ticket.status === "closed") {
              return false;
            }

            const dueDate = new Date(
              `${ticket.due_date}T00:00:00`
            );

            if (
              dueDate.getTime()
              >= today.getTime()
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      tickets,
      statusFilter,
      priorityFilter,
      technicianFilter,
      pastDueOnly,
    ]);

  const customerDisplayName = (
    customer
  ) =>
    customer?.company_name
    || customer?.contact_name
    || customer?.email
    || customer?.phone
    || (
      customer?.id
        ? `Customer #${customer.id}`
        : "Customer"
    );

  const filteredCustomers =
    useMemo(() => {
      const query =
        customerQuery
          .trim()
          .toLowerCase();

      const results = query
        ? customers.filter(
            (customer) =>
              [
                customer.company_name,
                customer.contact_name,
                customer.email,
                customer.phone,
              ].some(
                (value) =>
                  String(value || "")
                    .toLowerCase()
                    .includes(query)
              )
          )
        : customers;

      return results.slice(
        0,
        10
      );
    }, [
      customers,
      customerQuery,
    ]);

  const customerLocations =
    useMemo(
      () =>
        locations.filter(
          (item) =>
            String(
              item.customer
            )
            ===
            String(
              form.customer
            )
        ),
      [
        locations,
        form.customer,
      ]
    );

  const locationEquipment =
    useMemo(
      () =>
        equipment.filter(
          (item) =>
            String(
              item.location
            )
            ===
            String(
              form.location
            )
        ),
      [
        equipment,
        form.location,
      ]
    );

  const openCreateModal = () => {
    setEditingTicket(null);
    setViewOnly(false);
    setPendingFiles([]);
    setErrorModal(null);
    setFieldErrors({});

    const customerId =
      location.state?.customerId
        ? String(
            location.state.customerId
          )
        : "";

    const selectedCustomer =
      customers.find(
        (item) =>
          String(item.id)
          === customerId
      );

    setCustomerQuery(
      selectedCustomer
        ? customerDisplayName(
            selectedCustomer
          )
        : ""
    );

    setShowCustomerResults(
      false
    );
    setShowQuickCustomer(false);
    setQuickCustomerError("");
    setQuickCustomerForm({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
    });

    setShowQuickLocation(false);
    setQuickLocationError("");
    setShowQuickEquipment(false);
    setQuickEquipmentError("");
    setQuickLocationForm({
      location_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "United States",
      contact_name: selectedCustomer?.contact_name || "",
      contact_email: selectedCustomer?.email || "",
      phone: selectedCustomer?.phone || "",
    });

    setShowQuickEquipment(false);
    setQuickEquipmentError("");
    setQuickEquipmentForm({
      equipment_name: "",
      equipment_type: "",
      manufacturer: "",
      model_number: "",
      serial_number: "",
      asset_tag: "",
      ownership_type: "owned",
      status: "active",
      notes: "",
    });

    setForm({
      ...EMPTY_FORM,

      customer:
        customerId,

      contact_name:
        selectedCustomer
          ?.contact_name || "",

      contact_email:
        selectedCustomer
          ?.email || "",

      contact_phone:
        selectedCustomer
          ?.phone || "",
    });

    setShowModal(true);
  };

  const ticketToForm = (
    ticket
  ) => ({
    customer:
      ticket.customer
        ? String(
            ticket.customer
          )
        : "",

    location:
      ticket.location
        ? String(
            ticket.location
          )
        : "",

    equipment:
      ticket.equipment
        ? String(
            ticket.equipment
          )
        : "",

    subject:
      ticket.subject || "",

    description:
      ticket.description || "",

    contact_name:
      ticket.contact_name || "",

    contact_email:
      ticket.contact_email || "",

    contact_phone:
      ticket.contact_phone || "",

    category:
      ticket.category
      || "service",

    priority:
      ticket.priority
      || "medium",

    status:
      ticket.status
      || "open",

    technicians:
      (
        ticket
          .technician_details
        || []
      ).map(
        (item) =>
          String(item.id)
      ),

    due_date:
      ticket.due_date || "",

    service_date:
      ticket.service_date || "",

    start_time:
      ticket.start_time
        ? String(
            ticket.start_time
          ).slice(0, 5)
        : "",

    end_time:
      ticket.end_time
        ? String(
            ticket.end_time
          ).slice(0, 5)
        : "",

    recurrence_type:
      ticket
        .recurrence_type
      || "none",

    recurrence_end_date:
      ticket
        .recurrence_end_date
      || "",

    notes:
      ticket.notes || "",

    work_performed:
      ticket
        .work_performed
      || "",

    time_on_site:
      ticket
        .time_on_site
      || "",

    equipment_materials_used:
      ticket
        .equipment_materials_used
      || "",
  });

  const openTicketModal = (
    ticket,
    readOnly = false
  ) => {
    setErrorModal(null);
    setEditingTicket(ticket);

    setViewOnly(
      readOnly || !canEdit
    );

    setPendingFiles([]);

    const selectedCustomer =
      customers.find(
        (item) =>
          String(item.id)
          ===
          String(
            ticket.customer
          )
      );

    setCustomerQuery(
      selectedCustomer
        ? customerDisplayName(
            selectedCustomer
          )
        : (
            ticket.customer_name
            || ""
          )
    );

    setShowCustomerResults(
      false
    );
    setShowQuickCustomer(false);
    setQuickCustomerError("");
    setQuickCustomerDuplicate(null);
    setShowQuickLocation(false);
    setQuickLocationError("");
    setShowQuickEquipment(false);
    setQuickEquipmentError("");

    setForm(
      ticketToForm(ticket)
    );

    setShowModal(true);
  };

  const handleCustomerSearch = (
    event
  ) => {
    const value =
      event.target.value;

    setCustomerQuery(value);
    clearFieldError("customer");
    clearFieldError("contact_name");
    clearFieldError("contact_email");
    clearFieldError("contact_phone");

    setShowCustomerResults(
      true
    );
    setShowQuickLocation(false);
    setQuickLocationError("");
    setShowQuickEquipment(false);
    setQuickEquipmentError("");

    setForm(
      (previous) => ({
        ...previous,

        customer: "",
        location: "",
        equipment: "",

        contact_name: "",
        contact_email: "",
        contact_phone: "",
      })
    );
  };

  const selectCustomer = (
    customer
  ) => {
    setCustomerQuery(
      customerDisplayName(
        customer
      )
    );
    clearFieldError("customer");

    setShowCustomerResults(
      false
    );
    setShowQuickCustomer(false);
    setQuickCustomerError("");
    setShowQuickLocation(false);
    setQuickLocationError("");
    setQuickLocationForm({
      location_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "United States",
      contact_name: customer.contact_name || "",
      contact_email: customer.email || "",
      phone: customer.phone || "",
    });

    setForm(
      (previous) => ({
        ...previous,

        customer:
          String(
            customer.id
          ),

        location: "",
        equipment: "",

        contact_name:
          customer
            .contact_name
          || "",

        contact_email:
          customer.email
          || "",

        contact_phone:
          customer.phone
          || "",
      })
    );
  };

  const openQuickCustomer = () => {
    setShowCustomerResults(false);
    setQuickCustomerError("");
    setQuickCustomerDuplicate(null);
    setQuickCustomerForm({
      company_name:
        customerQuery.trim(),
      contact_name:
        form.contact_name || "",
      email:
        form.contact_email || "",
      phone:
        form.contact_phone || "",
    });
    setShowQuickCustomer(true);
  };

  const handleQuickCustomerField = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setQuickCustomerError("");
    setQuickCustomerDuplicate(null);
    setQuickCustomerForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };


  const findQuickCustomerDuplicate =
    async (
      candidate
    ) => {
      const terms = [
        candidate.contact_name,
        candidate.email,
        candidate.phone,
      ]
        .map(
          (value) =>
            String(
              value || ""
            ).trim()
        )
        .filter(Boolean);

      const uniqueTerms = [
        ...new Set(terms),
      ];

      const matches = new Map();

      for (
        const term
        of uniqueTerms
      ) {
        const response =
          await apiFetch(
            `${CUSTOMERS_API}?search=${encodeURIComponent(term)}`
          );

        if (!response.ok) {
          continue;
        }

        const data =
          await response
            .json()
            .catch(
              () => []
            );

        const rows =
          Array.isArray(data)
            ? data
            : data.results || [];

        rows.forEach(
          (customer) => {
            const reason =
              customerDuplicateReason(
                customer,
                candidate
              );

            if (reason) {
              matches.set(
                String(
                  customer.id
                ),
                {
                  ...customer,
                  duplicate_reason:
                    reason,
                }
              );
            }
          }
        );
      }

      return (
        matches
          .values()
          .next()
          .value
        || null
      );
    };


  const saveQuickCustomer =
    async (
      createAnyway = false
    ) => {
      try {
        setQuickCustomerSaving(true);
        setQuickCustomerError("");

        if (!createAnyway) {
          const duplicate =
            await findQuickCustomerDuplicate(
              quickCustomerForm
            );

          if (duplicate) {
            setQuickCustomerDuplicate(
              duplicate
            );

            return;
          }
        }

        setQuickCustomerDuplicate(null);

        const response =
          await apiFetch(
            QUICK_CUSTOMER_API,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                ...quickCustomerForm,
                status: "active",
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          const details =
            apiErrorDetails(
              data,
              "Unable to create customer."
            );

          setQuickCustomerError(
            details.message
          );
          return;
        }

        setQuickCustomerDuplicate(
          null
        );

        setCustomers(
          (previous) => {
            const withoutCreated =
              previous.filter(
                (item) =>
                  String(item.id)
                  !== String(data.id)
              );

            return [
              data,
              ...withoutCreated,
            ];
          }
        );

        selectCustomer(data);

      } catch (err) {
        if (
          err.message
          !== "Unauthorized"
        ) {
          setQuickCustomerError(
            "Unable to connect to the server."
          );
        }
      } finally {
        setQuickCustomerSaving(false);
      }
    };

  const openQuickLocation = () => {
    if (!form.customer) {
      setQuickLocationError(
        "Select or create a customer first."
      );
      return;
    }

    const selectedCustomer =
      customers.find(
        (item) =>
          String(item.id) ===
          String(form.customer)
      );

    setQuickLocationError("");
    setQuickLocationForm({
      location_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "United States",
      contact_name:
        form.contact_name ||
        selectedCustomer?.contact_name ||
        "",
      contact_email:
        form.contact_email ||
        selectedCustomer?.email ||
        "",
      phone:
        form.contact_phone ||
        selectedCustomer?.phone ||
        "",
    });
    setShowQuickLocation(true);
  };

  const handleQuickLocationField = (
    event
  ) => {
    const { name, value } = event.target;

    setQuickLocationError("");
    setQuickLocationForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const saveQuickLocation = async () => {
    if (!form.customer) {
      setQuickLocationError(
        "Select or create a customer first."
      );
      return;
    }

    try {
      setQuickLocationSaving(true);
      setQuickLocationError("");

      const response = await apiFetch(
        LOCATIONS_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: Number(form.customer),
            ...quickLocationForm,
            country:
              quickLocationForm.country ||
              "United States",
            status: "active",
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const details = apiErrorDetails(
          data,
          "Unable to create location."
        );

        setQuickLocationError(
          details.message
        );
        return;
      }

      setLocations((previous) => {
        const withoutCreated =
          previous.filter(
            (item) =>
              String(item.id) !==
              String(data.id)
          );

        return [
          data,
          ...withoutCreated,
        ];
      });

      setForm((previous) => ({
        ...previous,
        location: String(data.id),
        equipment: "",
        contact_name:
          previous.contact_name ||
          data.contact_name ||
          "",
        contact_email:
          previous.contact_email ||
          data.contact_email ||
          "",
        contact_phone:
          previous.contact_phone ||
          data.phone ||
          "",
      }));

      clearFieldError("location");
      setShowQuickLocation(false);
      setQuickLocationError("");
      setShowQuickEquipment(false);
      setQuickEquipmentError("");

    } catch (err) {
      if (err.message !== "Unauthorized") {
        setQuickLocationError(
          "Unable to connect to the server."
        );
      }
    } finally {
      setQuickLocationSaving(false);
    }
  };

  const openQuickEquipment = async () => {
    if (!form.location) {
      setQuickEquipmentError(
        "Select or create a location first."
      );
      return;
    }

    setQuickEquipmentError("");
    setQuickEquipmentForm({
      equipment_name: "",
      equipment_type: "",
      manufacturer: "",
      model_number: "",
      serial_number: "",
      asset_tag: "",
      ownership_type: "owned",
      status: "active",
      notes: "",
    });
    setShowQuickEquipment(true);

    try {
      const response = await apiFetch(
        NEXT_ASSET_TAG_API
      );

      if (!response.ok) {
        return;
      }

      const data = await response
        .json()
        .catch(() => ({}));

      if (data.asset_tag) {
        setQuickEquipmentForm(
          (previous) => ({
            ...previous,
            asset_tag:
              previous.asset_tag ||
              data.asset_tag,
          })
        );
      }
    } catch (err) {
      if (err.message !== "Unauthorized") {
        console.warn(
          "Unable to preview next Asset Tag.",
          err
        );
      }
    }
  };

  const handleQuickEquipmentField = (
    event
  ) => {
    const { name, value } = event.target;

    setQuickEquipmentError("");
    setQuickEquipmentForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const saveQuickEquipment = async () => {
    if (!form.location) {
      setQuickEquipmentError(
        "Select or create a location first."
      );
      return;
    }

    try {
      setQuickEquipmentSaving(true);
      setQuickEquipmentError("");

      const response = await apiFetch(
        EQUIPMENT_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: Number(form.location),
            ...quickEquipmentForm,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const details = apiErrorDetails(
          data,
          "Unable to create equipment."
        );

        setQuickEquipmentError(
          details.message
        );
        return;
      }

      setEquipment((previous) => {
        const withoutCreated =
          previous.filter(
            (item) =>
              String(item.id) !==
              String(data.id)
          );

        return [
          data,
          ...withoutCreated,
        ];
      });

      setForm((previous) => ({
        ...previous,
        equipment: String(data.id),
      }));

      clearFieldError("equipment");
      setShowQuickEquipment(false);
      setQuickEquipmentError("");

    } catch (err) {
      if (err.message !== "Unauthorized") {
        setQuickEquipmentError(
          "Unable to connect to the server."
        );
      }
    } finally {
      setQuickEquipmentSaving(false);
    }
  };

  const handleField = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    clearFieldError(name);

    if (name === "service_date" || name === "due_date") {
      clearFieldError("service_date");
      clearFieldError("due_date");
    }

    if (name === "start_time" || name === "end_time") {
      clearFieldError("start_time");
      clearFieldError("end_time");
    }

    if (name === "recurrence_type" || name === "recurrence_end_date") {
      clearFieldError("recurrence_type");
      clearFieldError("recurrence_end_date");
    }

    setForm(
      (previous) => {
        const next = {
          ...previous,
          [name]: value,
        };

        if (
          name === "customer"
        ) {
          next.location = "";
          next.equipment = "";
          setShowQuickLocation(false);
          setQuickLocationError("");
          setShowQuickEquipment(false);
          setQuickEquipmentError("");

          const selected =
            customers.find(
              (item) =>
                String(item.id)
                ===
                String(value)
            );

          if (selected) {
            next.contact_name =
              selected
                .contact_name
              || "";

            next.contact_email =
              selected.email
              || "";

            next.contact_phone =
              selected.phone
              || "";
          }
        }

        if (
          name === "location"
        ) {
          next.equipment = "";
          setShowQuickEquipment(false);
          setQuickEquipmentError("");
        }

        if (
          name
            === "recurrence_type"
          && value === "none"
        ) {
          next
            .recurrence_end_date
            = "";
        }

        return next;
      }
    );
  };

  const toggleTechnician = (
    technicianId
  ) => {
    clearFieldError("technicians");

    setForm(
      (previous) => {
        const id =
          String(
            technicianId
          );

        const selected =
          previous
            .technicians
            .includes(id);

        return {
          ...previous,

          technicians:
            selected
              ? previous
                  .technicians
                  .filter(
                    (item) =>
                      item !== id
                  )
              : [
                  ...previous
                    .technicians,
                  id,
                ],
        };
      }
    );
  };

  const uploadFiles = async (
    ticketId,
    files,
    attachmentType = "general"
  ) => {
    const uploadedAttachments = [];

    for (
      const file
      of files
    ) {
      const payload =
        new FormData();

      payload.append(
        "file",
        file
      );

      payload.append(
        "attachment_type",
        attachmentType
      );

      const response =
        await apiFetch(
          apiUrl(
            `/api/tickets/${ticketId}/attachments/`
          ),
          {
            method: "POST",
            body: payload,
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        throw new Error(
          data?.file?.[0]
          ||
          data?.attachment_type?.[0]
          ||
          data?.detail
          ||
          `Unable to upload ${file.name}.`
        );
      }

      uploadedAttachments.push(
        data
      );
    }

    return uploadedAttachments;
  };


  const uploadCompletedWorkTickets =
    async (
      files
    ) => {
      if (
        !editingTicket?.id
        ||
        !files.length
      ) {
        return;
      }

      try {
        setCompletedWorkTicketUploading(
          true
        );

        setError("");

        const uploaded =
          await uploadFiles(
            editingTicket.id,
            files,
            "completed_work_ticket"
          );

        setEditingTicket(
          (previous) => ({
            ...previous,

            attachments: [
              ...uploaded,
              ...(
                previous
                  ?.attachments
                || []
              ),
            ],
          })
        );

        await loadTickets();

      } catch (err) {
        if (
          err.message
          !== "Unauthorized"
        ) {
          showTicketError(
            err.message,
            "Completed Work Ticket",
            []
          );
        }
      } finally {
        setCompletedWorkTicketUploading(
          false
        );
      }
    };

  const downloadAttachment =
    async (
      attachment
    ) => {
      if (
        !attachment
          ?.file_url
      ) {
        return;
      }

      try {
        setError("");

        const response =
          await apiFetch(
            attachment.file_url
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          throw new Error(
            data?.detail
            ||
            `Unable to download ${
              attachment
                .original_name
              || "attachment"
            }.`
          );
        }

        const blob =
          await response.blob();

        const blobUrl =
          window.URL
            .createObjectURL(
              blob
            );

        const link =
          document
            .createElement(
              "a"
            );

        link.href =
          blobUrl;

        link.download =
          attachment
            .original_name
          || "attachment";

        document
          .body
          .appendChild(
            link
          );

        link.click();
        link.remove();

        window.URL
          .revokeObjectURL(
            blobUrl
          );
      } catch (err) {
        if (
          err.message
          !== "Unauthorized"
        ) {
          setError(
            err.message
          );
        }
      }
    };

  const handleSave = async (
    event
  ) => {
    event.preventDefault();

    if (viewOnly) {
      return;
    }

    if (canAssign) {
      if (form.service_date && form.service_date < scheduleDateMin) {
        showTicketError(
          "Past service dates are not allowed.",
          "Technician Assignment & Calendar",
          ["service_date"]
        );
        return;
      }

      if (form.due_date && form.service_date && form.service_date > form.due_date) {
        showTicketError(
          "Appointment / Service Date cannot be later than the Due Date.",
          "Technician Assignment & Calendar",
          ["service_date", "due_date"]
        );
        return;
      }

      if (Boolean(form.start_time) !== Boolean(form.end_time)) {
        showTicketError(
          "Set both Start Time and End Time, or leave both blank for an all-day booking.",
          "Technician Assignment & Calendar",
          ["start_time", "end_time"]
        );
        return;
      }

      if (form.start_time && form.end_time && form.end_time <= form.start_time) {
        showTicketError(
          "End time must be later than start time.",
          "Technician Assignment & Calendar",
          ["start_time", "end_time"]
        );
        return;
      }


      if (
        form.recurrence_type !== "none"
        && form.service_date
        && form.recurrence_end_date
        && form.recurrence_end_date < form.service_date
      ) {
        showTicketError(
          "Repeat Until cannot be before the service date.",
          "Technician Assignment & Calendar",
          ["service_date", "recurrence_end_date"]
        );
        return;
      }

      if (form.service_date) {
        const unavailableSelected = form.technicians.filter((technicianId) => {
          const availability = technicianAvailability[String(technicianId)];
          return availability && availability.available === false;
        });

        if (unavailableSelected.length) {
          showTicketError(
            "One or more selected technicians are no longer available for this schedule. Choose another technician, date, or time.",
            "Technician Assignment & Calendar",
            ["technicians"]
          );
          return;
        }
      }
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,

        customer:
          form.customer
            ? Number(form.customer)
            : null,

        location:
          form.location
            ? Number(
                form.location
              )
            : null,

        equipment:
          form.equipment
            ? Number(
                form.equipment
              )
            : null,

        technicians:
          canAssign
            ? form
                .technicians
                .map(Number)
            : [],

        due_date:
          form.due_date
          || null,

        service_date:
          canAssign
            ? form
                .service_date
              || null
            : null,

        start_time:
          canAssign
            ? form
                .start_time
              || null
            : null,

        end_time:
          canAssign
            ? form
                .end_time
              || null
            : null,

        recurrence_type:
          canAssign
            ? form
                .recurrence_type
            : "none",

        recurrence_end_date:
          canAssign
          &&
          form
            .recurrence_type
            !== "none"
            ? form
                .recurrence_end_date
              || null
            : null,
      };

      const response =
        await apiFetch(
          editingTicket
            ? `${TICKETS_API}${editingTicket.id}/`
            : TICKETS_API,
          {
            method:
              editingTicket
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        if (data?.technicians) {
          loadTechnicianAvailability();
        }

        const details = apiErrorDetails(
          data,
          "Unable to save ticket."
        );

        const saveError = new Error(details.message);
        saveError.ticketSection = details.section;
        saveError.ticketFields = details.fields || [];
        throw saveError;
      }

      if (
        pendingFiles.length
        &&
        !isTechnician
        &&
        (
          canEdit
          ||
          canAssign
          ||
          (
            !editingTicket
            &&
            canCreate
          )
        )
      ) {
        await uploadFiles(
          data.id,
          pendingFiles
        );
      }

      showSuccessToast(editingTicket ? "Ticket Updated" : "Ticket Created", editingTicket ? "Ticket information was successfully saved." : "New ticket was successfully created.");

      setShowModal(false);
      setEditingTicket(null);
      setPendingFiles([]);

      await loadTickets();

      if (
        viewMode
        === "calendar"
      ) {
        await loadCalendar();
      }
    } catch (err) {
      if (
        err.message
        !== "Unauthorized"
      ) {
        showTicketError(
          err.message,
          err.ticketSection || inferErrorSection(err.message),
          err.ticketFields || []
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete =
    async () => {
      if (!deleteTicket) {
        return;
      }

      try {
        setDeleteLoading(
          true
        );

        const response =
          await apiFetch(
            `${TICKETS_API}${deleteTicket.id}/`,
            {
              method:
                "DELETE",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to delete ticket."
          );
        }

        showSuccessToast("Ticket Deleted", "The ticket was successfully deleted.");

        setDeleteTicket(
          null
        );

        await loadTickets();

        if (
          viewMode
          === "calendar"
        ) {
          await loadCalendar();
        }
      } catch (err) {
        if (
          err.message
          !== "Unauthorized"
        ) {
          setError(
            err.message
          );
        }
      } finally {
        setDeleteLoading(
          false
        );
      }
    };

  const printTicket = (
    ticket
  ) => {
    const escapeHtml = (
      value
    ) =>
      String(
        value
        ?? ""
      )
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        )
        .replaceAll(
          '"',
          "&quot;"
        )
        .replaceAll(
          "'",
          "&#039;"
        );

    const locationRecord =
      locations.find(
        (item) =>
          String(
            item.id
          )
          ===
          String(
            ticket.location
          )
      );

    const locationAddress =
      [
        locationRecord
          ?.address_line1,
        locationRecord
          ?.address_line2,
        [
          locationRecord
            ?.city,
          locationRecord
            ?.state_province,
          locationRecord
            ?.postal_code,
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          ),
        locationRecord
          ?.country,
      ]
        .filter(
          (value) =>
            String(
              value
              || ""
            ).trim()
        )
        .join(
          ", "
        );

    const workDescription =
      [
        ticket.subject,
        ticket.description,
      ]
        .filter(
          (value) =>
            String(
              value
              || ""
            ).trim()
        )
        .map(
          escapeHtml
        )
        .join(
          " — "
        );

    const contactDetails =
      [
        ticket.contact_phone,
        ticket.contact_email,
      ]
        .filter(
          (value) =>
            String(
              value
              || ""
            ).trim()
        )
        .map(
          escapeHtml
        )
        .join(
          " / "
        );

    const serviceDate =
      ticket.service_date
        ? formatDate(
            ticket.service_date
          )
        : "";

    const ticketNumber =
      escapeHtml(
        ticket.ticket_number
        || ""
      );

    const isComplete =
      ticket.status
      === "closed";

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=900,height=1100"
      );

    if (!printWindow) {
      return;
    }

    const blankRows = (
      count
    ) =>
      Array.from(
        {
          length: count,
        },
        () => `
          <tr>
            <td>&nbsp;</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `
      ).join("");

    const equipmentRows =
      Array.from(
        {
          length: 9,
        },
        () => `
          <tr>
            <td>&nbsp;</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `
      ).join("");

    printWindow.document.write(
      `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${ticketNumber || "Work Ticket"}</title>

  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111111;
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      font-size: 10px;
      line-height: 1.22;
    }

    .work-ticket {
      width: 100%;
      max-width: 194mm;
      min-height: 281mm;
      margin: 0 auto;
    }

    .ticket-top {
      display: grid;
      grid-template-columns: 1.05fr 2.1fr 0.92fr;
      gap: 10px;
      align-items: start;
      margin-bottom: 5px;
    }

    .brand {
      padding-top: 1px;
    }

    .brand-name {
      display: flex;
      align-items: center;
      gap: 5px;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 17px;
      line-height: 0.95;
      font-weight: 700;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 25px;
      height: 25px;
      border: 1.4px solid #111;
      border-radius: 50%;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      font-weight: 700;
      transform: rotate(-10deg);
    }

    .company-info {
      margin-top: 5px;
      font-size: 7.5px;
      line-height: 1.35;
    }

    .ticket-no {
      margin-top: 4px;
      font-size: 7.5px;
      font-weight: 700;
    }

    .top-fields {
      display: grid;
      grid-template-columns: 1fr 0.72fr;
      column-gap: 11px;
      row-gap: 3px;
    }

    .field-line {
      min-height: 16px;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      white-space: nowrap;
    }

    .field-label {
      flex: 0 0 auto;
      font-size: 7.5px;
      font-weight: 700;
    }

    .field-value {
      min-width: 0;
      flex: 1;
      min-height: 13px;
      border-bottom: 1px solid #111;
      padding: 0 2px 1px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 8.5px;
    }

    .status-panel {
      padding-top: 2px;
    }

    .status-title {
      margin-bottom: 3px;
      font-size: 7.5px;
      font-weight: 700;
    }

    .status-option {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 3px 0;
      font-size: 8px;
    }

    .status-box {
      width: 8px;
      height: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #111;
      font-size: 8px;
      line-height: 1;
    }

    .section-title {
      margin: 3px 0 1px;
      font-size: 10px;
      font-weight: 700;
    }

    .ruled-area {
      position: relative;
      height: 58mm;
      overflow: hidden;
      background:
        repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 8mm,
          #333 8mm,
          #333 8.3mm
        );
    }

    .work-description-text {
      position: relative;
      z-index: 1;
      padding: 0 1mm;
      font-size: 9px;
      line-height: 8.3mm;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .time-table {
      margin-top: 3mm;
    }

    th,
    td {
      border: 1px solid #222;
      padding: 2px 3px;
      height: 18px;
      vertical-align: middle;
      font-size: 7.5px;
      font-weight: 400;
    }

    th {
      height: 6.5mm;
      font-weight: 700;
      text-align: left;
    }

    .time-table td {
      height: 8.5mm;
    }

    .time-table th:nth-child(1),
    .time-table td:nth-child(1) {
      width: 11%;
    }

    .time-table th:nth-child(2),
    .time-table td:nth-child(2) {
      width: 24%;
    }

    .time-table th:nth-child(3),
    .time-table td:nth-child(3) {
      width: 27%;
    }

    .time-table th:nth-child(4),
    .time-table td:nth-child(4) {
      width: 14%;
    }

    .time-table th:nth-child(5),
    .time-table td:nth-child(5) {
      width: 12%;
    }

    .time-table th:nth-child(6),
    .time-table td:nth-child(6) {
      width: 12%;
    }

    .equipment-title {
      margin-top: 4mm;
      margin-bottom: 1mm;
      font-size: 10px;
      font-weight: 700;
    }

    .equipment-table th:nth-child(1),
    .equipment-table td:nth-child(1),
    .equipment-table th:nth-child(3),
    .equipment-table td:nth-child(3) {
      width: 8%;
      text-align: center;
    }

    .equipment-table th:nth-child(2),
    .equipment-table td:nth-child(2),
    .equipment-table th:nth-child(4),
    .equipment-table td:nth-child(4) {
      width: 42%;
    }

    .equipment-table td {
      height: 7.8mm;
    }

    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
      margin-top: 18mm;
    }

    .signature-line {
      padding-top: 1.5mm;
      border-top: 1px solid #111;
      font-size: 8px;
    }

    .print-note {
      margin-top: 2mm;
      font-size: 6.5px;
      color: #444;
      text-align: right;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>

  <div class="work-ticket">

    <div class="ticket-top">

      <div class="brand">

        <div class="brand-name">
          <span>
            Expert<br />
            Technology
          </span>

          <span class="brand-mark">
            ET
          </span>
        </div>

        <div class="company-info">
          11884 Hwy 308<br />
          Larose, LA 70373<br />
          985-242-4343<br />
          Tickets@experttechnology.net
        </div>

        ${
          ticketNumber
            ? `
              <div class="ticket-no">
                Ticket: ${ticketNumber}
              </div>
            `
            : ""
        }

      </div>


      <div class="top-fields">

        <div class="field-line">
          <span class="field-label">
            Customer:
          </span>

          <span class="field-value">
            ${escapeHtml(
              ticket.customer_name
              || ""
            )}
          </span>
        </div>

        <div class="field-line">
          <span class="field-label">
            Date:
          </span>

          <span class="field-value">
            ${escapeHtml(
              serviceDate
            )}
          </span>
        </div>


        <div class="field-line">
          <span class="field-label">
            Location:
          </span>

          <span class="field-value">
            ${escapeHtml(
              [
                ticket.location_name,
                locationAddress,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " — "
                )
            )}
          </span>
        </div>

        <div class="field-line">
          <span class="field-label">
            Vessel:
          </span>

          <span class="field-value">
          </span>
        </div>


        <div class="field-line">
          <span class="field-label">
            Contact Name:
          </span>

          <span class="field-value">
            ${escapeHtml(
              ticket.contact_name
              || ""
            )}
            ${
              contactDetails
                ? ` — ${contactDetails}`
                : ""
            }
          </span>
        </div>

        <div class="field-line">
          <span class="field-label">
            P.O.:
          </span>

          <span class="field-value">
          </span>
        </div>

      </div>


      <div class="status-panel">

        <div class="status-title">
          Job Status
        </div>

        <div class="status-option">
          <span class="status-box">
            ${
              isComplete
                ? "✓"
                : ""
            }
          </span>

          Complete
        </div>

        <div class="status-option">
          <span class="status-box">
            ${
              !isComplete
                ? "✓"
                : ""
            }
          </span>

          Incomplete
        </div>

      </div>

    </div>


    <div class="section-title">
      Work Description
    </div>

    <div class="ruled-area">

      <div class="work-description-text">
        ${workDescription}
      </div>

    </div>


    <table class="time-table">

      <thead>

        <tr>
          <th>Date</th>
          <th>Technician</th>
          <th>Service Type/Travel</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Total Hours</th>
        </tr>

      </thead>

      <tbody>
        ${blankRows(6)}
      </tbody>

    </table>


    <div class="equipment-title">
      Equipment
    </div>

    <table class="equipment-table">

      <thead>

        <tr>
          <th>Qty</th>
          <th>Model #/Description</th>
          <th>Qty</th>
          <th>Model #/Description</th>
        </tr>

      </thead>

      <tbody>
        ${equipmentRows}
      </tbody>

    </table>


    <div class="signatures">

      <div class="signature-line">
        Technician Signature
      </div>

      <div class="signature-line">
        Customer Signature
      </div>

    </div>


    <div class="print-note">
      Field technician completes time, equipment/materials, and signatures by hand.
    </div>

  </div>


  <script>
    window.onload = () => {
      window.print();
    };
  <\/script>

</body>
</html>`
    );

    printWindow.document.close();
  };

  const cells =
    useMemo(
      () =>
        calendarCells(
          calendarDate
        ),
      [
        calendarDate,
      ]
    );

  const eventsByDate =
    useMemo(() => {
      const map = {};

      for (
        const event
        of calendarEvents
      ) {
        if (
          !map[
            event.service_date
          ]
        ) {
          map[
            event.service_date
          ] = [];
        }

        map[
          event.service_date
        ].push(event);
      }

      return map;
    }, [
      calendarEvents,
    ]);

  const dueDateCalendarCells = useMemo(
    () => calendarCells(dueDateCalendarDate),
    [dueDateCalendarDate]
  );

  const dueDateEventsByDate = useMemo(() => {
    const map = {};

    for (const event of dueDateCalendarEvents) {
      if (!event?.service_date) {
        continue;
      }

      if (!map[event.service_date]) {
        map[event.service_date] = [];
      }

      map[event.service_date].push(event);
    }

    return map;
  }, [dueDateCalendarEvents]);

  const getTechnicianDayAvailability = (dateKey) => {
    const events = dueDateEventsByDate[dateKey] || [];

    return technicians.map((technician) => {
      const technicianId = String(technician.id);
      const status = String(technician.status || "active");
      const bookings = events.filter((event) =>
        (event.technicians || []).some(
          (eventTechnician) => String(eventTechnician.id) === technicianId
        )
      );

      if (status === "on_leave") {
        return {
          technician,
          state: "unavailable",
          label: "On Leave",
          bookings,
        };
      }

      if (status === "inactive") {
        return {
          technician,
          state: "unavailable",
          label: "Inactive",
          bookings,
        };
      }

      if (bookings.some((booking) => !booking.start_time || !booking.end_time)) {
        return {
          technician,
          state: "booked",
          label: "Booked all day",
          bookings,
        };
      }

      if (bookings.length > 0) {
        return {
          technician,
          state: "partial",
          label: bookings
            .map((booking) => {
              const start = String(booking.start_time || "").slice(0, 5);
              const end = String(booking.end_time || "").slice(0, 5);
              return start && end ? `${start}-${end}` : "Booked";
            })
            .join(", "),
          bookings,
        };
      }

      return {
        technician,
        state: "available",
        label: "Available all day",
        bookings: [],
      };
    });
  };

  const dueDatePreviewAvailability = useMemo(
    () => getTechnicianDayAvailability(dueDatePreviewKey),
    [
      dueDatePreviewKey,
      dueDateEventsByDate,
      technicians,
    ]
  );

  const openCalendarEvent = (
    event
  ) => {
    const ticket =
      tickets.find(
        (item) =>
          item.id
          ===
          event.ticket_id
      );

    if (ticket) {
      openTicketModal(
        ticket,
        !canEdit
      );
    }
  };

  return (
    <div className="tickets-page">

      <div className="tickets-header">

        <div>

          <button
            className="tickets-back"
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
            Ticketing

            <PageGuide
              title="Ticketing"
              text="Create, search, schedule, assign, track, and resolve service tickets. Use Table or Calendar view to manage work."
            />
          </h1>

          <p>
            Service tickets,
            technician scheduling,
            recurring maintenance,
            attachments, and printable
            work tickets.
          </p>

        </div>

        {canCreate && (

          <button
            className="ticket-primary"
            onClick={
              openCreateModal
            }
          >

            <Plus
              size={17}
            />

            New Ticket

          </button>

        )}

      </div>


      {error && (

        <div className="ticket-error">

          <CircleAlert
            size={17}
          />

          {error}

        </div>

      )}


      <div className="tickets-toolbar">

        <form
          className="ticket-search"
          onSubmit={(event) => {
            event.preventDefault();
            loadTickets();
          }}
        >

          <Search
            size={17}
          />

          <input
            value={
              search
            }
            onChange={(event) => {
              const value =
                event.target.value;

              setSearch(value);

              loadTicketsWithSearch(
                value
              );
            }}
            placeholder="Search ticket, customer, equipment..."
          />

          <button
            type="submit"
          >
            Search
          </button>

        </form>


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

          <option value="open">
            Open
          </option>

          <option value="closed">
            Closed
          </option>
        </select>


        <select
          value={
            priorityFilter
          }
          onChange={(event) =>
            setPriorityFilter(
              event.target.value
            )
          }
        >
          <option value="">
            All Priorities
          </option>

          <option value="low">
            Low
          </option>

          <option value="medium">
            Medium
          </option>

          <option value="high">
            High
          </option>
        </select>


        <select
          value={
            technicianFilter
          }
          onChange={(event) =>
            setTechnicianFilter(
              event.target.value
            )
          }
          disabled={
            isTechnician
          }
        >

          <option value="">
            {isTechnician
              ? "My Calendar"
              : "All Technicians"}
          </option>

          {!isTechnician
            &&
            technicians.map(
              (technician) => (

                <option
                  key={
                    technician.id
                  }
                  value={
                    technician.id
                  }
                >
                  {
                    technician.full_name
                    ||
                    technician.employee_id
                  }
                </option>

              )
            )}

        </select>


        <div className="ticket-view-toggle">

          <button
            className={
              viewMode === "table"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode(
                "table"
              )
            }
          >

            <List
              size={15}
            />

            Table

          </button>


          <button
            className={
              viewMode === "calendar"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode(
                "calendar"
              )
            }
          >

            <CalendarDays
              size={15}
            />

            Calendar

          </button>

        </div>

      </div>


      {viewMode === "table" ? (

        <div className="tickets-card">

          {loading ? (

            <div className="ticket-empty">

              <RefreshCw
                className="spin"
                size={24}
              />

              Loading tickets...

            </div>

          ) : filteredTickets.length === 0 ? (

            <div className="ticket-empty">

              <TicketIcon
                size={38}
              />

              <h3>
                No tickets found
              </h3>

            </div>

          ) : (

            <div className="ticket-table-wrap">

              <table className="ticket-table">

                <thead>

                  <tr>
                    <th>
                      Ticket
                    </th>

                    <th>
                      Customer / Subject
                    </th>

                    <th>
                      Priority
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Technicians
                    </th>

                    <th>
                      Service Date
                    </th>

                    <th>
                      Due
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {filteredTickets.map(
                    (ticket) => (

                      <tr
                        key={
                          ticket.id
                        }
                      >

                        <td>

                          <strong>
                            {
                              ticket.ticket_number
                            }
                          </strong>

                          <small>
                            {
                              CATEGORY_LABELS[
                                ticket.category
                              ]
                              ||
                              ticket.category
                            }
                          </small>

                        </td>


                        <td>

                          <strong>
                            {
                              ticket.customer_name
                            }
                          </strong>

                          <small>
                            {
                              ticket.subject
                            }
                          </small>

                        </td>


                        <td>

                          <span
                            className={
                              `ticket-badge priority-${ticket.priority}`
                            }
                          >
                            {
                              ticket.priority
                            }
                          </span>

                        </td>


                        <td>

                          <span
                            className={
                              `ticket-badge status-${ticket.status}`
                            }
                          >
                            {
                              ticket.status
                            }
                          </span>

                        </td>


                        <td>

                          {
                            ticket
                              .technician_names
                              ?.length
                              ? ticket
                                  .technician_names
                                  .join(", ")
                              : (
                                <span className="muted">
                                  Unassigned
                                </span>
                              )
                          }

                        </td>


                        <td>

                          {
                            ticket.service_date
                              ? (
                                <>
                                  <b>
                                    {
                                      formatDate(
                                        ticket.service_date
                                      )
                                    }
                                  </b>

                                  {
                                    ticket.start_time
                                    && (
                                      <small>
                                        {
                                          ticket.start_time.slice(
                                            0,
                                            5
                                          )
                                        }

                                        {
                                          ticket.end_time
                                            ? ` - ${ticket.end_time.slice(0, 5)}`
                                            : ""
                                        }
                                      </small>
                                    )
                                  }
                                </>
                              )
                              : "—"
                          }

                        </td>


                        <td>

                          {
                            ticket.due_date
                              ? formatDate(
                                  ticket.due_date
                                )
                              : "—"
                          }

                        </td>


                        <td>

                          <div className="ticket-row-actions">

                            <button
                              title="View"
                              onClick={() =>
                                openTicketModal(
                                  ticket,
                                  true
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>


                            {canEdit && (

                              <button
                                title="Edit"
                                onClick={() =>
                                  openTicketModal(
                                    ticket,
                                    false
                                  )
                                }
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>

                            )}


                            {canPrint && (

                              <button
                                title="Print work ticket"
                                onClick={() =>
                                  printTicket(
                                    ticket
                                  )
                                }
                              >
                                <Printer
                                  size={16}
                                />
                              </button>

                            )}


                            {canDelete && (

                              <button
                                className="danger"
                                title="Delete"
                                onClick={() =>
                                  setDeleteTicket(
                                    ticket
                                  )
                                }
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            )}

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

      ) : (

        <div className="ticket-calendar-card">

          <div className="ticket-calendar-head">

            <div>

              <h2>
                {
                  calendarDate
                    .toLocaleDateString(
                      undefined,
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )
                }
              </h2>

              <p>
                Tickets appear after
                they are assigned to a
                technician and have a
                service date.
              </p>

            </div>


            <div className="ticket-calendar-nav">

              <button
                onClick={() => {
                  const now =
                    new Date();

                  setCalendarDate(
                    new Date(
                      now.getFullYear(),
                      now.getMonth(),
                      1
                    )
                  );
                }}
              >
                Today
              </button>


              <button
                onClick={() =>
                  setCalendarDate(
                    (date) =>
                      new Date(
                        date.getFullYear(),
                        date.getMonth() - 1,
                        1
                      )
                  )
                }
              >
                <ChevronLeft
                  size={17}
                />
              </button>


              <button
                onClick={() =>
                  setCalendarDate(
                    (date) =>
                      new Date(
                        date.getFullYear(),
                        date.getMonth() + 1,
                        1
                      )
                  )
                }
              >
                <ChevronRight
                  size={17}
                />
              </button>

            </div>

          </div>


          <div className="ticket-calendar-weekdays">

            {
              [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (day) => (

                  <div
                    key={
                      day
                    }
                  >
                    {day}
                  </div>

                )
              )
            }

          </div>


          <div className="ticket-calendar-grid">

            {cells.map(
              (cell) => {
                const events =
                  eventsByDate[
                    cell.key
                  ] || [];

                const today =
                  cell.key
                  ===
                  localDateKey(
                    new Date()
                  );

                return (

                  <div
                    key={
                      cell.key
                    }
                    className={
                      `ticket-calendar-day ${
                        cell.currentMonth
                          ? ""
                          : "outside"
                      } ${
                        today
                          ? "today"
                          : ""
                      }`
                    }
                  >

                    <span className="day-number">
                      {
                        cell.date.getDate()
                      }
                    </span>


                    <div className="calendar-events">

                      {
                        events
                          .slice(
                            0,
                            4
                          )
                          .map(
                            (event) => (

                              <button
                                key={
                                  event.id
                                }
                                className={
                                  `calendar-event priority-${event.priority}`
                                }
                                onClick={() =>
                                  openCalendarEvent(
                                    event
                                  )
                                }
                              >

                                <strong>
                                  {
                                    event.start_time
                                      ? String(
                                          event.start_time
                                        ).slice(
                                          0,
                                          5
                                        )
                                      : ""
                                  }

                                  {" "}

                                  {
                                    event.ticket_number
                                  }
                                </strong>

                                <span>
                                  {
                                    event.subject
                                  }
                                </span>

                                <small>
                                  {
                                    event
                                      .technicians
                                      ?.map(
                                        (tech) =>
                                          tech.full_name
                                      )
                                      .join(", ")
                                  }
                                </small>

                              </button>

                            )
                          )
                      }


                      {
                        events.length > 4
                        && (
                          <div className="calendar-more">
                            +
                            {
                              events.length - 4
                            }
                            {" "}
                            more
                          </div>
                        )
                      }

                    </div>

                  </div>

                );
              }
            )}

          </div>


          {calendarLoading && (

            <div className="calendar-loading">
              Loading schedule...
            </div>

          )}

        </div>

      )}


      {showModal && (

        <div
          className="ticket-modal-overlay"
          onMouseDown={(event) =>
            event.target
              === event.currentTarget
            &&
            setShowModal(false)
          }
        >

          <div className="ticket-modal">

            <div className="ticket-modal-header">

              <div>

                <span className="eyebrow">

                  {
                    viewOnly
                      ? "Ticket Record"
                      : editingTicket
                        ? "Edit Ticket"
                        : "New Ticket"
                  }

                </span>


                <h2>
                  {
                    editingTicket
                      ?.ticket_number
                    ||
                    "Create Work Ticket"
                  }
                </h2>


                <p>

                  {
                    viewOnly
                      ? "View the complete work ticket and schedule."
                      : isTechnician
                        ? "Update ticket status and internal notes."
                        : "Enter service details, schedule, assignment, and work-ticket information."
                  }

                </p>

              </div>


              <div className="modal-head-actions">

                {
                  editingTicket
                  &&
                  canPrint
                  && (

                    <button
                      title="Print"
                      onClick={() =>
                        printTicket(
                          editingTicket
                        )
                      }
                    >
                      <Printer
                        size={18}
                      />
                    </button>

                  )
                }


                <button
                  title="Close"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  <X
                    size={20}
                  />
                </button>

              </div>

            </div>


            <form
              onSubmit={
                handleSave
              }
              noValidate
            >

              <fieldset
                disabled={
                  viewOnly
                  ||
                  saving
                }
              >

                <div className="ticket-form-section">

                  <h3>
                    Customer & Issue
                  </h3>


                  <div className="ticket-form-grid">

                    <label>

                      <span>
                        Customer
                      </span>


                      <div
                        style={{
                          position:
                            "relative",
                        }}
                      >

                        <input
                          type="text"
                          className={fieldErrors.customer ? "ticket-field-invalid" : ""}
                          aria-invalid={Boolean(fieldErrors.customer)}
                          value={
                            customerQuery
                          }
                          placeholder="Type customer name..."
                          autoComplete="off"
                          disabled={
                            isTechnician
                          }
                          onFocus={() => {
                            if (
                              !isTechnician
                            ) {
                              setShowCustomerResults(
                                true
                              );
                            }
                          }}
                          onChange={
                            handleCustomerSearch
                          }
                          onBlur={() => {
                            window.setTimeout(
                              () => {
                                setShowCustomerResults(
                                  false
                                );
                              },
                              150
                            );
                          }}
                        />


                        {
                          showCustomerResults
                          &&
                          !isTechnician
                          && (

                            <div
                              style={{
                                position:
                                  "absolute",

                                top:
                                  "calc(100% + 4px)",

                                left: 0,
                                right: 0,

                                zIndex:
                                  1000,

                                maxHeight:
                                  "220px",

                                overflowY:
                                  "auto",

                                background:
                                  "#ffffff",

                                border:
                                  "1px solid #cbd5e1",

                                borderRadius:
                                  "8px",

                                boxShadow:
                                  "0 10px 25px rgba(15, 23, 42, 0.15)",
                              }}
                            >

                              {
                                filteredCustomers.length
                                > 0
                                  ? filteredCustomers.map(
                                      (
                                        customer
                                      ) => (

                                        <button
                                          key={
                                            customer.id
                                          }
                                          type="button"
                                          onMouseDown={(
                                            event
                                          ) => {
                                            event
                                              .preventDefault();

                                            selectCustomer(
                                              customer
                                            );
                                          }}
                                          style={{
                                            display:
                                              "block",

                                            width:
                                              "100%",

                                            padding:
                                              "11px 12px",

                                            textAlign:
                                              "left",

                                            border:
                                              "none",

                                            borderBottom:
                                              "1px solid #f1f5f9",

                                            background:
                                              "#ffffff",

                                            cursor:
                                              "pointer",
                                          }}
                                        >

                                          <strong>
                                            {
                                              customerDisplayName(
                                                customer
                                              )
                                            }
                                          </strong>


                                          {
                                            customer
                                              .contact_name
                                            && (

                                              <small
                                                style={{
                                                  display:
                                                    "block",

                                                  marginTop:
                                                    "3px",
                                                }}
                                              >
                                                {
                                                  customer
                                                    .contact_name
                                                }
                                              </small>

                                            )
                                          }

                                        </button>

                                      )
                                    )
                                  : (

                                    <div
                                      style={{
                                        padding:
                                          "12px",
                                      }}
                                    >
                                      No customers found.
                                    </div>

                                  )
                              }

                            </div>

                          )
                        }

                      </div>


                    </label>


                    {
                      !editingTicket
                      && !viewOnly
                      && !isTechnician
                      && canCreate
                      && (

                        <div className="quick-customer-inline">

                          <button
                            type="button"
                            className="quick-customer-toggle"
                            onClick={
                              openQuickCustomer
                            }
                          >
                            <Plus size={14} />
                            Create New Customer
                          </button>

                          {
                            showQuickCustomer
                            && (

                              <div className="quick-customer-card">

                                <div className="quick-customer-head">
                                  <div>
                                    <strong>New Customer</strong>
                                    <small>Save and use this customer without leaving the ticket.</small>
                                  </div>

                                  <button
                                    type="button"
                                    className="quick-customer-close"
                                    onClick={() => {
                                      setShowQuickCustomer(false);
                                      setQuickCustomerError("");
                                      setQuickCustomerDuplicate(null);
                                    }}
                                    aria-label="Close quick customer form"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>

                                <div className="quick-customer-grid">
                                  <label>
                                    <span>Customer / Company Name</span>
                                    <input
                                      type="text"
                                      name="company_name"
                                      value={quickCustomerForm.company_name}
                                      onChange={handleQuickCustomerField}
                                      placeholder="Customer or company name"
                                    />
                                  </label>

                                  <label>
                                    <span>Contact Name</span>
                                    <input
                                      type="text"
                                      name="contact_name"
                                      value={quickCustomerForm.contact_name}
                                      onChange={handleQuickCustomerField}
                                      placeholder="Contact person"
                                    />
                                  </label>

                                  <label>
                                    <span>Phone</span>
                                    <input
                                      type="text"
                                      name="phone"
                                      value={quickCustomerForm.phone}
                                      onChange={handleQuickCustomerField}
                                      placeholder="Phone number"
                                    />
                                  </label>

                                  <label>
                                    <span>Email</span>
                                    <input
                                      type="email"
                                      name="email"
                                      value={quickCustomerForm.email}
                                      onChange={handleQuickCustomerField}
                                      placeholder="Email address"
                                    />
                                  </label>
                                </div>

                                {quickCustomerError && (
                                  <div className="quick-customer-error">
                                    {quickCustomerError}
                                  </div>
                                )}

                                {quickCustomerDuplicate && (
                                  <div className="quick-customer-duplicate">
                                    <strong>
                                      Possible duplicate customer found
                                    </strong>

                                    <span>
                                      {
                                        quickCustomerDuplicate.company_name
                                        || quickCustomerDuplicate.contact_name
                                        || `Customer #${quickCustomerDuplicate.id}`
                                      }
                                    </span>

                                    <small>
                                      {
                                        quickCustomerDuplicate.duplicate_reason
                                      }
                                      {quickCustomerDuplicate.email
                                        ? ` · ${quickCustomerDuplicate.email}`
                                        : ""
                                      }
                                      {quickCustomerDuplicate.phone
                                        ? ` · ${quickCustomerDuplicate.phone}`
                                        : ""
                                      }
                                    </small>

                                    <div className="quick-customer-duplicate-actions">
                                      <button
                                        type="button"
                                        className="quick-customer-use-existing"
                                        disabled={quickCustomerSaving}
                                        onClick={() =>
                                          selectCustomer(
                                            quickCustomerDuplicate
                                          )
                                        }
                                      >
                                        Use Existing
                                      </button>

                                      <button
                                        type="button"
                                        className="quick-customer-create-anyway"
                                        disabled={quickCustomerSaving}
                                        onClick={() =>
                                          saveQuickCustomer(
                                            true
                                          )
                                        }
                                      >
                                        Create Anyway
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div className="quick-customer-actions">
                                  <button
                                    type="button"
                                    className="quick-customer-cancel"
                                    disabled={quickCustomerSaving}
                                    onClick={() => {
                                      setShowQuickCustomer(false);
                                      setQuickCustomerError("");
                                      setQuickCustomerDuplicate(null);
                                    }}
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    className="quick-customer-save"
                                    disabled={quickCustomerSaving}
                                    onClick={saveQuickCustomer}
                                  >
                                    {
                                      quickCustomerSaving
                                        ? "Saving..."
                                        : "Save & Select Customer"
                                    }
                                  </button>
                                </div>

                              </div>

                            )
                          }

                        </div>

                      )
                    }


                    <label>

                      <span>
                        Location
                      </span>

                      <select
                        name="location"
                        value={
                          form.location
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      >

                        <option value="">
                          No location
                        </option>

                        {
                          customerLocations.map(
                            (item) => (

                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {
                                  item.location_name
                                }
                              </option>

                            )
                          )
                        }

                      </select>

                    </label>


                    {
                      !editingTicket
                      &&
                      !viewOnly
                      &&
                      !isTechnician
                      &&
                      canCreate
                      &&
                      form.customer
                      && (

                        <div className="quick-location-inline">

                          <button
                            type="button"
                            className="quick-location-toggle"
                            onClick={openQuickLocation}
                          >
                            <Plus size={14} />
                            Create New Location / Site
                          </button>

                          {
                            showQuickLocation
                            && (

                              <div className="quick-location-card">

                                <div className="quick-location-head">
                                  <div>
                                    <strong>New Location / Site</strong>
                                    <small>
                                      Save and use this location without leaving the ticket.
                                    </small>
                                  </div>

                                  <button
                                    type="button"
                                    className="quick-location-close"
                                    onClick={() => {
                                      setShowQuickLocation(false);
                                      setQuickLocationError("");
                                    }}
                                    aria-label="Close quick location form"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>

                                <div className="quick-location-grid">
                                  <label>
                                    <span>Location Name</span>
                                    <input
                                      name="location_name"
                                      value={quickLocationForm.location_name}
                                      onChange={handleQuickLocationField}
                                      placeholder="Main Office"
                                    />
                                  </label>

                                  <label>
                                    <span>Address Line 1</span>
                                    <input
                                      name="address_line1"
                                      value={quickLocationForm.address_line1}
                                      onChange={handleQuickLocationField}
                                      placeholder="Street address"
                                    />
                                  </label>

                                  <label>
                                    <span>Address Line 2</span>
                                    <input
                                      name="address_line2"
                                      value={quickLocationForm.address_line2}
                                      onChange={handleQuickLocationField}
                                      placeholder="Suite, unit, building"
                                    />
                                  </label>

                                  <label>
                                    <span>City</span>
                                    <input
                                      name="city"
                                      value={quickLocationForm.city}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>

                                  <label>
                                    <span>State / Province</span>
                                    <input
                                      name="state_province"
                                      value={quickLocationForm.state_province}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>

                                  <label>
                                    <span>ZIP / Postal Code</span>
                                    <input
                                      name="postal_code"
                                      value={quickLocationForm.postal_code}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>

                                  <label>
                                    <span>Country</span>
                                    <input
                                      name="country"
                                      value={quickLocationForm.country}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>

                                  <label>
                                    <span>Contact Name</span>
                                    <input
                                      name="contact_name"
                                      value={quickLocationForm.contact_name}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>

                                  <label>
                                    <span>Email</span>
                                    <input
                                      type="email"
                                      name="contact_email"
                                      value={quickLocationForm.contact_email}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>

                                  <label>
                                    <span>Phone</span>
                                    <input
                                      name="phone"
                                      value={quickLocationForm.phone}
                                      onChange={handleQuickLocationField}
                                    />
                                  </label>
                                </div>

                                {quickLocationError && (
                                  <div className="quick-location-error">
                                    {quickLocationError}
                                  </div>
                                )}

                                <div className="quick-location-actions">
                                  <button
                                    type="button"
                                    className="quick-location-cancel"
                                    disabled={quickLocationSaving}
                                    onClick={() => {
                                      setShowQuickLocation(false);
                                      setQuickLocationError("");
                                    }}
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    className="quick-location-save"
                                    disabled={quickLocationSaving}
                                    onClick={saveQuickLocation}
                                  >
                                    {
                                      quickLocationSaving
                                        ? "Saving..."
                                        : "Save & Select Location"
                                    }
                                  </button>
                                </div>

                              </div>

                            )
                          }

                        </div>

                      )
                    }


                    <label>

                      <span>
                        Equipment
                      </span>

                      <select
                        name="equipment"
                        value={
                          form.equipment
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      >

                        <option value="">
                          No equipment
                        </option>

                        {
                          locationEquipment.map(
                            (item) => (

                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {
                                  item.asset_tag
                                    ? `${item.asset_tag} — ${item.equipment_name || item.serial_number || `Equipment #${item.id}`}`
                                    : item.equipment_name || item.serial_number || `Equipment #${item.id}`
                                }
                              </option>

                            )
                          )
                        }

                      </select>

                    </label>


                    {
                      !editingTicket
                      && !viewOnly
                      && !isTechnician
                      && canCreate
                      && canManageEquipment
                      && (

                        <div className="quick-equipment-inline">

                          <button
                            type="button"
                            className="quick-equipment-toggle"
                            disabled={!form.location}
                            title={
                              form.location
                                ? "Create equipment for the selected location"
                                : "Select or create a location first"
                            }
                            onClick={
                              openQuickEquipment
                            }
                          >
                            <Plus size={14} />
                            Create New Equipment
                          </button>

                          {!form.location && (
                            <small className="quick-equipment-requirement">
                              Select or create a location first.
                            </small>
                          )}

                          {
                            showQuickEquipment
                            && form.location
                            && (

                              <div className="quick-equipment-card">

                                <div className="quick-equipment-head">
                                  <div>
                                    <strong>New Equipment</strong>
                                    <small>
                                      Save and select this equipment without leaving the ticket.
                                    </small>
                                  </div>

                                  <button
                                    type="button"
                                    className="quick-equipment-close"
                                    onClick={() => {
                                      setShowQuickEquipment(false);
                                      setQuickEquipmentError("");
                                    }}
                                    aria-label="Close quick equipment form"
                                  >
                                    <X size={15} />
                                  </button>
                                </div>

                                <div className="quick-equipment-grid">
                                  <label>
                                    <span>Equipment Name</span>
                                    <input
                                      name="equipment_name"
                                      value={quickEquipmentForm.equipment_name}
                                      onChange={handleQuickEquipmentField}
                                      placeholder="Example: Polycom VVX411"
                                    />
                                  </label>

                                  <label>
                                    <span>Equipment Type</span>
                                    <input
                                      name="equipment_type"
                                      value={quickEquipmentForm.equipment_type}
                                      onChange={handleQuickEquipmentField}
                                      placeholder="Phone, Router, PC..."
                                    />
                                  </label>

                                  <label>
                                    <span>Manufacturer</span>
                                    <input
                                      name="manufacturer"
                                      value={quickEquipmentForm.manufacturer}
                                      onChange={handleQuickEquipmentField}
                                    />
                                  </label>

                                  <label>
                                    <span>Model Number</span>
                                    <input
                                      name="model_number"
                                      value={quickEquipmentForm.model_number}
                                      onChange={handleQuickEquipmentField}
                                    />
                                  </label>

                                  <label>
                                    <span>Serial Number / MAC</span>
                                    <input
                                      name="serial_number"
                                      value={quickEquipmentForm.serial_number}
                                      onChange={handleQuickEquipmentField}
                                      placeholder="64:16:7F:93:34:27"
                                    />
                                  </label>

                                  <label>
                                    <span>Asset Tag</span>
                                    <input
                                      name="asset_tag"
                                      value={quickEquipmentForm.asset_tag}
                                      onChange={handleQuickEquipmentField}
                                      placeholder="Auto-generated"
                                    />
                                    <small className="quick-equipment-field-note">
                                      Auto-generated by default, but still editable.
                                    </small>
                                  </label>

                                  <label>
                                    <span>Ownership</span>
                                    <select
                                      name="ownership_type"
                                      value={quickEquipmentForm.ownership_type}
                                      onChange={handleQuickEquipmentField}
                                    >
                                      <option value="owned">Customer Owned</option>
                                      <option value="leased">Leased Asset</option>
                                      <option value="rented">Rented</option>
                                    </select>
                                  </label>

                                  <label>
                                    <span>Status</span>
                                    <select
                                      name="status"
                                      value={quickEquipmentForm.status}
                                      onChange={handleQuickEquipmentField}
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                      <option value="out_of_service">Out of Service</option>
                                    </select>
                                  </label>

                                  <label className="quick-equipment-full">
                                    <span>Notes</span>
                                    <textarea
                                      name="notes"
                                      value={quickEquipmentForm.notes}
                                      onChange={handleQuickEquipmentField}
                                      placeholder="Optional notes"
                                    />
                                  </label>
                                </div>

                                {quickEquipmentError && (
                                  <div className="quick-equipment-error">
                                    {quickEquipmentError}
                                  </div>
                                )}

                                <div className="quick-equipment-actions">
                                  <button
                                    type="button"
                                    className="quick-equipment-cancel"
                                    disabled={quickEquipmentSaving}
                                    onClick={() => {
                                      setShowQuickEquipment(false);
                                      setQuickEquipmentError("");
                                    }}
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    className="quick-equipment-save"
                                    disabled={quickEquipmentSaving}
                                    onClick={saveQuickEquipment}
                                  >
                                    {
                                      quickEquipmentSaving
                                        ? "Saving..."
                                        : "Save & Select Equipment"
                                    }
                                  </button>
                                </div>

                              </div>

                            )
                          }

                        </div>

                      )
                    }


                    <label>

                      <span>
                        Category
                      </span>

                      <select
                        name="category"
                        value={
                          form.category
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      >

                        {
                          Object
                            .entries(
                              CATEGORY_LABELS
                            )
                            .map(
                              ([
                                key,
                                label,
                              ]) => (

                                <option
                                  key={
                                    key
                                  }
                                  value={
                                    key
                                  }
                                >
                                  {
                                    label
                                  }
                                </option>

                              )
                            )
                        }

                      </select>

                    </label>


                    <label className="full">

                      <span>
                        Subject
                      </span>

                      <input
                        name="subject"
                        className={fieldErrors.subject ? "ticket-field-invalid" : ""}
                        aria-invalid={Boolean(fieldErrors.subject)}
                        value={
                          form.subject
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      />

                    </label>


                    <label className="full">

                      <span>
                        Description / Issue to Repair or Install
                      </span>

                      <textarea
                        name="description"
                        rows="4"
                        className={fieldErrors.description ? "ticket-field-invalid" : ""}
                        aria-invalid={Boolean(fieldErrors.description)}
                        value={
                          form.description
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      />

                    </label>

                  </div>

                </div>


                <div className="ticket-form-section">

                  <h3>
                    Contact Details
                  </h3>


                  <div className="ticket-form-grid three">

                    <label>

                      <span>
                        Contact Name
                      </span>

                      <input
                        name="contact_name"
                        className={fieldErrors.contact_name ? "ticket-field-invalid" : ""}
                        aria-invalid={Boolean(fieldErrors.contact_name)}
                        value={
                          form.contact_name
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      />

                    </label>


                    <label>

                      <span>
                        Email
                      </span>

                      <input
                        type="email"
                        name="contact_email"
                        className={fieldErrors.contact_email ? "ticket-field-invalid" : ""}
                        aria-invalid={Boolean(fieldErrors.contact_email)}
                        value={
                          form.contact_email
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      />

                    </label>


                    <label>

                      <span>
                        Phone
                      </span>

                      <input
                        name="contact_phone"
                        className={fieldErrors.contact_phone ? "ticket-field-invalid" : ""}
                        aria-invalid={Boolean(fieldErrors.contact_phone)}
                        value={
                          form.contact_phone
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      />

                    </label>

                  </div>

                </div>


                <div className="ticket-form-section">

                  <h3>
                    Priority & Status
                  </h3>


                  <div className="ticket-form-grid three">

                    <label>

                      <span>
                        Priority
                      </span>

                      <select
                        name="priority"
                        value={
                          form.priority
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          isTechnician
                        }
                      >
                        <option value="low">
                          Low
                        </option>

                        <option value="medium">
                          Medium
                        </option>

                        <option value="high">
                          High
                        </option>
                      </select>

                    </label>


                    <label>

                      <span>
                        Status
                      </span>

                      <select
                        name="status"
                        value={
                          form.status
                        }
                        onChange={
                          handleField
                        }
                        disabled={
                          !canEdit
                        }
                      >
                        <option value="open">
                          Open
                        </option>

                        <option value="closed">
                          Closed
                        </option>
                      </select>

                    </label>


                    <label>

                      <span>
                        Due Date
                      </span>

                      <div className="ticket-due-date-field">
                        <input
                          type="text"
                          name="due_date"
                          className={fieldErrors.due_date ? "ticket-field-invalid" : ""}
                          aria-invalid={Boolean(fieldErrors.due_date)}
                          value={form.due_date}
                          placeholder="Choose Due Date"
                          readOnly
                          onClick={openDueDateAvailabilityCalendar}
                          disabled={isTechnician}
                        />

                        {canAssign && !isTechnician && (
                          <button
                            type="button"
                            className="ticket-due-date-calendar-button"
                            onClick={openDueDateAvailabilityCalendar}
                            aria-label="Open Due Date technician availability calendar"
                            title="View technician availability"
                          >
                            <CalendarDays size={17} />
                          </button>
                        )}
                      </div>

                      {canAssign && !isTechnician && (
                        <small className="ticket-due-date-help">
                          Click the Due Date to view technician availability for every day.
                        </small>
                      )}

                    </label>

                  </div>

                </div>


                {canAssign && (

                  <div className="ticket-form-section">

                    <h3>
                      Technician Assignment & Calendar
                    </h3>


                    <div className={`technician-picker ${fieldErrors.technicians ? "ticket-picker-invalid" : ""}`}>

                      {
                        technicians.map(
                          (technician) => {
                            const technicianId = String(technician.id);
                            const selected = form.technicians.includes(technicianId);
                            const availability = technicianAvailability[technicianId];
                            const unavailable = availability?.available === false;

                            return (
                              <label
                                key={technician.id}
                                className={`${selected ? "selected" : ""} ${unavailable ? "unavailable" : ""}`}
                                title={availability?.reason || ""}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  disabled={unavailable && !selected}
                                  onChange={() => toggleTechnician(technician.id)}
                                />

                                <span>
                                  <strong>
                                    {technician.full_name || technician.employee_id}
                                  </strong>

                                  <small>
                                    {technician.employee_id}
                                    {" • "}
                                    {availabilityLoading
                                      ? "Checking..."
                                      : availability?.reason
                                        || (technician.status === "on_leave"
                                          ? "On Leave"
                                          : technician.status === "inactive"
                                            ? "Inactive"
                                            : form.service_date
                                              ? "Checking availability"
                                              : "Active")}
                                  </small>
                                </span>
                              </label>
                            );
                          }
                        )
                      }

                    </div>

                    <div className="technician-availability-summary">
                      {availabilityLoading && (
                        <span className="availability-checking">Checking current availability...</span>
                      )}

                      {!availabilityLoading && availabilityError && (
                        <span className="availability-warning">{availabilityError}</span>
                      )}

                      {!availabilityLoading && !availabilityError && form.service_date && (
                        <span className="availability-ok">Availability is up to date for the selected schedule.</span>
                      )}
                    </div>

                    <div className="ticket-form-grid three schedule-grid">

                      <label>

                        <span>
                          Appointment / Service Date
                        </span>

                        <input
                          type="date"
                          name="service_date"
                          className={fieldErrors.service_date ? "ticket-field-invalid" : ""}
                          aria-invalid={Boolean(fieldErrors.service_date)}
                          value={
                            form.service_date
                          }
                          min={scheduleDateMin}
                          max={form.due_date || undefined}
                          onChange={
                            handleField
                          }
                        />

                      </label>


                      <label>

                        <span>
                          Start Time
                        </span>

                        <input
                          type="time"
                          name="start_time"
                          className={fieldErrors.start_time ? "ticket-field-invalid" : ""}
                          aria-invalid={Boolean(fieldErrors.start_time)}
                          value={
                            form.start_time
                          }
                          onChange={
                            handleField
                          }
                        />

                      </label>


                      <label>

                        <span>
                          End Time
                        </span>

                        <input
                          type="time"
                          name="end_time"
                          className={fieldErrors.end_time ? "ticket-field-invalid" : ""}
                          aria-invalid={Boolean(fieldErrors.end_time)}
                          value={
                            form.end_time
                          }
                          onChange={
                            handleField
                          }
                        />

                      </label>


                      <label>

                        <span>
                          Recurring Job
                        </span>

                        <select
                          name="recurrence_type"
                          className={fieldErrors.recurrence_type ? "ticket-field-invalid" : ""}
                          aria-invalid={Boolean(fieldErrors.recurrence_type)}
                          value={
                            form.recurrence_type
                          }
                          onChange={
                            handleField
                          }
                        >

                          <option value="none">
                            Does not repeat
                          </option>

                          <option value="monthly">
                            Monthly
                          </option>

                          <option value="quarterly">
                            Quarterly
                          </option>

                        </select>

                      </label>


                      {
                        form.recurrence_type
                          !== "none"
                        && (

                          <label>

                            <span>
                              Repeat Until
                            </span>

                            <input
                              type="date"
                              name="recurrence_end_date"
                              className={fieldErrors.recurrence_end_date ? "ticket-field-invalid" : ""}
                              aria-invalid={Boolean(fieldErrors.recurrence_end_date)}
                              value={
                                form.recurrence_end_date
                              }
                              min={form.service_date || scheduleDateMin}
                              onChange={
                                handleField
                              }
                            />

                          </label>

                        )
                      }

                    </div>


                    <p className="form-help">
                      Past service dates are blocked. If a Due Date is set, the service date cannot be later than it. A booking with no start/end time is treated as all day. Conflicting technician bookings are rejected by the server even if two users save at the same time.
                    </p>

                  </div>

                )}


                {(canEdit || viewOnly) && (

                  <div className="ticket-form-section">

                    <h3>
                      Work Ticket
                    </h3>


                    <div className="ticket-form-grid">

                      <label className="full">

                        <span>
                          Work Performed / Resolution
                        </span>

                        <textarea
                          name="work_performed"
                          rows="4"
                          value={
                            form.work_performed
                          }
                          onChange={
                            handleField
                          }
                          disabled={
                            isTechnician
                          }
                        />

                      </label>


                      <label className="full">

                        <span>
                          Time On Site
                        </span>

                        <textarea
                          name="time_on_site"
                          rows="3"
                          value={
                            form.time_on_site
                          }
                          onChange={
                            handleField
                          }
                          placeholder="Example: 8:15 AM - 10:45 AM"
                          disabled={
                            isTechnician
                          }
                        />

                      </label>


                      <label className="full">

                        <span>
                          Equipment / Materials Used & Quantity
                        </span>

                        <textarea
                          name="equipment_materials_used"
                          rows="3"
                          value={
                            form.equipment_materials_used
                          }
                          onChange={
                            handleField
                          }
                          disabled={
                            isTechnician
                          }
                        />

                      </label>


                      <label className="full">

                        <span>
                          Internal Notes
                        </span>

                        <textarea
                          name="notes"
                          rows="3"
                          value={
                            form.notes
                          }
                          onChange={
                            handleField
                          }
                        />

                      </label>

                    </div>

                  </div>

                )}

              </fieldset>


              <div className="ticket-form-section attachment-section">

                <h3>

                  <Paperclip
                    size={17}
                  />

                  Attachments / Photos

                </h3>


                {
                  editingTicket
                    ?.attachments
                    ?.filter(
                      (attachment) =>
                        attachment
                          .attachment_type
                        !==
                        "completed_work_ticket"
                    )
                    ?.length
                    ? (

                      <div className="attachment-list">

                        {
                          editingTicket
                            .attachments
                            .filter(
                              (attachment) =>
                                attachment
                                  .attachment_type
                                !==
                                "completed_work_ticket"
                            )
                            .map(
                              (
                                attachment
                              ) => (

                                <a
                                  key={
                                    attachment.id
                                  }
                                  href={
                                    attachment.file_url
                                    || "#"
                                  }
                                  onClick={(event) => {
                                    event.preventDefault();

                                    downloadAttachment(
                                      attachment
                                    );
                                  }}
                                  title="Download attachment"
                                >

                                  <FileText
                                    size={15}
                                  />

                                  {
                                    attachment.original_name
                                  }

                                </a>

                              )
                            )
                        }

                      </div>

                    )
                    : (

                      <p className="muted">
                        No uploaded files.
                      </p>

                    )
                }


                {
                  !viewOnly
                  &&
                  !isTechnician
                  &&
                  (
                    canEdit
                    ||
                    (
                      !editingTicket
                      &&
                      canCreate
                    )
                  )
                  && (

                    <label className="attachment-upload">

                      <Upload
                        size={16}
                      />

                      Choose files

                      <input
                        type="file"
                        multiple
                        onChange={(event) =>
                          setPendingFiles(
                            Array.from(
                              event.target
                                .files
                              || []
                            )
                          )
                        }
                      />

                    </label>

                  )
                }


                {
                  pendingFiles.length > 0
                  && (

                    <small>
                      {
                        pendingFiles.length
                      }
                      {" "}
                      file(s) ready to upload
                    </small>

                  )
                }

              </div>


              <div className="ticket-form-section completed-work-ticket-section">

                <h3>

                  <FileText
                    size={17}
                  />

                  Completed Work Ticket

                </h3>


                <p className="completed-work-ticket-help">
                  Upload a photo or PDF of the completed handwritten work ticket after the technician returns it to the office.
                </p>


                {
                  editingTicket
                    ?.attachments
                    ?.filter(
                      (attachment) =>
                        attachment
                          .attachment_type
                        ===
                        "completed_work_ticket"
                    )
                    ?.length
                    ? (

                      <div className="completed-work-ticket-list">

                        {
                          editingTicket
                            .attachments
                            .filter(
                              (attachment) =>
                                attachment
                                  .attachment_type
                                ===
                                "completed_work_ticket"
                            )
                            .map(
                              (
                                attachment
                              ) => (

                                <button
                                  key={
                                    attachment.id
                                  }
                                  type="button"
                                  className="completed-work-ticket-file"
                                  onClick={() =>
                                    downloadAttachment(
                                      attachment
                                    )
                                  }
                                  title="Download completed work ticket"
                                >

                                  <FileText
                                    size={17}
                                  />

                                  <span>
                                    {
                                      attachment
                                        .original_name
                                    }
                                  </span>

                                </button>

                              )
                            )
                        }

                      </div>

                    )
                    : (

                      <div className="completed-work-ticket-empty">
                        No completed work ticket uploaded yet.
                      </div>

                    )
                }


                {
                  editingTicket
                  &&
                  !viewOnly
                  &&
                  !isTechnician
                  &&
                  canEdit
                  && (

                    <label
                      className={`completed-work-ticket-upload ${
                        completedWorkTicketUploading
                          ? "is-uploading"
                          : ""
                      }`}
                    >

                      <Upload
                        size={16}
                      />

                      {
                        completedWorkTicketUploading
                          ? "Uploading..."
                          : "Upload Completed Work Ticket"
                      }

                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        disabled={
                          completedWorkTicketUploading
                        }
                        onChange={(event) => {
                          const files =
                            Array.from(
                              event.target
                                .files
                              || []
                            );

                          event.target.value = "";

                          uploadCompletedWorkTickets(
                            files
                          );
                        }}
                      />

                    </label>

                  )
                }


                {
                  !editingTicket
                  &&
                  !viewOnly
                  && (

                    <small className="completed-work-ticket-note">
                      Create the ticket first. The completed work ticket can be uploaded when the job record is opened again.
                    </small>

                  )
                }


                <small className="completed-work-ticket-note">
                  Accepted: images or PDF, up to 4 MB per file.
                </small>

              </div>


              <div className="ticket-modal-actions">

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                >
                  Close
                </button>


                {!viewOnly && (

                  <button
                    type="submit"
                    className="ticket-primary"
                    disabled={
                      saving
                    }
                  >

                    {
                      saving
                        ? "Saving..."
                        : editingTicket
                          ? "Save Changes"
                          : "Create Ticket"
                    }

                  </button>

                )}

              </div>

            </form>

          </div>

        </div>

      )}


      {dueDatePickerOpen && (

        <div
          className="ticket-due-calendar-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDueDatePickerOpen(false);
            }
          }}
        >

          <div
            className="ticket-due-calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-due-calendar-title"
          >

            <div className="ticket-due-calendar-header">
              <div>
                <span className="eyebrow">Due Date</span>
                <h2 id="ticket-due-calendar-title">
                  Technician Availability Calendar
                </h2>
                <p>
                  Check who is free, partially booked, or fully booked before choosing a Due Date.
                </p>
              </div>

              <button
                type="button"
                className="ticket-due-calendar-close"
                onClick={() => setDueDatePickerOpen(false)}
                aria-label="Close Due Date calendar"
              >
                <X size={19} />
              </button>
            </div>

            <div className="ticket-due-calendar-toolbar">
              <strong>
                {dueDateCalendarDate.toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </strong>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const first = new Date(now.getFullYear(), now.getMonth(), 1);
                    setDueDateCalendarDate(first);
                    setDueDatePreviewKey(localDateKey(now));
                  }}
                >
                  Today
                </button>

                <button
                  type="button"
                  onClick={() => changeDueDateCalendarMonth(-1)}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => changeDueDateCalendarMonth(1)}
                  aria-label="Next month"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <div className="ticket-due-calendar-body">
              <div className="ticket-due-calendar-main">

                <div className="ticket-due-calendar-weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="ticket-due-calendar-grid">
                  {dueDateCalendarCells.map((cell) => {
                    const dayAvailability = cell.currentMonth
                      ? getTechnicianDayAvailability(cell.key)
                      : [];
                    const availableCount = dayAvailability.filter(
                      (item) => item.state === "available"
                    ).length;
                    const partialCount = dayAvailability.filter(
                      (item) => item.state === "partial"
                    ).length;
                    const bookedCount = dayAvailability.filter(
                      (item) => item.state === "booked"
                    ).length;
                    const unavailableCount = dayAvailability.filter(
                      (item) => item.state === "unavailable"
                    ).length;
                    const selected = dueDatePreviewKey === cell.key;
                    const today = cell.key === localDateKey(new Date());

                    return (
                      <button
                        type="button"
                        key={cell.key}
                        className={`ticket-due-calendar-day ${
                          cell.currentMonth ? "" : "outside"
                        } ${selected ? "selected" : ""} ${today ? "today" : ""}`}
                        onClick={() => {
                          if (cell.currentMonth) {
                            setDueDatePreviewKey(cell.key);
                          }
                        }}
                        disabled={!cell.currentMonth}
                      >
                        <span className="ticket-due-calendar-day-number">
                          {cell.date.getDate()}
                        </span>

                        {cell.currentMonth && !dueDateCalendarLoading && (
                          <div className="ticket-due-calendar-day-statuses">
                            {availableCount > 0 && (
                              <span className="available">
                                {availableCount} available
                              </span>
                            )}
                            {partialCount > 0 && (
                              <span className="partial">
                                {partialCount} partial
                              </span>
                            )}
                            {bookedCount > 0 && (
                              <span className="booked">
                                {bookedCount} booked
                              </span>
                            )}
                            {unavailableCount > 0 && (
                              <span className="unavailable">
                                {unavailableCount} unavailable
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {dueDateCalendarLoading && (
                  <div className="ticket-due-calendar-loading">
                    Loading technician availability...
                  </div>
                )}

                {dueDateCalendarError && (
                  <div className="ticket-due-calendar-error">
                    {dueDateCalendarError}
                  </div>
                )}

                <div className="ticket-due-calendar-legend">
                  <span className="available">Available all day</span>
                  <span className="partial">Partially booked</span>
                  <span className="booked">Booked all day</span>
                  <span className="unavailable">On Leave / Inactive</span>
                </div>
              </div>

              <aside className="ticket-due-calendar-details">
                <div>
                  <span className="eyebrow">Selected Day</span>
                  <h3>{dueDatePreviewKey || "Choose a date"}</h3>
                  <p>
                    Timed bookings are still available outside their booked hours.
                  </p>
                </div>

                <div className="ticket-due-calendar-tech-list">
                  {dueDatePreviewAvailability.map((item) => (
                    <div
                      key={item.technician.id}
                      className={`ticket-due-calendar-tech ${item.state}`}
                    >
                      <div>
                        <strong>
                          {item.technician.full_name || item.technician.employee_id}
                        </strong>
                        <span>{item.technician.employee_id}</span>
                      </div>
                      <small>{item.label}</small>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="ticket-primary ticket-due-calendar-use"
                  onClick={selectDueDateFromCalendar}
                  disabled={!dueDatePreviewKey}
                >
                  Use This Due Date
                </button>
              </aside>
            </div>

          </div>

        </div>

      )}


      {errorModal && (

        <div
          className="ticket-error-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeErrorModalAndFocusField();
            }
          }}
        >

          <div
            className="ticket-error-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ticket-error-modal-title"
          >

            <div className="ticket-error-modal-icon">
              <CircleAlert size={30} />
            </div>

            <span className="ticket-error-modal-section">
              Error in: {errorModal.section}
            </span>

            <h2 id="ticket-error-modal-title">
              Please correct this part
            </h2>

            <p className="ticket-error-modal-message">
              {errorModal.message}
            </p>

            <button
              type="button"
              className="ticket-error-modal-button"
              onClick={closeErrorModalAndFocusField}
              autoFocus
            >
              OK
            </button>

          </div>

        </div>

      )}


      {deleteTicket && (
        <div className="ticket-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleteLoading) setDeleteTicket(null); }}>
          <div className="ticket-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-ticket-title">
            <div className="ticket-delete-top">
              <div className="ticket-delete-icon"><Trash2 size={24} /></div>
              <button type="button" className="ticket-delete-close" onClick={() => setDeleteTicket(null)} disabled={deleteLoading} aria-label="Close delete confirmation"><X size={19} /></button>
            </div>
            <div className="ticket-delete-content">
              <div className="ticket-delete-eyebrow">Permanent action</div>
              <h2 id="delete-ticket-title">Delete ticket?</h2>
              <p>You’re about to permanently delete this ticket and its attachments. This action cannot be undone.</p>
              <div className="ticket-delete-record">
                <span>TICKET</span>
                <strong>{deleteTicket.ticket_number || `#${deleteTicket.id}`}</strong>
                <small>{deleteTicket.customer_name || deleteTicket.customer_display || "Selected ticket"}</small>
              </div>
            </div>
            <div className="ticket-delete-actions">
              <button type="button" className="ticket-delete-cancel" onClick={() => setDeleteTicket(null)} disabled={deleteLoading}>Cancel</button>
              <button type="button" className="ticket-delete-confirm" onClick={confirmDelete} disabled={deleteLoading}><Trash2 size={16} />{deleteLoading ? "Deleting..." : "Delete Ticket"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Tickets;