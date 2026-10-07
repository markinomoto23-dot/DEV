import { showSuccessToast } from "../components/SuccessToast";
import PageGuide from "../components/PageGuide";
﻿/* Changed PHP to US$ */

import { apiUrl } from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CreditCard,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  X,
} from "lucide-react";

import "./Billing.css";

import {
  formatDate,
} from "../utils/dateFormatter";



const DELETE_MODAL_CSS = `
.app-delete-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(3px);
}

.app-delete-modal {
  width: 100%;
  max-width: 520px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
  animation: appDeleteModalIn 0.18s ease-out;
}

@keyframes appDeleteModalIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.app-delete-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 28px 0;
}

.app-delete-icon {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #fff1f2;
  color: #dc2626;
}

.app-delete-close {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbe3ec;
  border-radius: 10px;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
}

.app-delete-close:hover:not(:disabled) {
  background: #f8fafc;
  color: #334155;
}

.app-delete-content {
  padding: 20px 28px 26px;
}

.app-delete-content h2 {
  margin: 0 0 10px;
  color: #172b3d;
  font-size: 23px;
  font-weight: 700;
}

.app-delete-content p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.65;
}

.app-delete-content p strong {
  color: #172b3d;
}

.app-delete-record {
  margin-top: 20px;
  padding: 15px 16px;
  display: grid;
  grid-template-columns: minmax(100px, auto) 1fr;
  gap: 4px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #f8fafc;
}

.app-delete-record > span {
  grid-row: 1 / 3;
  align-self: center;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.app-delete-record strong {
  color: #172b3d;
  font-size: 14px;
}

.app-delete-record small {
  color: #64748b;
  font-size: 13px;
}

.app-delete-error {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 9px;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 13px;
  line-height: 1.45;
}

.app-delete-actions {
  padding: 18px 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.app-delete-cancel,
.app-delete-confirm {
  min-height: 42px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.app-delete-cancel {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #334155;
}

.app-delete-confirm {
  border: 1px solid #dc2626;
  background: #dc2626;
  color: #ffffff;
}

.app-delete-cancel:hover:not(:disabled) {
  background: #f8fafc;
}

.app-delete-confirm:hover:not(:disabled) {
  border-color: #b91c1c;
  background: #b91c1c;
}

.app-delete-cancel:disabled,
.app-delete-confirm:disabled,
.app-delete-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .app-delete-overlay {
    padding: 16px;
  }

  .app-delete-top {
    padding: 22px 20px 0;
  }

  .app-delete-content {
    padding: 18px 20px 22px;
  }

  .app-delete-actions {
    padding: 16px 20px;
    flex-direction: column-reverse;
  }

  .app-delete-cancel,
  .app-delete-confirm {
    width: 100%;
  }

  .app-delete-record {
    grid-template-columns: 1fr;
  }

  .app-delete-record > span {
    grid-row: auto;
  }
}
`;

const BILLING_API =
  apiUrl("/api/billing/");

const TICKETS_API =
  apiUrl("/api/tickets/");

const TECHNICIANS_API =
  apiUrl("/api/technicians/");

