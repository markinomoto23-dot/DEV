import { showSuccessToast } from "../components/SuccessToast";
import { apiUrl } from "../config/api";
import PageGuide from "../components/PageGuide";
import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  ArrowLeft,
  Building2,
} from "lucide-react";

import "./Locations.css";


function formatLocationStatus(value) {
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


const LOCATIONS_API =
  apiUrl("/api/locations/");

const CUSTOMERS_API =
  apiUrl("/api/customers/");

const PERMISSIONS_API =
  apiUrl("/api/access/me/permissions/");


function Locations() {
  const navigate =
    useNavigate();

  const routeLocation =
    useLocation();

  const token =
    localStorage.getItem(
      "token"
    );


  // =====================================================
  // DATA
  // =====================================================

  const [
    locations,
    setLocations,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);


  // =====================================================
  // ROLE
  // =====================================================

  const [
    currentRole,
    setCurrentRole,
  ] = useState("");

  const [
    permissionsLoaded,
    setPermissionsLoaded,
  ] = useState(false);


  const normalizedRole =
    String(
      currentRole || ""
    )
      .trim()
      .toLowerCase();


  const isTechnician =
    normalizedRole ===
    "technician";


  const canManageLocations =
    permissionsLoaded &&
    Boolean(currentRole) &&
    !isTechnician;


  // =====================================================
  // PAGE STATE
  // =====================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    customerFilter,
    setCustomerFilter,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // =====================================================
  // ADD / EDIT
  // =====================================================

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingLocation,
    setEditingLocation,
  ] = useState(null);


  // =====================================================
  // DELETE
  // =====================================================

  const [
    deleteTarget,
    setDeleteTarget,
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
  // FORM
  // =====================================================

  const emptyForm = {
    customer: "",
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
    status: "active",
    notes: "",
  };


  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );


  // =====================================================
  // AUTH
  // =====================================================

  const logoutAndRedirect =
    () => {
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


  const authHeaders = {
    Authorization:
      `Token ${token}`,
  };


  // =====================================================
  // LOAD PERMISSIONS
  // =====================================================

  const fetchPermissions =
    async () => {
      try {
        const response =
          await fetch(
            PERMISSIONS_API,
            {
              headers:
                authHeaders,
            }
          );


        if (
          response.status === 401
        ) {
          logoutAndRedirect();

          return "";
        }


        if (!response.ok) {
          throw new Error(
            "Unable to load permissions."
          );
        }


        const data =
          await response.json();


        const role =
          data.role || "";


        setCurrentRole(
          role
        );


        return role;

      } catch (error) {
        console.error(
          "Permission loading error:",
          error
        );


        setCurrentRole(
          ""
        );


        return "";

      } finally {
        setPermissionsLoaded(
          true
        );
      }
    };


  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  const fetchCustomers =
    async () => {
      try {
        const response =
          await fetch(
            CUSTOMERS_API,
            {
              headers:
                authHeaders,
            }
          );


        if (
          response.status === 401
        ) {
          logoutAndRedirect();
          return;
        }


        if (!response.ok) {
          return;
        }


        const data =
          await response.json();


        setCustomers(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (error) {
        console.error(
          "Customer loading error:",
          error
        );
      }
    };


  // =====================================================
  // LOAD LOCATIONS
  // =====================================================

  const fetchLocations =
    async (
      searchValue = search
    ) => {
      try {
        setLoading(
          true
        );

        setError(
          ""
        );


        const cleanSearch =
          searchValue.trim();


        const url =
          cleanSearch
            ? `${LOCATIONS_API}?search=${encodeURIComponent(
                cleanSearch
              )}`
            : LOCATIONS_API;


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
          logoutAndRedirect();
          return;
        }


        if (!response.ok) {
          throw new Error(
            "Unable to load locations."
          );
        }


        const data =
          await response.json();


        setLocations(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (error) {
        console.error(
          "Location loading error:",
          error
        );


        setError(
          "Unable to load locations."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) {
      logoutAndRedirect();
      return;
    }


    const initializePage =
      async () => {
        const role =
          await fetchPermissions();


        const normalized =
          String(
            role || ""
          )
            .trim()
            .toLowerCase();


        // Technician only needs
        // read-only location data.

        if (
          normalized !==
          "technician"
        ) {
          await fetchCustomers();
        }


        await fetchLocations(
          ""
        );
      };


    initializePage();

  }, []);


  // =====================================================
  // OPEN ADD MODAL FROM CUSTOMER RECORD
  // =====================================================

  useEffect(() => {
    const state = routeLocation.state;

    if (
      !state?.openAddLocation ||
      !canManageLocations
    ) {
      return;
    }

    setEditingLocation(null);
    setError("");
    setForm({
      ...emptyForm,
      customer: state.customerId
        ? String(state.customerId)
        : "",
      country: "United States",
    });
    setShowModal(true);

    // Consume the navigation state so a later remount/refresh
    // does not reopen the Add Location modal automatically.
    navigate(routeLocation.pathname, {
      replace: true,
      state: null,
    });
  }, [
    routeLocation.state,
    routeLocation.pathname,
    canManageLocations,
  ]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();

    fetchLocations(
      search
    );
  };


  const handleClearSearch =
    () => {
      setSearch(
        ""
      );

      fetchLocations(
        ""
      );
    };


  // =====================================================
  // STATUS FILTER
  // =====================================================

  const filteredLocations =
    locations.filter((location) => {
      const matchesStatus =
        statusFilter === "all" ||
        String(location.status || "")
          .trim()
          .toLowerCase() === statusFilter;

      const matchesCustomer =
        customerFilter === "all" ||
        String(location.customer || "") === String(customerFilter);

      return matchesStatus && matchesCustomer;
    });

  const customerOptions =
    customers.length > 0
      ? customers
      : Array.from(
          new Map(
            locations
              .filter((location) => location.customer)
              .map((location) => [
                String(location.customer),
                {
                  id: location.customer,
                  company_name: location.customer_name || "Unknown customer",
                },
              ])
          ).values()
        );


  // =====================================================
  // FORM
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
        [name]:
          value,
      })
    );
  };


  // =====================================================
  // ADD
  // =====================================================

  const openAddModal =
    () => {
      if (
        !canManageLocations
      ) {
        return;
      }


      setEditingLocation(
        null
      );

      setError(
        ""
      );


      setForm({
        ...emptyForm,
        country:
          "United States",
      });


      setShowModal(
        true
      );
    };


  // =====================================================
  // EDIT
  // =====================================================

  const openEditModal = (
    location
  ) => {
    if (
      !canManageLocations
    ) {
      return;
    }


    setEditingLocation(
      location
    );

    setError(
      ""
    );


    setForm({
      customer:
        location.customer || "",

      location_name:
        location.location_name || "",

      address_line1:
        location.address_line1 || "",

      address_line2:
        location.address_line2 || "",

      city:
        location.city || "",

      state_province:
        location.state_province || "",

      postal_code:
        location.postal_code || "",

      country:
        location.country || "",

      contact_name:
        location.contact_name || "",

      contact_email:
        location.contact_email || "",

      phone:
        location.phone || "",

      status:
        location.status || "active",

      notes:
        location.notes || "",
    });


    setShowModal(
      true
    );
  };


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal =
    () => {
      setShowModal(
        false
      );

      setEditingLocation(
        null
      );

      setForm(
        emptyForm
      );

      setError(
        ""
      );
    };


  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async (
    event
  ) => {
    event.preventDefault();


    if (
      !canManageLocations
    ) {
      setError(
        "You do not have permission to modify locations."
      );

      return;
    }




    const editing =
      Boolean(
        editingLocation
      );


    const url =
      editing
        ? `${LOCATIONS_API}${editingLocation.id}/`
        : LOCATIONS_API;


    const payload = {
      ...form,

      customer:
        form.customer
          ? Number(form.customer)
          : null,
    };


    try {
      setError(
        ""
      );


      const response =
        await fetch(
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
                payload
              ),
          }
        );


      if (
        response.status === 401
      ) {
        logoutAndRedirect();
        return;
      }


      if (
        response.status === 403
      ) {
        setError(
          "You do not have permission to modify locations."
        );

        return;
      }


      if (!response.ok) {
        let message =
          "Unable to save location. Please check the information.";


        try {
          const errorData =
            await response.json();


          message =
            errorData.detail ||
            errorData.message ||
            message;

        } catch {
          // Keep fallback.
        }


        setError(
          message
        );

        return;
      }


      showSuccessToast(editingLocation ? "Location Updated" : "Location Created", editingLocation ? "Location information was successfully saved." : "New location was successfully added.");

      closeModal();


      await fetchLocations(
        search
      );

    } catch (error) {
      console.error(
        error
      );


      setError(
        "Unable to connect to the server."
      );
    }
  };


  // =====================================================
  // DELETE MODAL
  // =====================================================

  const openDeleteModal = (
    location
  ) => {
    if (
      !canManageLocations
    ) {
      return;
    }


    setDeleteTarget(
      location
    );

    setDeleteError(
      ""
    );
  };


  const closeDeleteModal =
    () => {
      if (
        deleteLoading
      ) {
        return;
      }


      setDeleteTarget(
        null
      );

      setDeleteError(
        ""
      );
    };


  // =====================================================
  // DELETE
  // =====================================================

  const confirmDelete =
    async () => {
      if (
        !deleteTarget ||
        !canManageLocations
      ) {
        return;
      }


      try {
        setDeleteLoading(
          true
        );

        setDeleteError(
          ""
        );


        const response =
          await fetch(
            `${LOCATIONS_API}${deleteTarget.id}/`,
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
          setDeleteTarget(
            null
          );

          logoutAndRedirect();

          return;
        }


        if (
          response.status === 403
        ) {
          setDeleteError(
            "You do not have permission to delete locations."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to delete location.";


          try {
            const data =
              await response.json();


            message =
              data.detail ||
              data.message ||
              message;

          } catch {
            // Keep fallback.
          }


          setDeleteError(
            message
          );

          return;
        }


        showSuccessToast("Location Deleted", "The location was successfully deleted.");

        setDeleteTarget(
          null
        );

        setDeleteError(
          ""
        );


        await fetchLocations(
          search
        );

      } catch (error) {
        console.error(
          "Delete location error:",
          error
        );


        setDeleteError(
          "Unable to connect to the server."
        );

      } finally {
        setDeleteLoading(
          false
        );
      }
    };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="locations-page">

      <style>
        {DELETE_MODAL_CSS}
      </style>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="locations-header">

        <div>

          <button
            type="button"
            className="locations-back"
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
            Locations<PageGuide title="Locations" text="Manage customer sites, branches, offices, and service locations. Search, filter, add, edit, view, and remove locations here." />
          </h1>


          <p>
            {isTechnician
              ? (
                "View service locations related "
                + "to your assigned tickets."
              )
              : (
                "Manage customer sites, branches, "
                + "offices, and service locations."
              )}
          </p>

        </div>


        {canManageLocations && (

          <button
            type="button"
            className="add-location-btn"
            onClick={
              openAddModal
            }
          >
            <Plus
              size={18}
            />

            Add Location
          </button>

        )}

      </div>


      {/* =================================================
          CARD
      ================================================= */}

      <div className="locations-card">

        <div className="locations-toolbar">

          <form
            className="location-search"
            onSubmit={
              handleSearch
            }
          >
            <Search
              size={18}
            />


            <input
              type="text"
              placeholder="Search locations..."
              value={
                search
              }
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                fetchLocations(value);
              }}
            />


            <button
              type="submit"
            >
              Search
            </button>

          </form>


          <label className="location-filter location-customer-filter">
            <span>Customer</span>
            <select
              value={customerFilter}
              onChange={(event) =>
                setCustomerFilter(event.target.value)
              }
              aria-label="Filter locations by customer"
            >
              <option value="all">All customers</option>
              {customerOptions.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.company_name}
                </option>
              ))}
            </select>
          </label>


          <label className="location-filter location-status-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter locations by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>


          {search && (

            <button
              type="button"
              className="clear-location-search"
              onClick={
                handleClearSearch
              }
            >
              Clear search
            </button>

          )}

        </div>


        {error &&
          !showModal && (

          <div className="locations-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="locations-empty">

            <MapPin
              size={42}
            />

            <h3>
              Loading locations...
            </h3>

          </div>

        ) :
        filteredLocations.length === 0 ? (

          <div className="locations-empty">

            <MapPin
              size={45}
            />


            <h3>
              No locations found
            </h3>


            <p>
              {statusFilter !== "all"
                ? `No ${formatLocationStatus(statusFilter)} locations match the current search.`
                : isTechnician
                  ? (
                    "No service locations are currently "
                    + "linked to your assigned tickets."
                  )
                  : (
                    "Add your first customer location "
                    + "to get started."
                  )}
            </p>

          </div>

        ) : (

          <div className="locations-table-wrapper">

            <table className="locations-table">

              <thead>

                <tr>
                  <th>
                    Location
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Address
                  </th>

                  <th>
                    City
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Status
                  </th>

                  {canManageLocations && (
                    <th>
                      Actions
                    </th>
                  )}

                </tr>

              </thead>


              <tbody>

                {filteredLocations.map(
                  (location) => (

                    <tr
                      key={
                        location.id
                      }
                    >

                      <td>

                        <div className="location-name-cell">

                          <div className="location-icon">
                            <MapPin
                              size={16}
                            />
                          </div>


                          <strong>
                            {
                              location.location_name
                            }
                          </strong>

                        </div>

                      </td>


                      <td>

                        <div className="location-customer">

                          <Building2
                            size={15}
                          />


                          <span>
                            {
                              location.customer_name ||
                              "Unknown"
                            }
                          </span>

                        </div>

                      </td>


                      <td>
                        {
                          location.address_line1 ||
                          "\u2014"
                        }
                      </td>


                      <td>
                        {
                          location.city ||
                          "\u2014"
                        }
                      </td>


                      <td>
                        {
                          location.contact_name ||
                          "\u2014"
                        }
                      </td>


                      <td>
                        {
                          location.phone ||
                          "\u2014"
                        }
                      </td>


                      <td>

                        <span
                          className={`location-status ${location.status}`}
                        >

                          {formatLocationStatus(location.status)}

                        </span>

                      </td>


                      {canManageLocations && (

                        <td>

                          <div className="location-actions">

                            <button
                              type="button"
                              className="location-edit-btn"
                              title="Edit location"
                              onClick={() =>
                                openEditModal(
                                  location
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>


                            <button
                              type="button"
                              className="location-delete-btn"
                              title="Delete location"
                              onClick={() =>
                                openDeleteModal(
                                  location
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>

                        </td>

                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal &&
        canManageLocations && (

        <div className="location-modal-overlay">

          <div className="location-modal">

            <div className="location-modal-header">

              <div>

                <h2>
                  {editingLocation
                    ? "Edit Location"
                    : "Add Location"}
                </h2>


                <p>
                  Add a customer site,
                  office, branch, or
                  service location.
                </p>

              </div>


              <button
                type="button"
                className="location-modal-close"
                onClick={
                  closeModal
                }
              >
                <X
                  size={20}
                />  
              </button>

            </div>


            {error && (

              <div className="location-modal-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="location-form-grid">


                <div className="location-field full">

                  <label>
                    Customer
                  </label>


                  <select
                    name="customer"
                    value={
                      form.customer
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select customer
                    </option>


                    {customers.map(
                      (customer) => (

                        <option
                          key={
                            customer.id
                          }
                          value={
                            customer.id
                          }
                        >
                          {
                            customer.company_name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="location-field full">

                  <label>
                    Location Name
                  </label>


                  <input
                    name="location_name"
                    placeholder="Example: Main Office"
                    value={
                      form.location_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field full">

                  <label>
                    Address Line 1
                  </label>


                  <input
                    name="address_line1"
                    placeholder="Street, building, barangay"
                    value={
                      form.address_line1
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field full">

                  <label>
                    Address Line 2
                  </label>


                  <input
                    name="address_line2"
                    placeholder="Unit, floor, subdivision, additional address"
                    value={
                      form.address_line2
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    City
                  </label>


                  <input
                    name="city"
                    placeholder="City"
                    value={
                      form.city
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    State / Province
                  </label>


                  <input
                    name="state_province"
                    placeholder="Province"
                    value={
                      form.state_province
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    Postal Code
                  </label>


                  <input
                    name="postal_code"
                    placeholder="Postal code"
                    value={
                      form.postal_code
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    Country
                  </label>


                  <input
                    name="country"
                    placeholder="Country"
                    value={
                      form.country
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    Contact Person
                  </label>


                  <input
                    name="contact_name"
                    placeholder="Contact person"
                    value={
                      form.contact_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    Email
                  </label>


                  <input
                    name="contact_email"
                    type="email"
                    placeholder="Email address"
                    value={
                      form.contact_email
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

                  <label>
                    Phone
                  </label>


                  <input
                    name="phone"
                    placeholder="Phone number"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="location-field">

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


                <div className="location-field full">

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
                    placeholder="Optional notes about this location"
                  />

                </div>

              </div>


              <div className="location-modal-actions">

                <button
                  type="button"
                  className="location-cancel-btn"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="location-save-btn"
                >
                  {editingLocation
                    ? "Save Changes"
                    : "Add Location"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deleteTarget &&
        canManageLocations && (

        <div
          className="app-delete-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDeleteModal();
            }
          }}
        >

          <div
            className="app-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-location-title"
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

              <h2 id="delete-location-title">
                Delete location?
              </h2>


              <p>
                This will permanently
                delete{" "}

                <strong>
                  {
                    deleteTarget.location_name
                  }
                </strong>

                . This action cannot
                be undone.
              </p>


              <div className="app-delete-record">

                <span>
                  LOCATION
                </span>


                <strong>
                  {
                    deleteTarget.location_name
                  }
                </strong>


                <small>
                  {
                    deleteTarget.customer_name ||
                    deleteTarget.city ||
                    "Location record"
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
                  : "Delete Location"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Locations;