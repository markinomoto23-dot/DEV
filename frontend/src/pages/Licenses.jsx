import { showSuccessToast } from "../components/SuccessToast";
import { apiUrl } from "../config/api";
import PageGuide from "../components/PageGuide";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import "./Licenses.css";

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


const LICENSES_API = apiUrl("/api/licenses/");

const EQUIPMENT_API = apiUrl("/api/equipment/");

const PERMISSIONS_API = apiUrl("/api/access/me/permissions/");


function Licenses() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );


  // =====================================================
  // DATA
  // =====================================================

  const [
    licenses,
    setLicenses,
  ] = useState([]);

  const [
    equipment,
    setEquipment,
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


  const canManageLicenses =
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
    editingLicense,
    setEditingLicense,
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
    equipment: "",
    license_number: "",
    license_type: "",
    provider: "",
    issue_date: "",
    expiration_date: "",
    quantity: 1,
    product_key: "",
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


  const authHeaders = {
    Authorization:
      `Token ${token}`,
  };


  // =====================================================
  // SELECTED EQUIPMENT
  // =====================================================

  const selectedEquipment =
    useMemo(() => {
      return (
        equipment.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              form.equipment
            )
        )
      );

    }, [
      equipment,
      form.equipment,
    ]);


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
          logout();

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
  // LOAD EQUIPMENT
  // =====================================================

  const fetchEquipment =
    async () => {
      try {
        const response =
          await fetch(
            EQUIPMENT_API,
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


        if (!response.ok) {
          return;
        }


        const data =
          await response.json();


        setEquipment(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (error) {
        console.error(
          "Equipment loading error:",
          error
        );
      }
    };


  // =====================================================
  // LOAD LICENSES
  // =====================================================

  const fetchLicenses =
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
            ? `${LICENSES_API}?search=${encodeURIComponent(
                cleanSearch
              )}`
            : LICENSES_API;


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


        if (!response.ok) {
          throw new Error(
            "Unable to load licenses."
          );
        }


        const data =
          await response.json();


        setLicenses(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (error) {
        console.error(
          "License loading error:",
          error
        );


        setError(
          "Unable to load licenses."
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
      logout();
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


        // Technician only reads licenses.
        // Equipment dropdown is only needed
        // when creating/editing licenses.

        if (
          normalized !==
          "technician"
        ) {
          await fetchEquipment();
        }


        await fetchLicenses(
          ""
        );
      };


    initializePage();

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
        !canManageLicenses
      ) {
        return;
      }


      setEditingLicense(
        null
      );

      setForm(
        emptyForm
      );

      setError(
        ""
      );

      setShowModal(
        true
      );
    };


  // =====================================================
  // EDIT
  // =====================================================

  const openEditModal = (
    license
  ) => {
    if (
      !canManageLicenses
    ) {
      return;
    }


    setEditingLicense(
      license
    );


    setForm({
      equipment:
        license.equipment || "",

      license_number:
        license.license_number || "",

      license_type:
        license.license_type || "",

      provider:
        license.provider || "",

      issue_date:
        license.issue_date || "",

      expiration_date:
        license.expiration_date || "",

      quantity:
        license.quantity || 1,

      product_key:
        license.product_key || "",

      status:
        license.status || "active",

      notes:
        license.notes || "",
    });


    setError(
      ""
    );

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

      setEditingLicense(
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

  const handleSave =
    async (
      event
    ) => {
      event.preventDefault();


      if (
        !canManageLicenses
      ) {
        setError(
          "You do not have permission to modify licenses."
        );

        return;
      }




      const editing =
        Boolean(
          editingLicense
        );


      const url =
        editing
          ? `${LICENSES_API}${editingLicense.id}/`
          : LICENSES_API;


      const payload = {
        ...form,

        equipment:
          form.equipment
            ? Number(form.equipment)
            : null,

        quantity:
          Number(
            form.quantity
          ) || 1,

        issue_date:
          form.issue_date ||
          null,

        expiration_date:
          form.expiration_date ||
          null,
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
                  ? "PUT"
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
          logout();
          return;
        }


        if (
          response.status === 403
        ) {
          setError(
            "You do not have permission to modify licenses."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to save license. Please check the information.";


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


          setError(
            message
          );

          return;
        }


        showSuccessToast(editingLicense ? "License Updated" : "License Created", editingLicense ? "License information was successfully saved." : "New license was successfully added.");

        closeModal();


        await fetchLicenses(
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
    license
  ) => {
    if (
      !canManageLicenses
    ) {
      return;
    }


    setDeleteTarget(
      license
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
        !canManageLicenses
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
            `${LICENSES_API}${deleteTarget.id}/`,
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

          logout();

          return;
        }


        if (
          response.status === 403
        ) {
          setDeleteError(
            "You do not have permission to delete licenses."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to delete license.";


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


        showSuccessToast("License Deleted", "The license was successfully deleted.");

        setDeleteTarget(
          null
        );

        setDeleteError(
          ""
        );


        await fetchLicenses(
          search
        );

      } catch (error) {
        console.error(
          "Delete license error:",
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
  // SEARCH
  // =====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();


    fetchLicenses(
      search
    );
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="licenses-page">

      <style>
        {DELETE_MODAL_CSS}
      </style>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="licenses-header">

        <div>

          <button
            type="button"
            className="licenses-back"
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
            Licenses<PageGuide title="Licenses" text="Manage software or service licenses, including assignments, dates, renewal information, and status." />
          </h1>


          <p>
            {isTechnician
              ? (
                "View licenses related to equipment "
                + "on your assigned service tickets."
              )
              : (
                "Manage equipment licenses, subscriptions, "
                + "product keys, and expiration dates."
              )}
          </p>

        </div>


        {canManageLicenses && (

          <button
            type="button"
            className="add-license-btn"
            onClick={
              openAddModal
            }
          >
            <Plus
              size={18}
            />

            Add License
          </button>

        )}

      </div>


      {/* =================================================
          CARD
      ================================================= */}

      <div className="licenses-card">

        <form
          className="license-search"
          onSubmit={
            handleSearch
          }
        >

          <Search
            size={18}
          />


          <input
            type="text"
            placeholder="Search licenses..."
            value={
              search
            }
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              fetchLicenses(value);
            }}
          />


          <button
            type="submit"
          >
            Search
          </button>

        </form>


        {error &&
          !showModal && (

          <div className="license-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="license-empty">
            Loading licenses...
          </div>

        ) :
        licenses.length === 0 ? (

          <div className="license-empty">

            <KeyRound
              size={45}
            />


            <h3>
              No licenses found
            </h3>


            <p>
              {isTechnician
                ? (
                  "No licenses are currently linked "
                  + "to your assigned equipment."
                )
                : (
                  "Add a license to an equipment record."
                )}
            </p>

          </div>

        ) : (

          <div className="license-table-wrapper">

            <table className="license-table">

              <thead>

                <tr>
                  <th>
                    License #
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Equipment
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Provider
                  </th>

                  <th>
                    Quantity
                  </th>

                  <th>
                    Issued
                  </th>

                  <th>
                    Expires
                  </th>

                  <th>
                    Status
                  </th>

                  {canManageLicenses && (
                    <th>
                      Actions
                    </th>
                  )}

                </tr>

              </thead>


              <tbody>

                {licenses.map(
                  (license) => (

                    <tr
                      key={
                        license.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            license.license_number ||
                            "—"
                          }
                        </strong>

                      </td>


                      <td>
                        {
                          license.license_type ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          license.equipment_name
                        }
                      </td>


                      <td>
                        {
                          license.customer_name
                        }
                      </td>


                      <td>
                        {
                          license.location_name
                        }
                      </td>


                      <td>
                        {
                          license.provider ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          license.quantity ||
                          1
                        }
                      </td>


                      <td>
                        {
                          formatDate(
                            license.issue_date
                          )
                        }
                      </td>


                      <td>
                        {
                          formatDate(
                            license.expiration_date
                          )
                        }
                      </td>


                      <td>

                        <span
                          className={`license-status ${license.status}`}
                        >

                          {license.status ===
                          "active"
                            ? "Active"
                            : license.status ===
                              "expired"
                            ? "Expired"
                            : "Suspended"}

                        </span>

                      </td>


                      {canManageLicenses && (

                        <td>

                          <div className="license-actions">

                            <button
                              type="button"
                              className="license-edit"
                              title="Edit license"
                              onClick={() =>
                                openEditModal(
                                  license
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>


                            <button
                              type="button"
                              className="license-delete"
                              title="Delete license"
                              onClick={() =>
                                openDeleteModal(
                                  license
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
        canManageLicenses && (

        <div className="license-modal-overlay">

          <div className="license-modal">

            <div className="license-modal-header">

              <div>

                <h2>
                  {editingLicense
                    ? "Edit License"
                    : "Add License"}
                </h2>


                <p>
                  Assign software or
                  service licensing
                  to equipment.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
              >
                ×
              </button>

            </div>


            {error && (

              <div className="license-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="license-form-grid">


                <div className="license-field full">

                  <label>
                    Equipment
                  </label>


                  <select
                    name="equipment"
                    value={
                      form.equipment
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      Select equipment
                    </option>


                    {equipment.map(
                      (item) => (

                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.equipment_name}
                          {" | "}
                          {item.customer_name}
                          {" | "}
                          {item.location_name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {selectedEquipment && (

                  <div className="selected-license-equipment full">

                    <div>

                      <span>
                        Customer
                      </span>

                      <strong>
                        {
                          selectedEquipment.customer_name
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Location
                      </span>

                      <strong>
                        {
                          selectedEquipment.location_name
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Serial
                      </span>

                      <strong>
                        {
                          selectedEquipment.serial_number ||
                          "—"
                        }
                      </strong>

                    </div>

                  </div>

                )}


                <div className="license-field">

                  <label>
                    License Number
                  </label>


                  <input
                    name="license_number"
                    value={
                      form.license_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="LIC-0001"
                  />

                </div>


                <div className="license-field">

                  <label>
                    License Type
                  </label>


                  <input
                    name="license_type"
                    value={
                      form.license_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Microsoft 365"
                  />

                </div>


                <div className="license-field">

                  <label>
                    Provider / Vendor
                  </label>


                  <input
                    name="provider"
                    value={
                      form.provider
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Microsoft"
                  />

                </div>


                <div className="license-field">

                  <label>
                    Quantity / Seats
                  </label>


                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={
                      form.quantity
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="license-field">

                  <label>
                    Issue Date
                  </label>


                  <input
                    type="date"
                    name="issue_date"
                    value={
                      form.issue_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="license-field">

                  <label>
                    Expiration Date
                  </label>


                  <input
                    type="date"
                    name="expiration_date"
                    value={
                      form.expiration_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="license-field full">

                  <label>
                    Product Key
                  </label>


                  <input
                    name="product_key"
                    value={
                      form.product_key
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  />

                </div>


                <div className="license-field">

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

                    <option value="expired">
                      Expired
                    </option>

                    <option value="suspended">
                      Suspended
                    </option>

                  </select>

                </div>


                <div className="license-field full">

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
                    placeholder="License notes or subscription details"
                  />

                </div>

              </div>


              <div className="license-modal-actions">

                <button
                  type="button"
                  className="license-cancel"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="license-save"
                >
                  {editingLicense
                    ? "Save Changes"
                    : "Add License"}
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
        canManageLicenses && (

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
            aria-labelledby="delete-license-title"
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

              <h2 id="delete-license-title">
                Delete license?
              </h2>


              <p>
                This will permanently
                delete{" "}

                <strong>
                  {
                    deleteTarget.license_number ||
                    deleteTarget.license_type ||
                    deleteTarget.equipment_name
                  }
                </strong>

                . This action cannot
                be undone.
              </p>


              <div className="app-delete-record">

                <span>
                  LICENSE
                </span>


                <strong>
                  {
                    deleteTarget.license_number ||
                    deleteTarget.license_type ||
                    "License record"
                  }
                </strong>


                <small>
                  {
                    deleteTarget.equipment_name ||
                    deleteTarget.provider ||
                    "Equipment license"
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
                  : "Delete License"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Licenses;