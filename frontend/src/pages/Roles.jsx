import { showSuccessToast } from "../components/SuccessToast";
import PageGuide from "../components/PageGuide";
﻿import { apiUrl } from "../config/api";
import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import "./Roles.css";


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
}

.app-delete-actions {
  padding: 18px 28px;
  display: flex;
  justify-content: center;
  gap: 10px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.app-delete-cancel,
.app-delete-confirm {
  min-height: 42px;
  padding: 0 18px;
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

.app-delete-cancel:disabled,
.app-delete-confirm:disabled,
.app-delete-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.core-role-notice {
  margin: 0 0 20px;
  padding: 13px 15px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 13px;
  line-height: 1.5;
}

.core-role-notice svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.roles-checkbox.locked {
  opacity: 0.72;
  cursor: not-allowed;
}

.roles-checkbox.locked input {
  cursor: not-allowed;
}
`;


const ROLES_API =
  apiUrl("/api/access/roles/");


const permissionFields = [
  [
    "can_access_dashboard",
    "Dashboard",
  ],
  [
    "can_access_customers",
    "Customers",
  ],
  [
    "can_access_locations",
    "Locations",
  ],
  [
    "can_access_equipment",
    "Equipment",
  ],
  [
    "can_access_warranties",
    "Warranties",
  ],
  [
    "can_access_licenses",
    "Licenses",
  ],
  [
    "can_access_tickets",
    "Tickets",
  ],
  [
    "can_access_technicians",
    "Technicians",
  ],
  [
    "can_access_billing",
    "Billing",
  ],
  [
    "can_access_reports",
    "Reports",
  ],
  [
    "can_access_users",
    "Users",
  ],
  [
    "can_access_roles",
    "Roles",
  ],
  [
    "can_access_audit_trail",
    "Audit Trail",
  ],
  [
    "can_access_notifications",
    "Notifications",
  ],
  [
    "can_access_settings",
    "Settings",
  ],
];


const permissionKeys =
  permissionFields.map(
    ([field]) => field
  );


const emptyPermissions = {
  can_access_dashboard: false,
  can_access_customers: false,
  can_access_locations: false,
  can_access_equipment: false,
  can_access_warranties: false,
  can_access_licenses: false,
  can_access_tickets: false,
  can_access_technicians: false,
  can_access_billing: false,
  can_access_reports: false,
  can_access_users: false,
  can_access_roles: false,
  can_access_audit_trail: false,
  can_access_notifications: false,
  can_access_settings: false,

  can_manage_users: false,
  can_manage_roles: false,
};


const SYSTEM_ROLE_DEFAULTS = {
  admin: {
    name: "Admin",
    is_system: true,

    can_access_dashboard: true,
    can_access_customers: true,
    can_access_locations: true,
    can_access_equipment: true,
    can_access_warranties: true,
    can_access_licenses: true,
    can_access_tickets: true,
    can_access_technicians: true,
    can_access_billing: true,
    can_access_reports: true,
    can_access_users: true,
    can_access_roles: true,
    can_access_audit_trail: true,
    can_access_notifications: true,
    can_access_settings: true,

    can_manage_users: true,
    can_manage_roles: true,
  },

  technician: {
    name: "Technician",
    is_system: true,

    can_access_dashboard: true,
    can_access_customers: false,
    can_access_locations: true,
    can_access_equipment: true,
    can_access_warranties: true,
    can_access_licenses: true,
    can_access_tickets: true,
    can_access_technicians: false,
    can_access_billing: false,
    can_access_reports: false,
    can_access_users: false,
    can_access_roles: false,
    can_access_audit_trail: false,
    can_access_notifications: false,
    can_access_settings: false,

    can_manage_users: false,
    can_manage_roles: false,
  },

  user: {
    name: "User",
    is_system: true,

    can_access_dashboard: true,
    can_access_customers: true,
    can_access_locations: true,
    can_access_equipment: true,
    can_access_warranties: false,
    can_access_licenses: false,
    can_access_tickets: true,
    can_access_technicians: false,
    can_access_billing: false,
    can_access_reports: false,
    can_access_users: false,
    can_access_roles: false,
    can_access_audit_trail: false,
    can_access_notifications: false,
    can_access_settings: false,

    can_manage_users: false,
    can_manage_roles: false,
  },
};


const emptyForm = {
  name: "",
  description: "",
  is_system: false,

  ...emptyPermissions,

  can_access_dashboard: true,
};


function normalizeRoleName(
  name
) {
  return String(
    name || ""
  )
    .trim()
    .toLowerCase();
}


function getSystemDefaults(
  name
) {
  return (
    SYSTEM_ROLE_DEFAULTS[
      normalizeRoleName(
        name
      )
    ] || null
  );
}


function isCoreSystemRole(
  role
) {
  if (!role) {
    return false;
  }


  return Boolean(
    getSystemDefaults(
      role.name
    )
  );
}


/*
 * Required/default TRUE permissions
 * are always forced ON.
 *
 * Extra permissions that are normally
 * FALSE are preserved and remain editable.
 */
function applySystemMinimums(
  role
) {
  const defaults =
    getSystemDefaults(
      role?.name
    );


  if (!defaults) {
    return role;
  }


  const nextRole = {
    ...role,

    name:
      defaults.name,

    is_system:
      true,
  };


  [
    ...permissionKeys,
    "can_manage_users",
    "can_manage_roles",
  ].forEach(
    (field) => {

      if (
        defaults[field] ===
        true
      ) {
        nextRole[field] =
          true;
      }

    }
  );


  return nextRole;
}


function Roles() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );


  const [
    roles,
    setRoles,
  ] = useState([]);

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


  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingRole,
    setEditingRole,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    emptyForm
  );


  const protectedSystemRole =
    Boolean(
      editingRole &&
      isCoreSystemRole(
        editingRole
      )
    );


  const currentSystemDefaults =
    protectedSystemRole
      ? getSystemDefaults(
          editingRole?.name
        )
      : null;


  const isRequiredCorePermission = (
    field
  ) => {
    return Boolean(
      protectedSystemRole &&
      currentSystemDefaults?.[
        field
      ] === true
    );
  };


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


  const fetchRoles = async (
    searchValue = search
  ) => {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );


      const url =
        searchValue.trim()
          ? `${ROLES_API}?search=${encodeURIComponent(
              searchValue.trim()
            )}`
          : ROLES_API;


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
          "You do not have permission to manage roles."
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          "Unable to load roles."
        );
      }


      const data =
        await response.json();


      setRoles(
        Array.isArray(data)
          ? data
          : data.results || []
      );

    } catch (error) {
      console.error(
        error
      );


      setError(
        "Unable to load roles."
      );

    } finally {
      setLoading(
        false
      );
    }
  };


  useEffect(() => {
    if (!token) {
      logout();
      return;
    }


    fetchRoles(
      ""
    );

  }, []);


  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    /*
     * Core role identity
     * cannot change.
     */
    if (
      protectedSystemRole &&
      (
        name === "name" ||
        name === "is_system"
      )
    ) {
      return;
    }


    /*
     * Required core permissions
     * cannot be unchecked.
     *
     * Other permissions are
     * still editable.
     */
    if (
      isRequiredCorePermission(
        name
      )
    ) {
      return;
    }


    setForm(
      (previous) => ({
        ...previous,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  };


  const openAddModal =
    () => {
      setEditingRole(
        null
      );


      setForm({
        ...emptyForm,
      });


      setError(
        ""
      );


      setShowModal(
        true
      );
    };


  const openEditModal = (
    role
  ) => {
    setEditingRole(
      role
    );


    const baseForm = {
      ...emptyForm,
      ...role,
    };


    setForm(
      isCoreSystemRole(
        role
      )
        ? applySystemMinimums(
            baseForm
          )
        : baseForm
    );


    setError(
      ""
    );


    setShowModal(
      true
    );
  };


  const closeModal =
    () => {
      setShowModal(
        false
      );

      setEditingRole(
        null
      );

      setForm(
        emptyForm
      );

      setError(
        ""
      );
    };


  const handleSave = async (
    event
  ) => {
    event.preventDefault();




    const editing =
      Boolean(
        editingRole
      );


    const url =
      editing
        ? `${ROLES_API}${editingRole.id}/`
        : ROLES_API;


    let payload = {
      ...form,
    };


    /*
     * Re-apply minimum permissions
     * immediately before saving.
     *
     * Extra permissions remain
     * exactly as selected.
     */
    if (
      protectedSystemRole
    ) {
      payload =
        applySystemMinimums({
          ...payload,

          name:
            editingRole.name,

          is_system:
            true,
        });
    }


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
          "You do not have permission to manage roles."
        );

        return;
      }


      if (!response.ok) {
        let message =
          "Unable to save role.";


        try {
          const data =
            await response.json();


          const firstError =
            Object.values(
              data
            )?.[0];


          if (
            Array.isArray(
              firstError
            )
          ) {
            message =
              firstError[0];

          } else if (
            typeof firstError ===
            "string"
          ) {
            message =
              firstError;

          } else if (
            data.detail
          ) {
            message =
              data.detail;
          }

        } catch {
          // Keep fallback.
        }


        setError(
          message
        );

        return;
      }


      showSuccessToast(editingRole ? "Role Updated" : "Role Created", editingRole ? "Role permissions were successfully saved." : "New role was successfully added.");

      closeModal();


      await fetchRoles(
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


  const openDeleteModal = (
    role
  ) => {
    if (
      isCoreSystemRole(
        role
      )
    ) {
      return;
    }


    setDeleteTarget(
      role
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


  const confirmDelete =
    async () => {
      if (
        !deleteTarget
      ) {
        return;
      }


      if (
        isCoreSystemRole(
          deleteTarget
        )
      ) {
        setDeleteError(
          "Core system roles cannot be deleted."
        );

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
            `${ROLES_API}${deleteTarget.id}/`,
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
            "You do not have permission to delete roles."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to delete role.";


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


        showSuccessToast("Role Deleted", "The role was successfully deleted.");

        setDeleteTarget(
          null
        );

        setDeleteError(
          ""
        );


        await fetchRoles(
          search
        );

      } catch (error) {
        console.error(
          "Delete role error:",
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


  const handleSearch = (
    event
  ) => {
    event.preventDefault();


    fetchRoles(
      search
    );
  };


  return (
    <div className="roles-page">

      <style>
        {DELETE_MODAL_CSS}
      </style>


      {/* HEADER */}

      <div className="roles-header">

        <div>

          <button
            type="button"
            className="roles-back"
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
            Roles<PageGuide title="Roles" text="Manage system roles and the permissions assigned to different types of users." />
          </h1>


          <p>
            Manage system roles and
            module permissions.
          </p>

        </div>


        <button
          type="button"
          className="roles-add"
          onClick={
            openAddModal
          }
        >
          <Plus
            size={18}
          />

          Add Role
        </button>

      </div>


      {/* CARD */}

      <div className="roles-card">

        <form
          className="roles-search"
          onSubmit={
            handleSearch
          }
        >

          <Search
            size={18}
          />


          <input
            value={
              search
            }
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              fetchRoles(value);
            }}
            placeholder="Search roles..."
          />


          <button
            type="submit"
          >
            Search
          </button>

        </form>


        {error &&
          !showModal && (

          <div className="roles-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="roles-empty">
            Loading roles...
          </div>

        ) :
        roles.length === 0 ? (

          <div className="roles-empty">
            No roles found.
          </div>

        ) : (

          <div className="roles-table-wrapper">

            <table className="roles-table">

              <thead>

                <tr>
                  <th>
                    Role
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Users
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Manage Users
                  </th>

                  <th>
                    Manage Roles
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>

              </thead>


              <tbody>

                {roles.map(
                  (role) => {

                    const coreRole =
                      isCoreSystemRole(
                        role
                      );


                    return (

                      <tr
                        key={
                          role.id
                        }
                      >

                        <td>

                          <div className="role-name">

                            <span className="role-icon">

                              <ShieldCheck
                                size={17}
                              />

                            </span>


                            <strong>
                              {role.name}
                            </strong>

                          </div>

                        </td>


                        <td>
                          {role.description ||
                            "â€”"}
                        </td>


                        <td>
                          {role.user_count}
                        </td>


                        <td>

                          <span
                            className={
                              role.is_system
                                ? "role-type system"
                                : "role-type custom"
                            }
                          >
                            {role.is_system
                              ? "System"
                              : "Custom"}
                          </span>

                        </td>


                        <td>
                          {role.can_manage_users
                            ? "Yes"
                            : "No"}
                        </td>


                        <td>
                          {role.can_manage_roles
                            ? "Yes"
                            : "No"}
                        </td>


                        <td>

                          <div className="roles-actions">

                            <button
                              type="button"
                              className="role-edit"
                              title="Edit role"
                              onClick={() =>
                                openEditModal(
                                  role
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>


                            {!coreRole && (

                              <button
                                type="button"
                                className="role-delete"
                                title="Delete role"
                                onClick={() =>
                                  openDeleteModal(
                                    role
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

                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* ROLE MODAL */}

      {showModal && (

        <div className="roles-modal-overlay">

          <div className="roles-modal">

            <div className="roles-modal-header">

              <div>

                <h2>
                  {editingRole
                    ? "Edit Role"
                    : "Add Role"}
                </h2>


                <p>
                  Configure module access
                  and management permissions.
                </p>

              </div>


              <button
                type="button"
                className="roles-close"
                onClick={
                  closeModal
                }
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {protectedSystemRole && (

              <div className="core-role-notice">

                <LockKeyhole
                  size={18}
                />


                <div>

                  <strong>
                    Core system role
                  </strong>


                  <div>
                    Required permissions are locked.
                    Additional permissions can still
                    be enabled or disabled.
                  </div>

                </div>

              </div>

            )}


            {error && (

              <div className="roles-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="roles-form-grid">

                <div className="roles-field">

                  <label>
                    Role Name
                  </label>


                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Manager"
                    
                    readOnly={
                      protectedSystemRole
                    }
                  />

                </div>


                <div className="roles-field">

                  <label>
                    Role Type
                  </label>


                  <label
                    className={
                      `roles-checkbox single ${
                        protectedSystemRole
                          ? "locked"
                          : ""
                      }`
                    }
                  >

                    <input
                      type="checkbox"
                      name="is_system"
                      checked={
                        Boolean(
                          form.is_system
                        )
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        protectedSystemRole
                      }
                    />

                    System Role

                  </label>

                </div>


                <div className="roles-field full">

                  <label>
                    Description
                  </label>


                  <textarea
                    name="description"
                    rows="3"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Describe the role..."
                  />

                </div>

              </div>


              <h3 className="roles-section-title">
                Module Access
              </h3>


              <div className="roles-permissions">

                {permissionFields.map(
                  ([
                    field,
                    label,
                  ]) => {

                    const required =
                      isRequiredCorePermission(
                        field
                      );


                    return (

                      <label
                        className={
                          `roles-checkbox ${
                            required
                              ? "locked"
                              : ""
                          }`
                        }
                        key={
                          field
                        }
                      >

                        <input
                          type="checkbox"
                          name={
                            field
                          }
                          checked={
                            Boolean(
                              form[field]
                            )
                          }
                          onChange={
                            handleChange
                          }
                          disabled={
                            required
                          }
                        />


                        <span>
                          {label}
                        </span>

                      </label>

                    );
                  }
                )}

              </div>


              <h3 className="roles-section-title">
                Management Permissions
              </h3>


              <div className="roles-management">

                <label
                  className={
                    `roles-checkbox ${
                      isRequiredCorePermission(
                        "can_manage_users"
                      )
                        ? "locked"
                        : ""
                    }`
                  }
                >

                  <input
                    type="checkbox"
                    name="can_manage_users"
                    checked={
                      Boolean(
                        form.can_manage_users
                      )
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      isRequiredCorePermission(
                        "can_manage_users"
                      )
                    }
                  />

                  Manage Users

                </label>


                <label
                  className={
                    `roles-checkbox ${
                      isRequiredCorePermission(
                        "can_manage_roles"
                      )
                        ? "locked"
                        : ""
                    }`
                  }
                >

                  <input
                    type="checkbox"
                    name="can_manage_roles"
                    checked={
                      Boolean(
                        form.can_manage_roles
                      )
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      isRequiredCorePermission(
                        "can_manage_roles"
                      )
                    }
                  />

                  Manage Roles

                </label>

              </div>


              <div className="roles-modal-actions">

                <button
                  type="button"
                  className="roles-cancel"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="roles-save"
                >
                  {editingRole
                    ? "Save Changes"
                    : "Create Role"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* DELETE MODAL */}

      {deleteTarget && (

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
            aria-labelledby="delete-role-title"
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
              >
                <X
                  size={20}
                />
              </button>

            </div>


            <div className="app-delete-content">

              <h2 id="delete-role-title">
                Delete role?
              </h2>


              <p>
                This will permanently
                delete the role{" "}

                <strong>
                  {
                    deleteTarget.name
                  }
                </strong>

                . This action cannot
                be undone.
              </p>


              <div className="app-delete-record">

                <span>
                  ROLE
                </span>

                <strong>
                  {
                    deleteTarget.name
                  }
                </strong>

                <small>
                  Custom role
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
                  : "Delete Role"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Roles;