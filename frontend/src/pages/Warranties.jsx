import { showSuccessToast } from "../components/SuccessToast";
import PageGuide from "../components/PageGuide";
﻿import { apiUrl } from "../config/api";
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
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import "./Warranties.css";

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


const WARRANTIES_API =
  apiUrl("/api/warranties/");

const EQUIPMENT_API =
  apiUrl("/api/equipment/");

const PERMISSIONS_API =
  apiUrl("/api/access/me/permissions/");


function Warranties() {
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
    warranties,
    setWarranties,
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


  const canManageWarranties =
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
    editingWarranty,
    setEditingWarranty,
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
    provider: "",
    warranty_number: "",
    start_date: "",
    expiration_date: "",
    coverage_type: "",
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
            String(item.id) ===
            String(form.equipment)
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
  // LOAD WARRANTIES
  // =====================================================

  const fetchWarranties =
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
            ? `${WARRANTIES_API}?search=${encodeURIComponent(
                cleanSearch
              )}`
            : WARRANTIES_API;


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
            "Unable to load warranties."
          );
        }


        const data =
          await response.json();


        setWarranties(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (error) {
        console.error(
          "Warranty loading error:",
          error
        );


        setError(
          "Unable to load warranties."
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


        // Technician is read-only.
        // Equipment dropdown is only
        // required for Admin management.

        if (
          normalized !==
          "technician"
        ) {
          await fetchEquipment();
        }


        await fetchWarranties(
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
        [name]: value,
      })
    );
  };


  // =====================================================
  // ADD
  // =====================================================

  const openAddModal =
    () => {
      if (
        !canManageWarranties
      ) {
        return;
      }


      setEditingWarranty(
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
    warranty
  ) => {
    if (
      !canManageWarranties
    ) {
      return;
    }


    setEditingWarranty(
      warranty
    );


    setForm({
      equipment:
        warranty.equipment || "",

      provider:
        warranty.provider || "",

      warranty_number:
        warranty.warranty_number || "",

      start_date:
        warranty.start_date || "",

      expiration_date:
        warranty.expiration_date || "",

      coverage_type:
        warranty.coverage_type || "",

      status:
        warranty.status || "active",

      notes:
        warranty.notes || "",
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

      setEditingWarranty(
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
        !canManageWarranties
      ) {
        setError(
          "You do not have permission to modify warranties."
        );

        return;
      }




      const editing =
        Boolean(
          editingWarranty
        );


      const url =
        editing
          ? `${WARRANTIES_API}${editingWarranty.id}/`
          : WARRANTIES_API;


      const payload = {
        ...form,

        equipment:
          form.equipment
            ? Number(form.equipment)
            : null,

        start_date:
          form.start_date ||
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
            "You do not have permission to modify warranties."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to save warranty. Please check the information.";


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


        showSuccessToast(editingWarranty ? "Warranty Updated" : "Warranty Created", editingWarranty ? "Warranty information was successfully saved." : "New warranty was successfully added.");

        closeModal();


        await fetchWarranties(
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
    warranty
  ) => {
    if (
      !canManageWarranties
    ) {
      return;
    }


    setDeleteTarget(
      warranty
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
        !canManageWarranties
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
            `${WARRANTIES_API}${deleteTarget.id}/`,
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
            "You do not have permission to delete warranties."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to delete warranty.";


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


        showSuccessToast("Warranty Deleted", "The warranty was successfully deleted.");

        setDeleteTarget(
          null
        );

        setDeleteError(
          ""
        );


        await fetchWarranties(
          search
        );

      } catch (error) {
        console.error(
          "Delete warranty error:",
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


    fetchWarranties(
      search
    );
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="warranties-page">

      <style>
        {DELETE_MODAL_CSS}
      </style>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="warranties-header">

        <div>

          <button
            type="button"
            className="warranties-back"
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
            Warranties<PageGuide title="Warranties" text="Track equipment warranties, coverage periods, providers, and warranty status." />
          </h1>


          <p>
            {isTechnician
              ? (
                "View warranties related to equipment "
                + "on your assigned service tickets."
              )
              : (
                "Manage equipment warranties, coverage, "
                + "providers, and expiration dates."
              )}
          </p>

        </div>


        {canManageWarranties && (

          <button
            type="button"
            className="add-warranty-btn"
            onClick={
              openAddModal
            }
          >
            <Plus
              size={18}
            />

            Add Warranty
          </button>

        )}

      </div>


      {/* =================================================
          CARD
      ================================================= */}

      <div className="warranties-card">

        <form
          className="warranty-search"
          onSubmit={
            handleSearch
          }
        >

          <Search
            size={18}
          />


          <input
            type="text"
            placeholder="Search warranties..."
            value={
              search
            }
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              fetchWarranties(value);
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

          <div className="warranty-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="warranty-empty">
            Loading warranties...
          </div>

        ) :
        warranties.length === 0 ? (

          <div className="warranty-empty">

            <ShieldCheck
              size={45}
            />


            <h3>
              No warranties found
            </h3>


            <p>
              {isTechnician
                ? (
                  "No warranties are currently linked "
                  + "to your assigned equipment."
                )
                : (
                  "Add a warranty to an equipment record."
                )}
            </p>

          </div>

        ) : (

          <div className="warranty-table-wrapper">

            <table className="warranty-table">

              <thead>

                <tr>
                  <th>
                    Warranty #
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
                    Coverage
                  </th>

                  <th>
                    Start
                  </th>

                  <th>
                    Expires
                  </th>

                  <th>
                    Status
                  </th>

                  {canManageWarranties && (
                    <th>
                      Actions
                    </th>
                  )}

                </tr>

              </thead>


              <tbody>

                {warranties.map(
                  (warranty) => (

                    <tr
                      key={
                        warranty.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            warranty.warranty_number ||
                            "â€”"
                          }
                        </strong>

                      </td>


                      <td>
                        {
                          warranty.equipment_name
                        }
                      </td>


                      <td>
                        {
                          warranty.customer_name
                        }
                      </td>


                      <td>
                        {
                          warranty.location_name
                        }
                      </td>


                      <td>
                        {
                          warranty.provider ||
                          "â€”"
                        }
                      </td>


                      <td>
                        {
                          warranty.coverage_type ||
                          "â€”"
                        }
                      </td>


                      <td>
                        {
                          formatDate(
                            warranty.start_date
                          )
                        }
                      </td>


                      <td>
                        {
                          formatDate(
                            warranty.expiration_date
                          )
                        }
                      </td>


                      <td>

                        <span
                          className={`warranty-status ${warranty.status}`}
                        >

                          {
                            warranty.status ===
                            "active"
                              ? "Active"
                              : warranty.status ===
                                "expired"
                              ? "Expired"
                              : "Void"
                          }

                        </span>

                      </td>


                      {canManageWarranties && (

                        <td>

                          <div className="warranty-actions">

                            <button
                              type="button"
                              className="warranty-edit"
                              title="Edit warranty"
                              onClick={() =>
                                openEditModal(
                                  warranty
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>


                            <button
                              type="button"
                              className="warranty-delete"
                              title="Delete warranty"
                              onClick={() =>
                                openDeleteModal(
                                  warranty
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
        canManageWarranties && (

        <div className="warranty-modal-overlay">

          <div className="warranty-modal">

            <div className="warranty-modal-header">

              <div>

                <h2>
                  {
                    editingWarranty
                      ? "Edit Warranty"
                      : "Add Warranty"
                  }
                </h2>


                <p>
                  Link warranty coverage
                  to equipment.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeModal
                }
              >
               <X size={20} /> 
              </button>

            </div>


            {error && (

              <div className="warranty-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="warranty-form-grid">


                <div className="warranty-field full">

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

                  <div className="selected-equipment-info full">

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
                          "â€”"
                        }
                      </strong>

                    </div>

                  </div>

                )}


                <div className="warranty-field">

                  <label>
                    Warranty Number
                  </label>


                  <input
                    name="warranty_number"
                    value={
                      form.warranty_number
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="WR-0001"
                  />

                </div>


                <div className="warranty-field">

                  <label>
                    Provider
                  </label>


                  <input
                    name="provider"
                    value={
                      form.provider
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Warranty provider"
                  />

                </div>


                <div className="warranty-field">

                  <label>
                    Start Date
                  </label>


                  <input
                    type="date"
                    name="start_date"
                    value={
                      form.start_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="warranty-field">

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


                <div className="warranty-field">

                  <label>
                    Coverage Type
                  </label>


                  <input
                    name="coverage_type"
                    value={
                      form.coverage_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Parts and Labor"
                  />

                </div>


                <div className="warranty-field">

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

                    <option value="void">
                      Void
                    </option>

                  </select>

                </div>


                <div className="warranty-field full">

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
                    placeholder="Coverage details or warranty notes"
                  />

                </div>

              </div>


              <div className="warranty-modal-actions">

                <button
                  type="button"
                  className="warranty-cancel"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="warranty-save"
                >
                  {
                    editingWarranty
                      ? "Save Changes"
                      : "Add Warranty"
                  }
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
        canManageWarranties && (

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
            aria-labelledby="delete-warranty-title"
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

              <h2 id="delete-warranty-title">
                Delete warranty?
              </h2>


              <p>
                This will permanently
                delete the warranty{" "}

                <strong>
                  {
                    deleteTarget.warranty_number ||
                    deleteTarget.equipment_name ||
                    "selected warranty"
                  }
                </strong>

                . This action cannot
                be undone.
              </p>


              <div className="app-delete-record">

                <span>
                  WARRANTY
                </span>


                <strong>
                  {
                    deleteTarget.warranty_number ||
                    "No warranty number"
                  }
                </strong>


                <small>
                  {
                    deleteTarget.equipment_name ||
                    "No equipment"
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
                  : "Delete Warranty"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Warranties;