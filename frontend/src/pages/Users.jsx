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
  CircleAlert,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import "./Users.css";

import {
  formatDateTime,
} from "../utils/dateFormatter";


const USERS_API =
  apiUrl("/api/access/users/");

const ROLES_API =
  apiUrl("/api/access/roles/");

const TECHNICIANS_API =
  apiUrl("/api/technicians/");


const emptyUserForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role_id: "",
  is_active: true,
};


const emptyTechnicianForm = {
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

  username: "",
  password: "",
  confirm_password: "",
};


function Users() {
  const navigate =
    useNavigate();

  const token =
    localStorage.getItem(
      "token"
    );


  // =====================================================
  // USERS
  // =====================================================

  const [
    users,
    setUsers,
  ] = useState([]);

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


  // =====================================================
  // USER MODAL
  // =====================================================

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingUser,
    setEditingUser,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    emptyUserForm
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  // =====================================================
  // TECHNICIAN MODAL
  // =====================================================

  const [
    showTechnicianModal,
    setShowTechnicianModal,
  ] = useState(false);

  const [
    technicianForm,
    setTechnicianForm,
  ] = useState(
    emptyTechnicianForm
  );

  const [
    technicianError,
    setTechnicianError,
  ] = useState("");

  const [
    technicianSaving,
    setTechnicianSaving,
  ] = useState(false);

  const [
    showTechnicianPassword,
    setShowTechnicianPassword,
  ] = useState(false);


  // =====================================================
  // DELETE
  // =====================================================

  const [
    deleteUser,
    setDeleteUser,
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
  // API ERROR HELPER
  // =====================================================

  const getApiError = (
    data,
    fallback
  ) => {
    if (!data) {
      return fallback;
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


    for (
      const value
      of Object.values(data)
    ) {
      if (
        Array.isArray(value) &&
        value.length > 0
      ) {
        return String(
          value[0]
        );
      }


      if (
        typeof value ===
        "string"
      ) {
        return value;
      }
    }


    return fallback;
  };


  // =====================================================
  // LOAD USERS
  // =====================================================

  const fetchUsers = async (
    searchValue = search
  ) => {
    try {
      setLoading(true);
      setError("");


      const cleanSearch =
        searchValue.trim();


      const url =
        cleanSearch
          ? `${USERS_API}?search=${encodeURIComponent(
              cleanSearch
            )}`
          : USERS_API;


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
          "You do not have permission to manage users."
        );

        return;
      }


      if (!response.ok) {
        throw new Error(
          "Unable to load users."
        );
      }


      const data =
        await response.json();


      setUsers(
        Array.isArray(data)
          ? data
          : data.results || []
      );

    } catch (err) {
      console.error(err);

      setError(
        "Unable to load users."
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // LOAD ROLES
  // =====================================================

  const fetchRoles =
    async () => {
      try {
        const response =
          await fetch(
            ROLES_API,
            {
              headers:
                authHeaders,
            }
          );


        if (!response.ok) {
          return;
        }


        const data =
          await response.json();


        setRoles(
          Array.isArray(data)
            ? data
            : data.results || []
        );

      } catch (err) {
        console.error(err);
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

    fetchUsers("");
    fetchRoles();
  }, []);


  // =====================================================
  // NORMAL USER FORM
  // =====================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm(
      (previous) => ({
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };


  const openAddModal =
    () => {
      setEditingUser(
        null
      );

      setForm(
        emptyUserForm
      );

      setError("");

      setShowPassword(
        false
      );

      setShowModal(
        true
      );
    };


  const openEditModal = (
    user
  ) => {
    setEditingUser(
      user
    );


    setForm({
      username:
        user.username ||
        "",

      first_name:
        user.first_name ||
        "",

      last_name:
        user.last_name ||
        "",

      email:
        user.email ||
        "",

      password:
        "",

      role_id:
        user.role?.id ||
        "",

      is_active:
        Boolean(
          user.is_active
        ),
    });


    setError("");

    setShowPassword(
      false
    );

    setShowModal(
      true
    );
  };


  const closeModal = () => {
    setShowModal(
      false
    );

    setEditingUser(
      null
    );

    setForm(
      emptyUserForm
    );

    setError("");

    setShowPassword(
      false
    );
  };


  // =====================================================
  // SAVE NORMAL USER
  // =====================================================

  const handleSave = async (
    event
  ) => {
    event.preventDefault();




    const selectedRole =
      roles.find(
        (role) =>
          String(role.id) ===
          String(form.role_id)
      );


    if (
      selectedRole?.name
        ?.toLowerCase() ===
      "technician"
    ) {
      setError(
        "Technician accounts must be created using New Technician."
      );

      return;
    }


    const editing =
      Boolean(
        editingUser
      );


    const url =
      editing
        ? `${USERS_API}${editingUser.id}/`
        : USERS_API;


    const payload = {
      username:
        form.username.trim(),

      first_name:
        form.first_name.trim(),

      last_name:
        form.last_name.trim(),

      email:
        form.email.trim(),

      role_id:
        form.role_id
          ? Number(
              form.role_id
            )
          : null,

      is_active:
        form.is_active,
    };


    if (
      form.password
    ) {
      payload.password =
        form.password;
    }


    try {
      setError("");


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
        logout();
        return;
      }


      if (
        response.status === 403
      ) {
        setError(
          "You do not have permission to manage users."
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
          getApiError(
            data,
            "Unable to save user."
          )
        );

        return;
      }


      showSuccessToast(editingUser ? "User Updated" : "User Created", editingUser ? "User information was successfully saved." : "New user was successfully added.");

      closeModal();

      await fetchUsers(
        search
      );

    } catch (err) {
      console.error(err);

      setError(
        "Unable to connect to the server."
      );
    }
  };


  // =====================================================
  // NEW TECHNICIAN
  // =====================================================

  const openTechnicianModal =
    () => {
      setTechnicianForm(
        emptyTechnicianForm
      );

      setTechnicianError(
        ""
      );

      setShowTechnicianPassword(
        false
      );

      setShowTechnicianModal(
        true
      );
    };


  const closeTechnicianModal =
    () => {
      if (
        technicianSaving
      ) {
        return;
      }


      setShowTechnicianModal(
        false
      );

      setTechnicianForm(
        emptyTechnicianForm
      );

      setTechnicianError(
        ""
      );

      setShowTechnicianPassword(
        false
      );
    };


  const handleTechnicianChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;


    setTechnicianForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    if (
      technicianError
    ) {
      setTechnicianError(
        ""
      );
    }
  };


  // =====================================================
  // CREATE TECHNICIAN + LOGIN ACCOUNT
  // =====================================================

  const handleTechnicianSave =
    async (
      event
    ) => {
      event.preventDefault();














      if (
        technicianForm.password !==
        technicianForm
          .confirm_password
      ) {
        setTechnicianError(
          "Passwords do not match."
        );

        return;
      }


      const hourlyRate =
        Number(
          technicianForm
            .hourly_rate ||
          0
        );


      if (
        Number.isNaN(
          hourlyRate
        ) ||
        hourlyRate < 0
      ) {
        setTechnicianError(
          "Hourly rate must be a valid positive number."
        );

        return;
      }


      const payload = {
        employee_id:
          technicianForm
            .employee_id
            .trim(),

        first_name:
          technicianForm
            .first_name
            .trim(),

        last_name:
          technicianForm
            .last_name
            .trim(),

        email:
          technicianForm
            .email
            .trim(),

        phone:
          technicianForm
            .phone
            .trim(),

        specialization:
          technicianForm
            .specialization
            .trim(),

        hourly_rate:
          hourlyRate,

        hire_date:
          technicianForm
            .hire_date ||
          null,

        status:
          technicianForm
            .status,

        notes:
          technicianForm
            .notes
            .trim(),

        username:
          technicianForm
            .username
            .trim(),

        password:
          technicianForm
            .password,

        confirm_password:
          technicianForm
            .confirm_password,
      };


      try {
        setTechnicianSaving(
          true
        );

        setTechnicianError(
          ""
        );


        const response =
          await fetch(
            TECHNICIANS_API,
            {
              method:
                "POST",

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
          setTechnicianError(
            "You do not have permission to create technicians."
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


        if (
          !response.ok
        ) {
          setTechnicianError(
            getApiError(
              data,
              "Unable to create technician."
            )
          );

          return;
        }


        setShowTechnicianModal(
          false
        );

        setTechnicianForm(
          emptyTechnicianForm
        );

        setTechnicianError(
          ""
        );


        await fetchUsers(
          search
        );

      } catch (err) {
        console.error(
          "Technician creation error:",
          err
        );


        setTechnicianError(
          "Unable to connect to the DEV server."
        );

      } finally {
        setTechnicianSaving(
          false
        );
      }
    };


  // =====================================================
  // DELETE USER
  // =====================================================

  const openDeleteModal = (
    user
  ) => {
    setDeleteUser(
      user
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


      setDeleteUser(
        null
      );

      setDeleteError(
        ""
      );
    };


  const confirmDelete =
    async () => {
      if (
        !deleteUser
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
            `${USERS_API}${deleteUser.id}/`,
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
            "You do not have permission to delete this user."
          );

          return;
        }


        if (
          !response.ok
        ) {
          let data = {};

          try {
            data =
              await response.json();
          } catch {
            data = {};
          }


          setDeleteError(
            getApiError(
              data,
              "Unable to delete user."
            )
          );

          return;
        }


        showSuccessToast("User Deleted", "The user was successfully deleted.");

        setDeleteUser(
          null
        );

        setDeleteError(
          ""
        );


        await fetchUsers(
          search
        );

      } catch (err) {
        console.error(err);

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

    fetchUsers(
      search
    );
  };


  // =====================================================
  // NON-TECHNICIAN ROLES
  // =====================================================

  const standardRoles =
    roles.filter(
      (role) =>
        role.name
          ?.toLowerCase() !==
        "technician"
    );


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="users-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="users-header">

        <div>

          <button
            type="button"
            className="users-back"
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
            Users<PageGuide title="Users" text="Manage user accounts, access, roles, and account status." />
          </h1>


          <p>
            Manage user accounts,
            administrators, and
            technician login accounts.
          </p>

        </div>


        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >

          <button
            type="button"
            className="users-add"
            onClick={
              openTechnicianModal
            }
          >
            <Plus
              size={18}
            />

            New Technician
          </button>


          <button
            type="button"
            className="users-add"
            onClick={
              openAddModal
            }
          >
            <Plus
              size={18}
            />

            Add User
          </button>

        </div>

      </div>


      {/* =================================================
          USER LIST
      ================================================= */}

      <div className="users-card">

        <form
          className="users-search"
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
              fetchUsers(value);
            }}
            placeholder="Search users..."
          />


          <button
            type="submit"
          >
            Search
          </button>

        </form>


        {error &&
          !showModal && (

          <div className="users-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="users-empty">
            Loading users...
          </div>

        ) :
        users.length === 0 ? (

          <div className="users-empty">
            No users found.
          </div>

        ) : (

          <div className="users-table-wrapper">

            <table className="users-table">

              <thead>

                <tr>
                  <th>
                    User
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Last Login
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>

              </thead>


              <tbody>

                {users.map(
                  (user) => (

                    <tr
                      key={
                        user.id
                      }
                    >

                      <td>

                        <div className="user-cell">

                          <div className="user-avatar">

                            {user.username
                              .charAt(0)
                              .toUpperCase()}

                          </div>


                          <div>

                            <strong>

                              {user.first_name ||
                              user.last_name
                                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                : user.username}

                            </strong>


                            <small>
                              @{user.username}
                            </small>

                          </div>

                        </div>

                      </td>


                      <td>
                        {user.email || "â€”"}
                      </td>


                      <td>

                        <span className="user-role">

                          {user.is_superuser
                            ? "Super Admin"
                            : user.role?.name ||
                              "No Role"}

                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            user.is_active
                              ? "user-status active"
                              : "user-status inactive"
                          }
                        >

                          {user.is_active
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>


                      <td>

                        {user.last_login
                          ? formatDateTime(
                              user.last_login
                            )
                          : "Never"}

                      </td>


                      <td>

                        <div className="users-actions">

                          <button
                            type="button"
                            className="user-edit"
                            onClick={() =>
                              openEditModal(
                                user
                              )
                            }
                            title="Edit user"
                          >
                            <Pencil
                              size={16}
                            />
                          </button>


                          {!user.is_superuser && (

                            <button
                              type="button"
                              className="user-delete"
                              onClick={() =>
                                openDeleteModal(
                                  user
                                )
                              }
                              title="Delete user"
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


      {/* =================================================
          NORMAL USER MODAL
      ================================================= */}

      {showModal && (

        <div className="users-modal-overlay">

          <div className="users-modal">

            <div className="users-modal-header">

              <div>

                <h2>
                  {editingUser
                    ? "Edit User"
                    : "Add User"}
                </h2>


                <p>
                  Account information
                  and assigned role.
                </p>

              </div>


              <button
                type="button"
                className="users-close"
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

              <div className="users-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="users-form-grid">


                <div className="users-field">

                  <label>
                    Username
                  </label>


                  <input
                    name="username"
                    value={
                      form.username
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="users-field">

                  <label>
                    Password
                     (optional)
                  </label>


                  <div className="users-password-container">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        form.password
                      }
                      onChange={
                        handleChange
                      }
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current password"
                          : "Enter password"
                      }
                    />


                    <button
                      type="button"
                      className="users-password-eye"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                    >

                      {showPassword ? (
                        <EyeOff
                          size={20}
                        />
                      ) : (
                        <Eye
                          size={20}
                        />
                      )}

                    </button>

                  </div>

                </div>


                <div className="users-field">

                  <label>
                    First Name
                  </label>


                  <input
                    name="first_name"
                    value={
                      form.first_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="users-field">

                  <label>
                    Last Name
                  </label>


                  <input
                    name="last_name"
                    value={
                      form.last_name
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="users-field">

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


                <div className="users-field">

                  <label>
                    Role
                  </label>


                  <select
                    name="role_id"
                    value={
                      form.role_id
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      No Role
                    </option>


                    {standardRoles.map(
                      (role) => (

                        <option
                          key={
                            role.id
                          }
                          value={
                            role.id
                          }
                        >
                          {role.name}
                        </option>

                      )
                    )}

                  </select>


                  <small
                    style={{
                      marginTop: "6px",
                      color: "#84909c",
                      fontSize: "11px",
                    }}
                  >
                    Technician accounts
                    are created using
                    New Technician.
                  </small>

                </div>


                <div className="users-field full">

                  <label className="users-checkbox">

                    <input
                      type="checkbox"
                      name="is_active"
                      checked={
                        form.is_active
                      }
                      onChange={
                        handleChange
                      }
                    />

                    Account is active

                  </label>

                </div>

              </div>


              <div className="users-modal-actions">

                <button
                  type="button"
                  className="users-cancel"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="users-save"
                >
                  {editingUser
                    ? "Save Changes"
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          NEW TECHNICIAN MODAL
      ================================================= */}

      {showTechnicianModal && (

        <div className="users-modal-overlay">

          <div className="users-modal">

            <div className="users-modal-header">

              <div>

                <h2>
                  New Technician
                </h2>


                <p>
                  Create the technician
                  profile and login
                  account together.
                </p>

              </div>


              <button
                type="button"
                className="users-close"
                onClick={
                  closeTechnicianModal
                }
                disabled={
                  technicianSaving
                }
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {technicianError && (

              <div className="users-error">

                <CircleAlert
                  size={16}
                />

                <span>
                  {technicianError}
                </span>

              </div>

            )}


            <form
              onSubmit={
                handleTechnicianSave
              }
            >

              <div className="users-form-grid">


                {/* ACCOUNT */}

                <div className="users-field full">

                  <div
                    style={{
                      paddingBottom: "8px",
                      borderBottom:
                        "1px solid #e5eaf0",
                      color: "#8b5cf6",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.04em",
                    }}
                  >
                    Login Account (Optional)
                  </div>

                </div>


                <div className="users-field">

                  <label>
                    Username
                  </label>


                  <input
                    type="text"
                    name="username"
                    value={
                      technicianForm
                        .username
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Example: juandelacruz"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Role
                  </label>


                  <input
                    type="text"
                    value="Technician"
                    disabled
                  />

                </div>


                <div className="users-field">

                  <label>
                    Password
                  </label>


                  <div className="users-password-container">

                    <input
                      type={
                        showTechnicianPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={
                        technicianForm
                          .password
                      }
                      onChange={
                        handleTechnicianChange
                      }
                      placeholder="Enter password"
                    />


                    <button
                      type="button"
                      className="users-password-eye"
                      onClick={() =>
                        setShowTechnicianPassword(
                          (previous) =>
                            !previous
                        )
                      }
                    >

                      {showTechnicianPassword ? (
                        <EyeOff
                          size={20}
                        />
                      ) : (
                        <Eye
                          size={20}
                        />
                      )}

                    </button>

                  </div>

                </div>


                <div className="users-field">

                  <label>
                    Confirm Password
                  </label>


                  <input
                    type={
                      showTechnicianPassword
                        ? "text"
                        : "password"
                    }
                    name="confirm_password"
                    value={
                      technicianForm
                        .confirm_password
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Re-enter password"
                  />

                </div>


                {/* TECHNICIAN INFORMATION */}

                <div className="users-field full">

                  <div
                    style={{
                      marginTop: "5px",
                      paddingBottom: "8px",
                      borderBottom:
                        "1px solid #e5eaf0",
                      color: "#8b5cf6",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.04em",
                    }}
                  >
                    Technician Information
                  </div>

                </div>


                <div className="users-field">

                  <label>
                    Employee ID
                  </label>


                  <input
                    type="text"
                    name="employee_id"
                    value={
                      technicianForm
                        .employee_id
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Example: TECH-02"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Status
                  </label>


                  <select
                    name="status"
                    value={
                      technicianForm
                        .status
                    }
                    onChange={
                      handleTechnicianChange
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


                <div className="users-field">

                  <label>
                    First Name
                  </label>


                  <input
                    type="text"
                    name="first_name"
                    value={
                      technicianForm
                        .first_name
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="First name"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Last Name
                  </label>


                  <input
                    type="text"
                    name="last_name"
                    value={
                      technicianForm
                        .last_name
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Last name"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Email
                  </label>


                  <input
                    type="email"
                    name="email"
                    value={
                      technicianForm
                        .email
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="technician@example.com"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Phone
                  </label>


                  <input
                    type="text"
                    name="phone"
                    value={
                      technicianForm
                        .phone
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Phone number"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Specialization
                  </label>


                  <input
                    type="text"
                    name="specialization"
                    value={
                      technicianForm
                        .specialization
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Example: HVAC, Networking"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Hourly Rate
                  </label>


                  <input
                    type="number"
                    name="hourly_rate"
                    min="0"
                    step="0.01"
                    value={
                      technicianForm
                        .hourly_rate
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="0.00"
                  />

                </div>


                <div className="users-field">

                  <label>
                    Hire Date
                  </label>


                  <input
                    type="date"
                    name="hire_date"
                    value={
                      technicianForm
                        .hire_date
                    }
                    onChange={
                      handleTechnicianChange
                    }
                  />

                </div>


                <div className="users-field full">

                  <label>
                    Notes
                  </label>


                  <textarea
                    name="notes"
                    rows="4"
                    value={
                      technicianForm
                        .notes
                    }
                    onChange={
                      handleTechnicianChange
                    }
                    placeholder="Skills, certifications, availability, or internal notes..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      resize: "vertical",
                      border:
                        "1px solid #d3dce4",
                      borderRadius:
                        "7px",
                      fontFamily:
                        "inherit",
                      fontSize:
                        "14px",
                      outline: "none",
                    }}
                  />

                </div>

              </div>


              <div className="users-modal-actions">

                <button
                  type="button"
                  className="users-cancel"
                  onClick={
                    closeTechnicianModal
                  }
                  disabled={
                    technicianSaving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="users-save"
                  disabled={
                    technicianSaving
                  }
                >

                  {technicianSaving
                    ? "Creating..."
                    : "Create Technician"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          DELETE USER MODAL
      ================================================= */}

      {deleteUser && (

        <div
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
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background:
              "rgba(15, 23, 42, 0.48)",
            backdropFilter:
              "blur(2px)",
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            style={{
              width: "100%",
              maxWidth: "520px",
              overflow: "hidden",
              background:
                "#ffffff",
              border:
                "1px solid #e2e8f0",
              borderRadius:
                "18px",
              boxShadow:
                "0 24px 60px rgba(15, 23, 42, 0.20)",
            }}
          >

            <div
              style={{
                padding:
                  "26px 28px 0",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-start",
                  justifyContent:
                    "space-between",
                  gap: "16px",
                }}
              >

                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    flexShrink: 0,
                    borderRadius:
                      "14px",
                    background:
                      "#fff1f2",
                    color:
                      "#dc2626",
                  }}
                >
                  <Trash2
                    size={24}
                  />
                </div>


                <button
                  type="button"
                  onClick={
                    closeDeleteModal
                  }
                  disabled={
                    deleteLoading
                  }
                  style={{
                    width: "38px",
                    height: "38px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "9px",
                    background:
                      "#ffffff",
                    color:
                      "#64748b",
                    cursor:
                      deleteLoading
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <X
                    size={19}
                  />
                </button>

              </div>

            </div>


            <div
              style={{
                padding:
                  "20px 28px 26px",
              }}
            >

              <h2
                id="delete-user-title"
                style={{
                  margin:
                    "0 0 10px",
                  color:
                    "#172b3d",
                  fontSize:
                    "22px",
                }}
              >
                Delete user?
              </h2>


              <p
                style={{
                  margin: 0,
                  color:
                    "#64748b",
                  fontSize:
                    "14px",
                  lineHeight:
                    1.65,
                }}
              >
                This will permanently
                delete{" "}

                <strong
                  style={{
                    color:
                      "#172b3d",
                  }}
                >
                  {deleteUser.username}
                </strong>

                . This action cannot be
                undone.
              </p>


              {deleteError && (

                <div
                  style={{
                    marginTop:
                      "16px",
                    padding:
                      "12px 14px",
                    display: "flex",
                    gap: "8px",
                    background:
                      "#fff1f2",
                    border:
                      "1px solid #fecaca",
                    borderRadius:
                      "9px",
                    color:
                      "#b91c1c",
                    fontSize:
                      "13px",
                  }}
                >
                  <CircleAlert
                    size={17}
                  />

                  <span>
                    {deleteError}
                  </span>
                </div>

              )}

            </div>


            <div
              style={{
                padding:
                  "18px 28px",
                display: "flex",
                justifyContent:
                  "center",
                gap: "10px",
                background:
                  "#f8fafc",
                borderTop:
                  "1px solid #e2e8f0",
              }}
            >

              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deleteLoading
                }
                style={{
                  minHeight:
                    "42px",
                  padding:
                    "0 18px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius:
                    "9px",
                  background:
                    "#ffffff",
                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  confirmDelete
                }
                disabled={
                  deleteLoading
                }
                style={{
                  minHeight:
                    "42px",
                  padding:
                    "0 18px",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: "7px",
                  border:
                    "1px solid #dc2626",
                  borderRadius:
                    "9px",
                  background:
                    "#dc2626",
                  color:
                    "#ffffff",
                  fontWeight:
                    700,
                  cursor:
                    "pointer",
                }}
              >

                <Trash2
                  size={16}
                />

                {deleteLoading
                  ? "Deleting..."
                  : "Delete User"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Users;