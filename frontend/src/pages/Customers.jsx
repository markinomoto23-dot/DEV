import { showSuccessToast } from "../components/SuccessToast";
import PageGuide from "../components/PageGuide";
/*Made the Customer name clickabe/use hyperlink*/
/*Made the Customer Record Locations function like the one in the First Demo*/
/*Added Documents Functionality*/

import { apiUrl } from "../config/api";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  ArrowLeft,
  FolderOpen,
  Upload,
  AlertTriangle,
} from "lucide-react";

import "./Customers.css";


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

const API_URL = apiUrl("/api/customers/");
const PERMISSIONS_API = apiUrl("/api/access/me/permissions/");
const IMPORT_API = apiUrl("/api/customers/import-csv/");


function formatCustomerStatus(value) {
  switch (String(value || "").toLowerCase()) {
    case "credit_hold":
      return "Credit Hold";

    case "inactive":
      return "Inactive";

    case "active":
      return "Active";

    default:
      return value || "—";
  }
}



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



function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [canExport, setCanExport] = useState(false);
  const [canManageCustomers, setCanManageCustomers] = useState(true);
  const [canDeleteCustomers, setCanDeleteCustomers] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [
    duplicateWarning,
    setDuplicateWarning,
  ] = useState(null);
  const [
    customerSaving,
    setCustomerSaving,
  ] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState(null);

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    status: "active",
    notes: "",
    first_location_name: "",
    first_location_address_line1: "",
    first_location_address_line2: "",
    first_location_city: "",
    first_location_state_province: "",
    first_location_postal_code: "",
    first_location_country: "United States",
  });

  const token = localStorage.getItem("token");


  const fetchCustomers = async (
    searchValue = search
  ) => {
    try {
      setLoading(true);

      const cleanSearch =
        String(
          searchValue || ""
        ).trim();

      const url = cleanSearch
        ? `${API_URL}?search=${encodeURIComponent(cleanSearch)}`
        : API_URL;

      const response = await fetch(url, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      const data = await response.json();

      setCustomers(
        Array.isArray(data)
          ? data
          : data.results || []
      );
    } catch (error) {
      console.error(
        "Failed to load customers:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch(
          PERMISSIONS_API,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setCanExport(
            Boolean(
              data.actions?.can_export
            )
          );

          setCanManageCustomers(
            Boolean(
              data.actions?.can_manage_customers
            )
          );

          setCanDeleteCustomers(
            Boolean(
              data.actions?.can_delete_customers
            )
          );
        }
      } catch (error) {
        console.error(
          "Failed to load customer permissions:",
          error
        );
      }
    };

    fetchPermissions();
    fetchCustomers();
  }, []);


  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers();
  };


  const openAddModal = () => {
    setEditingCustomer(null);
    setDuplicateWarning(null);

    setForm({
      company_name: "",
      contact_name: "",
      email: "",
      phone: "",
      status: "active",
      notes: "",
      first_location_name: "",
      first_location_address_line1: "",
      first_location_address_line2: "",
      first_location_city: "",
      first_location_state_province: "",
      first_location_postal_code: "",
      first_location_country: "United States",
    });

    setShowModal(true);
  };


  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setDuplicateWarning(null);

    setForm({
      company_name:
        customer.company_name || "",

      contact_name:
        customer.contact_name || "",

      email:
        customer.email || "",

      phone:
        customer.phone || "",

      status:
        customer.status || "active",

      notes:
        customer.notes || "",

      first_location_name: "",
      first_location_address_line1: "",
      first_location_address_line2: "",
      first_location_city: "",
      first_location_state_province: "",
      first_location_postal_code: "",
      first_location_country: "",
    });

    setShowModal(true);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };



  const findPotentialCustomerDuplicate =
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
          await fetch(
            `${API_URL}?search=${encodeURIComponent(term)}`,
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
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          navigate("/login");

          return null;
        }

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
                  customer,
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


  const saveCustomerRecord = async (
    skipDuplicateCheck = false
  ) => {
    const editing = Boolean(
      editingCustomer
    );

    const url = editing
      ? `${API_URL}${editingCustomer.id}/`
      : API_URL;

    try {
      setCustomerSaving(true);

      if (
        !editing
        &&
        !skipDuplicateCheck
      ) {
        const possibleDuplicate =
          await findPotentialCustomerDuplicate(
            form
          );

        if (possibleDuplicate) {
          setDuplicateWarning(
            possibleDuplicate
          );

          return;
        }
      }

      const response = await fetch(
        url,
        {
          method:
            editing
              ? "PATCH"
              : "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Token ${token}`,
          },

          body:
            JSON.stringify(
              editing
                ? {
                    company_name:
                      form.company_name,
                    contact_name:
                      form.contact_name,
                    email:
                      form.email,
                    phone:
                      form.phone,
                    status:
                      form.status,
                    notes:
                      form.notes,
                  }
                : {
                    company_name:
                      form.company_name,
                    contact_name:
                      form.contact_name,
                    email:
                      form.email,
                    phone:
                      form.phone,
                    status:
                      form.status,
                    first_location_name:
                      form.first_location_name,
                    first_location_address_line1:
                      form.first_location_address_line1,
                    first_location_address_line2:
                      form.first_location_address_line2,
                    first_location_city:
                      form.first_location_city,
                    first_location_state_province:
                      form.first_location_state_province,
                    first_location_postal_code:
                      form.first_location_postal_code,
                    first_location_country:
                      form.first_location_country,
                  }
            ),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        console.error(
          errorData
        );

        const firstMessage =
          errorData.first_location_name?.[0]
          || errorData.first_location_address_line1?.[0]
          || errorData.first_location_address?.[0]
          || errorData.first_location_city?.[0]
          || errorData.first_location_state_province?.[0]
          || errorData.first_location_postal_code?.[0]
          || errorData.first_location_country?.[0]
          || errorData.company_name?.[0]
          || errorData.detail
          || "Unable to save customer.";

        alert(firstMessage);

        return;
      }

      setDuplicateWarning(null);
      showSuccessToast(editingCustomer ? "Customer Updated" : "Customer Created", editingCustomer ? "Customer information was successfully saved." : "New customer was successfully added.");

      setShowModal(false);

      fetchCustomers();
    } catch (error) {
      console.error(error);

      alert(
        "Unable to connect to the server."
      );
    } finally {
      setCustomerSaving(false);
    }
  };


  const handleSave = async (e) => {
    e.preventDefault();

    await saveCustomerRecord(
      false
    );
  };


  const createDuplicateAnyway =
    async () => {
      setDuplicateWarning(null);

      await saveCustomerRecord(
        true
      );
    };


  const closeDuplicateWarning =
    () => {
      if (customerSaving) {
        return;
      }

      setDuplicateWarning(null);
    };


  const openDeleteModal = (
    customer
  ) => {
    setDeleteTarget(customer);
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
        `${API_URL}${deleteTarget.id}/`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Token ${token}`,
          },
        }
      );

      if (response.status === 401) {
        setDeleteTarget(null);

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        navigate("/login");

        return;
      }

      if (!response.ok) {
        let message =
          "Unable to delete customer.";

        try {
          const data =
            await response.json();

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

      showSuccessToast("Customer Deleted", "The customer was successfully deleted.");
      setDeleteTarget(null);
      setDeleteError("");

      fetchCustomers();
    } catch (error) {
      console.error(
        "Delete customer error:",
        error
      );

      setDeleteError(
        "Unable to connect to the server."
      );
    } finally {
      setDeleteLoading(false);
    }
  };


  const handleImportCsv = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setImportLoading(true);
      setImportMessage("");

      const body = new FormData();

      body.append(
        "file",
        file
      );

      const response = await fetch(
        IMPORT_API,
        {
          method: "POST",

          headers: {
            Authorization:
              `Token ${token}`,
          },

          body,
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        setImportMessage(
          data.detail ||
          data.file?.[0] ||
          "Unable to import customer CSV."
        );

        return;
      }

      const errorPreview =
        Array.isArray(data.errors)
        && data.errors.length
          ? ` ${data.errors
              .slice(0, 3)
              .map(
                (item) =>
                  `Row ${item.row}: ${item.detail}`
              )
              .join(" | ")}`
          : "";

      setImportMessage(
        `Import complete: ${
          data.created || 0
        } created, ${
          data.updated || 0
        } updated, ${
          data.skipped || 0
        } skipped.${errorPreview}`
      );

      // Clear any active search so newly imported contacts are
      // immediately visible instead of appearing to be missing.
      setSearch("");
      await fetchCustomers("");
    } catch (error) {
      console.error(
        "Customer CSV import error:",
        error
      );

      setImportMessage(
        "Unable to connect to the server for CSV import."
      );
    } finally {
      setImportLoading(false);
    }
  };


  return (
    <div className="customers-page">

      <style>
        {DELETE_MODAL_CSS}
      </style>


      <div className="customers-header">

        <div>

          <button
            className="back-dashboard"
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
            Customers

            <PageGuide
              title="Customers"
              text="Manage customer or parent-company records, contacts, status, documents, and related customer information."
            />
          </h1>


          <p>
            Manage customer accounts
            and contact information.
          </p>

        </div>


        <div className="customers-header-actions">

          {canExport && (

            <label
              className={
                `import-customer-btn ${
                  importLoading
                    ? "disabled"
                    : ""
                }`
              }
            >

              <Upload
                size={17}
              />

              {importLoading
                ? "Importing..."
                : "Import Customers / Contacts CSV"
              }

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={
                  handleImportCsv
                }
                disabled={
                  importLoading
                }
                hidden
              />

            </label>

          )}


          {canManageCustomers && (

            <button
              className="add-customer-btn"
              onClick={
                openAddModal
              }
            >

              <Plus
                size={18}
              />

              Add Customer

            </button>

          )}

        </div>

      </div>


      {importMessage && (

        <div className="customer-import-message">
          {importMessage}
        </div>

      )}


      <div className="customers-card">

        <form
          className="customer-search"
          onSubmit={
            handleSearch
          }
        >

          <Search
            size={18}
          />


          <input
            type="text"
            placeholder="Search customers..."
            value={
              search
            }
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />


          <button
            type="submit"
          >
            Search
          </button>

        </form>


        {loading ? (

          <div className="customer-empty">

            Loading customers...

          </div>

        ) : customers.length === 0 ? (

          <div className="customer-empty">

            <Users
              size={42}
            />


            <h3>
              No customers yet
            </h3>


            <p>
              Add your first customer
              to get started.
            </p>

          </div>

        ) : (

          <div className="customers-table-wrapper">

            <table className="customers-table">

              <thead>

                <tr>

                  <th>
                    Company
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
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

                {customers.map(
                  (customer) => (

                    <tr
                      key={
                        customer.id
                      }
                    >

                      <td>

                        <Link
                          to={
                            `/customers/${customer.id}`
                          }
                          className="customer-company-link"
                          aria-label={
                            `Open customer record for ${customer.company_name}`
                          }
                        >

                          {
                            customer.company_name
                          }

                        </Link>

                      </td>


                      <td>
                        {
                          customer.contact_name
                          || "—"
                        }
                      </td>


                      <td>
                        {
                          customer.email
                          || "—"
                        }
                      </td>


                      <td>
                        {
                          customer.phone
                          || "—"
                        }
                      </td>


                      <td>

                        <span
                          className={
                            `customer-status ${customer.status}`
                          }
                        >

                          {
                            formatCustomerStatus(
                              customer.status
                            )
                          }

                        </span>

                      </td>


                      <td>

                        <div className="customer-actions">

                          <button
                            className="view-btn"
                            title="Open customer record"
                            aria-label={
                              `Open ${customer.company_name}`
                            }
                            onClick={() =>
                              navigate(
                                `/customers/${customer.id}`
                              )
                            }
                          >

                            <FolderOpen
                              size={16}
                            />

                          </button>


                          {canManageCustomers && (

                            <button
                              className="edit-btn"
                              title="Edit customer or change status"
                              onClick={() =>
                                openEditModal(
                                  customer
                                )
                              }
                            >

                              <Pencil
                                size={16}
                              />

                            </button>

                          )}


                          {canDeleteCustomers && (

                            <button
                              className="delete-btn"
                              title="Delete customer"
                              onClick={() =>
                                openDeleteModal(
                                  customer
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


      {showModal && (

        <div className="customer-modal-overlay">

          <div className="customer-modal">

            <div className="customer-modal-header">

              <div>

                <h2>

                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"
                  }

                </h2>


                <p>
                  {editingCustomer
                    ? "Update customer information below."
                    : "Enter customer information and the company's first location."
                  }
                </p>

              </div>


              <button
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="form-grid">


                <div className="customer-field full">

                  <label>
                    Company Name
                  </label>


                  <input
                    name="company_name"
                    value={
                      form.company_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="customer-field">

                  <label>
                    Contact Name
                  </label>


                  <input
                    name="contact_name"
                    value={
                      form.contact_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="customer-field">

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


                    <option value="credit_hold">
                      Credit Hold
                    </option>

                  </select>

                </div>


                <div className="customer-field">

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


                <div className="customer-field">

                  <label>
                    Phone
                  </label>


                  <input
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                {!editingCustomer ? (

                  <>

                    <div className="customer-field">

                      <label>
                        Location Name
                      </label>


                      <input
                        name="first_location_name"
                        value={
                          form.first_location_name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Example: Main Office"
                      />

                    </div>


                    <div className="customer-field full customer-location-section-title">

                      <span>
                        Primary Location Address
                      </span>

                      <small>
                        Enter the complete address now so you do not need to finish it later in Locations.
                      </small>

                    </div>


                    <div className="customer-field full">

                      <label>
                        Address Line 1
                      </label>


                      <input
                        name="first_location_address_line1"
                        value={
                          form.first_location_address_line1
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Street number and street name"
                      />

                    </div>


                    <div className="customer-field full">

                      <label>
                        Address Line 2
                      </label>


                      <input
                        name="first_location_address_line2"
                        value={
                          form.first_location_address_line2
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Suite, unit, floor, building, etc."
                      />

                    </div>


                    <div className="customer-field">

                      <label>
                        City
                      </label>


                      <input
                        name="first_location_city"
                        value={
                          form.first_location_city
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="City"
                      />

                    </div>


                    <div className="customer-field">

                      <label>
                        State / Province
                      </label>


                      <input
                        name="first_location_state_province"
                        value={
                          form.first_location_state_province
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="State or province"
                      />

                    </div>


                    <div className="customer-field">

                      <label>
                        Postal Code
                      </label>


                      <input
                        name="first_location_postal_code"
                        value={
                          form.first_location_postal_code
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Postal / ZIP code"
                      />

                    </div>


                    <div className="customer-field">

                      <label>
                        Country
                      </label>


                      <input
                        name="first_location_country"
                        value={
                          form.first_location_country
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Country"
                      />

                    </div>

                  </>

                ) : (

                  <div className="customer-field full">

                    <label>
                      Notes
                    </label>


                    <textarea
                      name="notes"
                      value={
                        form.notes
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                    />

                  </div>

                )}

              </div>


              <div className="customer-modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-customer-btn"
                  disabled={
                    customerSaving
                  }
                >

                  {customerSaving
                    ? "Saving..."
                    : editingCustomer
                      ? "Save Changes"
                      : "Add Customer"
                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {duplicateWarning && (

        <div
          className="duplicate-customer-overlay"
          onMouseDown={(event) => {
            if (
              event.target
              === event.currentTarget
            ) {
              closeDuplicateWarning();
            }
          }}
        >

          <div
            className="duplicate-customer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-customer-title"
          >

            <div className="duplicate-customer-top">

              <div className="duplicate-customer-icon">
                <AlertTriangle
                  size={25}
                />
              </div>

              <button
                type="button"
                className="duplicate-customer-close"
                onClick={
                  closeDuplicateWarning
                }
                disabled={
                  customerSaving
                }
                aria-label="Close duplicate customer warning"
              >
                <X size={20} />
              </button>

            </div>


            <div className="duplicate-customer-content">

              <h2 id="duplicate-customer-title">
                Possible duplicate customer
              </h2>

              <p>
                We found an existing customer with the same contact name, email, and phone.
                Review the details below before creating another customer.
              </p>


              <div className="duplicate-customer-record">

                <div>
                  <span>
                    Existing Customer
                  </span>

                  <strong>
                    {
                      duplicateWarning
                        .customer
                        ?.company_name
                      ||
                      duplicateWarning
                        .customer
                        ?.contact_name
                      ||
                      `Customer #${duplicateWarning.customer?.id}`
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Match Reason
                  </span>

                  <strong>
                    {
                      duplicateWarning.reason
                    }
                  </strong>
                </div>


                {duplicateWarning.customer?.contact_name && (
                  <div>
                    <span>
                      Contact
                    </span>

                    <strong>
                      {
                        duplicateWarning
                          .customer
                          .contact_name
                      }
                    </strong>
                  </div>
                )}


                {duplicateWarning.customer?.email && (
                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {
                        duplicateWarning
                          .customer
                          .email
                      }
                    </strong>
                  </div>
                )}


                {duplicateWarning.customer?.phone && (
                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {
                        duplicateWarning
                          .customer
                          .phone
                      }
                    </strong>
                  </div>
                )}

              </div>

            </div>


            <div className="duplicate-customer-actions">

              <button
                type="button"
                className="duplicate-customer-cancel"
                onClick={
                  closeDuplicateWarning
                }
                disabled={
                  customerSaving
                }
              >
                Review / Cancel
              </button>


              <button
                type="button"
                className="duplicate-customer-create"
                onClick={
                  createDuplicateAnyway
                }
                disabled={
                  customerSaving
                }
              >
                {customerSaving
                  ? "Creating..."
                  : "Create Anyway"
                }
              </button>

            </div>

          </div>

        </div>

      )}


      {deleteTarget && (

        <div
          className="app-delete-overlay"
          onMouseDown={(event) => {

            if (
              event.target
              === event.currentTarget
            ) {
              closeDeleteModal();
            }

          }}
        >

          <div
            className="app-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-title"
          >

            <div className="app-delete-top">

              <div className="app-delete-icon">

                <Trash2
                  size={24}
                />

              </div>


              <button
                type="button"
                className="app-delete-close"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deleteLoading
                }
                aria-label="Close delete confirmation"
              >

                <X
                  size={20}
                />

              </button>

            </div>


            <div className="app-delete-content">

              <h2 id="delete-customer-title">
                Delete customer?
              </h2>


              <p>

                This will permanently
                delete{" "}

                <strong>
                  {
                    deleteTarget.company_name
                  }
                </strong>

                . This action cannot
                be undone.

              </p>


              <div className="app-delete-record">

                <span>
                  CUSTOMER
                </span>


                <strong>
                  {
                    deleteTarget.company_name
                  }
                </strong>


                <small>

                  {
                    deleteTarget.contact_name
                    ||
                    deleteTarget.email
                    ||
                    "Customer record"
                  }

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
                className="app-delete-confirm"
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
                  : "Delete Customer"
                }

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Customers;