function Billing() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [billings, setBillings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [viewMode, setViewMode] = useState("ticket");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);

  const emptyForm = {
    ticket: "",
    technician: "",
    labor_hours: "0",
    labor_rate: "0",
    parts_cost: "0",
    other_charges: "0",
    discount: "0",
    tax_rate: "0",
    paid_amount: "0",
    status: "unpaid",
    issued_date: "",
    due_date: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  // =========================================
  // AUTH
  // =========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const authHeaders = {
    Authorization: `Token ${token}`,
  };

  // =========================================
  // LOAD BILLING
  // =========================================

  const fetchBillings = async (
    searchValue = search
  ) => {
    try {
      setLoading(true);
      setError("");

      const url = searchValue.trim()
        ? `${BILLING_API}?search=${encodeURIComponent(
            searchValue.trim()
          )}`
        : BILLING_API;

      const response = await fetch(url, {
        headers: authHeaders,
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load billing records."
        );
      }

      const data = await response.json();

      setBillings(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      console.error(
        "Billing loading error:",
        error
      );

      setError(
        "Unable to load billing records."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD TICKETS
  // =========================================

  const fetchTickets = async () => {
    try {
      const response = await fetch(
        TICKETS_API,
        {
          headers: authHeaders,
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load tickets."
        );
      }

      const data = await response.json();

      setTickets(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      console.error(
        "Ticket loading error:",
        error
      );
    }
  };

  // =========================================
  // LOAD TECHNICIANS
  // =========================================

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(
        TECHNICIANS_API,
        {
          headers: authHeaders,
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load technicians."
        );
      }

      const data = await response.json();

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

    fetchBillings("");
    fetchTickets();
    fetchTechnicians();
  }, []);

  // =========================================
  // TODAY
  // =========================================

  const getToday = () => {
    const today = new Date();

    return today
      .toISOString()
      .slice(0, 10);
  };

  // =========================================
  // FILTERED BILLING
  // =========================================

  const visibleBillings = useMemo(() => {
    return billings.filter((billing) => {
      if (
        statusFilter &&
        billing.status !== statusFilter
      ) {
        return false;
      }

      return true;
    });
  }, [billings, statusFilter]);

  // =========================================
  // SUMMARY
  // =========================================

  const totals = useMemo(() => {
    return visibleBillings.reduce(
      (summary, billing) => {
        summary.total += Number(
          billing.total_amount || 0
        );

        summary.paid += Number(
          billing.paid_amount || 0
        );

        summary.balance += Number(
          billing.balance || 0
        );

        return summary;
      },
      {
        total: 0,
        paid: 0,
        balance: 0,
      }
    );
  }, [visibleBillings]);

  // =========================================
  // FORM PREVIEW CALCULATION
  // =========================================

  const calculations = useMemo(() => {
    const laborHours =
      Number(form.labor_hours) || 0;

    const laborRate =
      Number(form.labor_rate) || 0;

    const partsCost =
      Number(form.parts_cost) || 0;

    const otherCharges =
      Number(form.other_charges) || 0;

    const discount =
      Number(form.discount) || 0;

    const taxRate =
      Number(form.tax_rate) || 0;

    const paidAmount =
      Number(form.paid_amount) || 0;

    const laborTotal =
      laborHours * laborRate;

    const subtotal = Math.max(
      laborTotal +
        partsCost +
        otherCharges -
        discount,
      0
    );

    const taxAmount =
      subtotal * (taxRate / 100);

    const total =
      subtotal + taxAmount;

    const balance = Math.max(
      total - paidAmount,
      0
    );

    return {
      laborTotal,
      subtotal,
      taxAmount,
      total,
      balance,
    };
  }, [form]);

  // =========================================
  // FORMAT CURRENCY
  // =========================================

  const money = (amount) => {
    return Number(
      amount || 0
    ).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  // =========================================
  // CHANGE FIELD
  // =========================================

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================
  // TICKET SELECT
  // =========================================

  const handleTicketChange = (event) => {
    const ticketId =
      event.target.value;

    const selectedTicket =
      tickets.find(
        (ticket) =>
          String(ticket.id) ===
          String(ticketId)
      );

    if (!selectedTicket) {
      setForm((previous) => ({
        ...previous,
        ticket: ticketId,
        technician: "",
        labor_rate: "0",
      }));

      return;
    }

    const technician =
      technicians.find(
        (item) =>
          String(item.id) ===
          String(
            selectedTicket.technician
          )
      );

    setForm((previous) => ({
      ...previous,

      ticket: ticketId,

      technician:
        selectedTicket.technician
          ? String(
              selectedTicket.technician
            )
          : "",

      labor_rate:
        technician?.hourly_rate
          ? String(
              technician.hourly_rate
            )
          : "0",
    }));
  };

  // =========================================
  // TECHNICIAN SELECT
  // =========================================

  const handleTechnicianChange = (
    event
  ) => {
    const technicianId =
      event.target.value;

    const technician =
      technicians.find(
        (item) =>
          String(item.id) ===
          String(technicianId)
      );

    setForm((previous) => ({
      ...previous,

      technician:
        technicianId,

      labor_rate:
        technician?.hourly_rate
          ? String(
              technician.hourly_rate
            )
          : previous.labor_rate,
    }));
  };

  // =========================================
  // ADD
  // =========================================

  const openAddModal = () => {
    setEditingBilling(null);

    setForm({
      ...emptyForm,
      issued_date: getToday(),
    });

    setError("");
    setShowModal(true);
  };

  // =========================================
  // EDIT
  // =========================================

  const openEditModal = (billing) => {
    setEditingBilling(billing);

    setForm({
      ticket:
        billing.ticket || "",

      technician:
        billing.technician || "",

      labor_hours:
        billing.labor_hours || "0",

      labor_rate:
        billing.labor_rate || "0",

      parts_cost:
        billing.parts_cost || "0",

      other_charges:
        billing.other_charges || "0",

      discount:
        billing.discount || "0",

      tax_rate:
        billing.tax_rate || "0",

      paid_amount:
        billing.paid_amount || "0",

      status:
        billing.status || "unpaid",

      issued_date:
        billing.issued_date || "",

      due_date:
        billing.due_date || "",

      notes:
        billing.notes || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBilling(null);
    setForm(emptyForm);
    setError("");
  };

  // =========================================
  // SAVE
  // =========================================

  const handleSave = async (event) => {
    event.preventDefault();


    const editing =
      Boolean(editingBilling);

    const url = editing
      ? `${BILLING_API}${editingBilling.id}/`
      : BILLING_API;

    const payload = {
      ticket:
        form.ticket
          ? Number(form.ticket)
          : null,

      technician:
        form.technician
          ? Number(form.technician)
          : null,

      labor_hours:
        Number(
          form.labor_hours
        ) || 0,

      labor_rate:
        Number(
          form.labor_rate
        ) || 0,

      parts_cost:
        Number(
          form.parts_cost
        ) || 0,

      other_charges:
        Number(
          form.other_charges
        ) || 0,

      discount:
        Number(
          form.discount
        ) || 0,

      tax_rate:
        Number(
          form.tax_rate
        ) || 0,

      paid_amount:
        Number(
          form.paid_amount
        ) || 0,

      status:
        form.status,

      issued_date:
        form.issued_date ||
        getToday(),

      due_date:
        form.due_date || null,

      notes:
        form.notes,
    };

    try {
      setError("");

      const response = await fetch(
        url,
        {
          method:
            editing
              ? "PUT"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Token ${token}`,
          },

          body:
            JSON.stringify(payload),
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const data =
          await response.json();

        console.error(
          "Billing save error:",
          data
        );

        const firstError =
          Object.values(data)?.[0];

        if (
          Array.isArray(firstError)
        ) {
          setError(firstError[0]);

        } else if (
          typeof firstError ===
          "string"
        ) {
          setError(firstError);

        } else {
          setError(
            "Unable to save invoice. Please check the entered information."
          );
        }

        return;
      }

      showSuccessToast(editingBilling ? "Invoice Updated" : "Invoice Created", editingBilling ? "Invoice information was successfully saved." : "New invoice was successfully added.");

      closeModal();

      fetchBillings(search);

    } catch (error) {
      console.error(error);

      setError(
        "Unable to connect to the DEV server."
      );
    }
  };

  // =========================================
  // DELETE
  // =========================================

  const openDeleteModal = (billing) => {
    setDeleteTarget(billing);
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");

      const response = await fetch(
        `${BILLING_API}${deleteTarget.id}/`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      if (response.status === 401) {
        setDeleteTarget(null);
        logout();
        return;
      }

      if (!response.ok) {
        let message = "Unable to delete invoice.";

        try {
          const data = await response.json();
          message =
            data.detail ||
            data.message ||
            message;
        } catch {
          // Keep fallback message.
        }

        setDeleteError(message);
        return;
      }

      showSuccessToast("Invoice Deleted", "The invoice was successfully deleted.");
      setDeleteTarget(null);
      setDeleteError("");
      fetchBillings(search);
    } catch (error) {
      console.error("Delete invoice error:", error);
      setDeleteError(
        "Unable to connect to the server."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // =========================================
  // SEARCH
  // =========================================

  const handleSearch = (event) => {
    event.preventDefault();

    fetchBillings(search);
  };

  const clearSearch = () => {
    setSearch("");

    fetchBillings("");
  };

  // =========================================
  // STATUS
  // =========================================

  const statusLabel = (
    status
  ) => {
    const labels = {
      unpaid: "Unpaid",
      partial: "Partial",
      paid: "Paid",
      void: "Void",
    };

    return (
      labels[status] || status
    );
  };

  return (
    <div className="billing-page">
      <style>{DELETE_MODAL_CSS}</style>

      {/* HEADER */}

      <div className="billing-header">

        <div>

          <button
            type="button"
            className="billing-back"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <h1>
            Billing<PageGuide title="Billing" text="Manage invoices, billed amounts, payments, outstanding balances, and billing activity. Amounts are displayed in USD." />
          </h1>

          <p>
            Manage invoices, labor,
            service charges, payments,
            and outstanding balances.
          </p>

        </div>

        <button
          type="button"
          className="billing-add"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Invoice
        </button>

      </div>

      {/* SUMMARY */}

      <div className="billing-summary">

        <div className="billing-summary-card">

          <span>
            Total Billed
          </span>

          <strong>
            {money(totals.total)}
          </strong>

          <p>
            Invoice total
          </p>

        </div>

        <div className="billing-summary-card">

          <span>
            Total Paid
          </span>

          <strong>
            {money(totals.paid)}
          </strong>

          <p>
            Received payments
          </p>

        </div>

        <div className="billing-summary-card">

          <span>
            Outstanding
          </span>

          <strong>
            {money(totals.balance)}
          </strong>

          <p>
            Remaining balance
          </p>

        </div>

        <div className="billing-summary-card">

          <span>
            Invoices
          </span>

          <strong>
            {visibleBillings.length}
          </strong>

          <p>
            Billing records
          </p>

        </div>

      </div>

      {/* MAIN CARD */}

      <div className="billing-card">

        {/* VIEW TOGGLE */}

        <div className="billing-view-toggle">

          <button
            type="button"
            className={
              viewMode === "ticket"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode("ticket")
            }
          >
            <FileText size={17} />

            By Ticket
          </button>

          <button
            type="button"
            className={
              viewMode ===
              "technician"
                ? "active"
                : ""
            }
            onClick={() =>
              setViewMode(
                "technician"
              )
            }
          >
            <UserCog size={17} />

            By Technician
          </button>

        </div>

        {/* TOOLBAR */}

        <div className="billing-toolbar">

          <form
            className="billing-search"
            onSubmit={handleSearch}
          >

            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={
                viewMode === "ticket"
                  ? "Search invoice, ticket, customer..."
                  : "Search technician..."
              }
            />

            {search && (
              <button
                type="button"
                className="billing-search-clear"
                onClick={clearSearch}
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              className="billing-search-button"
            >
              Search
            </button>

          </form>

          <select
            className="billing-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="">
              All Statuses
            </option>

            <option value="unpaid">
              Unpaid
            </option>

            <option value="partial">
              Partial
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="void">
              Void
            </option>

          </select>

        </div>

        {error && !showModal && (
          <div className="billing-error">
            {error}
          </div>
        )}

        {/* CONTENT */}

        {loading ? (

          <div className="billing-empty">

            <CreditCard size={46} />

            <h3>
              Loading invoices...
            </h3>

          </div>

        ) : visibleBillings.length === 0 ? (

          <div className="billing-empty">

            <CreditCard size={46} />

            <h3>
              No invoices found
            </h3>

            <p>
              Create your first invoice
              to get started.
            </p>

          </div>

        ) : (

          <div className="billing-table-wrapper">

            <table className="billing-table">

              <thead>

                {viewMode ===
                "ticket" ? (

                  <tr>
                    <th>Invoice #</th>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Technician</th>
                    <th>Labor</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>

                ) : (

                  <tr>
                    <th>Technician</th>
                    <th>Employee ID</th>
                    <th>Invoice #</th>
                    <th>Ticket</th>
                    <th>Customer</th>
                    <th>Labor Hours</th>
                    <th>Labor Total</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                )}

              </thead>

              <tbody>

                {visibleBillings.map(
                  (billing) => (

                    viewMode ===
                    "ticket" ? (

                      <tr
                        key={billing.id}
                      >

                        <td>
                          <strong className="billing-invoice">
                            {
                              billing.invoice_number
                            }
                          </strong>
                        </td>

                        <td>

                          <strong>
                            {
                              billing.ticket_number
                            }
                          </strong>

                          <small className="billing-secondary">
                            {
                              billing.ticket_subject
                            }
                          </small>

                        </td>

                        <td>
                          {
                            billing.customer_name ||
                            "â€”"
                          }
                        </td>

                        <td>

                          {billing.technician_name ? (

                            <div className="billing-tech">

                              <strong>
                                {
                                  billing.technician_name
                                }
                              </strong>

                              <small>
                                {
                                  billing.technician_employee_id
                                }
                              </small>

                            </div>

                          ) : (
                            "Unassigned"
                          )}

                        </td>

                        <td>
                          {money(
                            billing.labor_total
                          )}
                        </td>

                        <td>
                          <strong>
                            {money(
                              billing.total_amount
                            )}
                          </strong>
                        </td>

                        <td>
                          {money(
                            billing.paid_amount
                          )}
                        </td>

                        <td>
                          <strong>
                            {money(
                              billing.balance
                            )}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={`billing-status billing-status-${billing.status}`}
                          >
                            {statusLabel(
                              billing.status
                            )}
                          </span>

                        </td>

                        <td>
                          {formatDate(
                            billing.due_date
                          )}
                        </td>

                        <td>

                          <div className="billing-actions">

                            <button
                              type="button"
                              className="billing-edit"
                              onClick={() =>
                                openEditModal(
                                  billing
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="billing-delete"
                              onClick={() =>
                                openDeleteModal(billing)
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    ) : (

                      <tr
                        key={billing.id}
                      >

                        <td>
                          <strong>
                            {
                              billing.technician_name ||
                              "Unassigned"
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            billing.technician_employee_id ||
                            "â€”"
                          }
                        </td>

                        <td>
                          <strong className="billing-invoice">
                            {
                              billing.invoice_number
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            billing.ticket_number
                          }
                        </td>

                        <td>
                          {
                            billing.customer_name ||
                            "â€”"
                          }
                        </td>

                        <td>
                          {
                            billing.labor_hours
                          }
                        </td>

                        <td>
                          {money(
                            billing.labor_total
                          )}
                        </td>

                        <td>
                          <strong>
                            {money(
                              billing.total_amount
                            )}
                          </strong>
                        </td>

                        <td>

                          <span
                            className={`billing-status billing-status-${billing.status}`}
                          >
                            {statusLabel(
                              billing.status
                            )}
                          </span>

                        </td>

                        <td>

                          <div className="billing-actions">

                            <button
                              type="button"
                              className="billing-edit"
                              onClick={() =>
                                openEditModal(
                                  billing
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="billing-delete"
                              onClick={() =>
                                openDeleteModal(billing)
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>

                    )

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =====================================
          ADD / EDIT MODAL
      ====================================== */}

      {showModal && (

        <div className="billing-modal-overlay">

          <div className="billing-modal">

            <div className="billing-modal-header">

              <div>

                <h2>
                  {editingBilling
                    ? `Edit ${editingBilling.invoice_number}`
                    : "Add Invoice"}
                </h2>

                <p>
                  Create billing for a
                  service ticket.
                </p>

              </div>

              <button
                type="button"
                className="billing-modal-close"
                onClick={closeModal}
              >
                <X size={22} />
              </button>

            </div>

            {error && (
              <div className="billing-error">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSave}
            >

              <div className="billing-form-grid">

                {/* TICKET */}

                <div className="billing-field full">

                  <label>
                    Service Ticket
                  </label>

                  <select
                    name="ticket"
                    value={form.ticket}
                    onChange={
                      handleTicketChange
                    }
                  >

                    <option value="">
                      Select ticket
                    </option>

                    {tickets.map(
                      (ticket) => (

                        <option
                          key={
                            ticket.id
                          }
                          value={
                            ticket.id
                          }
                        >
                          {
                            ticket.ticket_number
                          }
                          {" | "}
                          {
                            ticket.customer_name
                          }
                          {" | "}
                          {
                            ticket.subject
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* TECHNICIAN */}

                <div className="billing-field">

                  <label>
                    Technician
                  </label>

                  <select
                    name="technician"
                    value={
                      form.technician
                    }
                    onChange={
                      handleTechnicianChange
                    }
                  >

                    <option value="">
                      Unassigned
                    </option>

                    {technicians.map(
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
                            technician.employee_id
                          }
                          {" | "}
                          {
                            technician.full_name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* LABOR HOURS */}

                <div className="billing-field">

                  <label>
                    Labor Hours
                  </label>

                  <input
                    type="number"
                    name="labor_hours"
                    min="0"
                    step="0.25"
                    value={
                      form.labor_hours
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* RATE */}

                <div className="billing-field">

                  <label>
                    Hourly Rate
                  </label>

                  <input
                    type="number"
                    name="labor_rate"
                    min="0"
                    step="0.01"
                    value={
                      form.labor_rate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* LABOR TOTAL */}

                <div className="billing-field">

                  <label>
                    Labor Total
                  </label>

                  <div className="billing-readonly">
                    {money(
                      calculations.laborTotal
                    )}
                  </div>

                </div>

                {/* PARTS */}

                <div className="billing-field">

                  <label>
                    Parts / Materials
                  </label>

                  <input
                    type="number"
                    name="parts_cost"
                    min="0"
                    step="0.01"
                    value={
                      form.parts_cost
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* OTHER */}

                <div className="billing-field">

                  <label>
                    Other Charges
                  </label>

                  <input
                    type="number"
                    name="other_charges"
                    min="0"
                    step="0.01"
                    value={
                      form.other_charges
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* DISCOUNT */}

                <div className="billing-field">

                  <label>
                    Discount
                  </label>

                  <input
                    type="number"
                    name="discount"
                    min="0"
                    step="0.01"
                    value={
                      form.discount
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* TAX */}

                <div className="billing-field">

                  <label>
                    Tax Rate %
                  </label>

                  <input
                    type="number"
                    name="tax_rate"
                    min="0"
                    step="0.01"
                    value={
                      form.tax_rate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* PAID */}

                <div className="billing-field">

                  <label>
                    Paid Amount
                  </label>

                  <input
                    type="number"
                    name="paid_amount"
                    min="0"
                    step="0.01"
                    value={
                      form.paid_amount
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* STATUS */}

                <div className="billing-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={
                      handleChange
                    }
                  >

                    <option value="unpaid">
                      Unpaid
                    </option>

                    <option value="partial">
                      Partial
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                    <option value="void">
                      Void
                    </option>

                  </select>

                </div>

                {/* ISSUE DATE */}

                <div className="billing-field">

                  <label>
                    Issue Date
                  </label>

                  <input
                    type="date"
                    name="issued_date"
                    value={
                      form.issued_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* DUE DATE */}

                <div className="billing-field">

                  <label>
                    Due Date
                  </label>

                  <input
                    type="date"
                    name="due_date"
                    value={
                      form.due_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                {/* NOTES */}

                <div className="billing-field full">

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
                    placeholder="Invoice notes, parts used, service details..."
                  />

                </div>

              </div>

              {/* LIVE TOTAL */}

              <div className="billing-calculation">

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {money(
                      calculations.subtotal
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Tax
                  </span>

                  <strong>
                    {money(
                      calculations.taxAmount
                    )}
                  </strong>
                </div>

                <div className="billing-calculation-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    {money(
                      calculations.total
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Balance
                  </span>

                  <strong>
                    {money(
                      calculations.balance
                    )}
                  </strong>

                </div>

              </div>

              <div className="billing-modal-actions">

                <button
                  type="button"
                  className="billing-cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="billing-save"
                >
                  {editingBilling
                    ? "Save Changes"
                    : "Create Invoice"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {deleteTarget && (
        <div
          className="app-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            className="app-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-invoice-title"
          >
            <div className="app-delete-top">
              <div className="app-delete-icon">
                <Trash2 size={24} />
              </div>

              <button
                type="button"
                className="app-delete-close"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                aria-label="Close delete confirmation"
              >
                <X size={20} />
              </button>
            </div>

            <div className="app-delete-content">
              <h2 id="delete-invoice-title">
                Delete invoice?
              </h2>

              <p>
                This will permanently delete{" "}
                <strong>
                  {deleteTarget.invoice_number ||
                    "this invoice"}
                </strong>
                . This action cannot be undone.
              </p>

              <div className="app-delete-record">
                <span>INVOICE</span>

                <strong>
                  {deleteTarget.invoice_number ||
                    "Invoice record"}
                </strong>

                <small>
                  {deleteTarget.customer_name ||
                    deleteTarget.ticket_number ||
                    "Billing record"}
                </small>
              </div>

              {deleteError && (
                <div className="app-delete-error">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="app-delete-actions">
              <button
                type="button"
                className="app-delete-cancel"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="app-delete-confirm"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                <Trash2 size={16} />
                {deleteLoading
                  ? "Deleting..."
                  : "Delete Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Billing;