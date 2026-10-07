import { showSuccessToast } from "../components/SuccessToast";
import { apiUrl } from "../config/api";
import PageGuide from "../components/PageGuide";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Monitor,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import "./Equipment.css";


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


const EQUIPMENT_API =
  apiUrl("/api/equipment/");

const NEXT_ASSET_TAG_API =
  apiUrl("/api/equipment/next-asset-tag/");

const CUSTOMERS_API =
  apiUrl("/api/customers/");

const LOCATIONS_API =
  apiUrl("/api/locations/");

const PERMISSIONS_API =
  apiUrl("/api/access/me/permissions/");


function Equipment() {
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
    equipment,
    setEquipment,
  ] = useState([]);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    locations,
    setLocations,
  ] = useState([]);


  // =====================================================
  // ROLE / PERMISSIONS
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


  const canManageEquipment =
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
    filters,
    setFilters,
  ] = useState({
    customer: "",
    location: "",
    equipment_type: "",
    status: "",
    ownership_type: "",
  });

  const [
    knownEquipmentTypes,
    setKnownEquipmentTypes,
  ] = useState([]);


  const [
    sortConfig,
    setSortConfig,
  ] = useState({
    key: "asset_tag",
    direction: "asc",
  });

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
    editingEquipment,
    setEditingEquipment,
  ] = useState(null);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState("");


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
    location: "",
    equipment_name: "",
    equipment_type: "",
    manufacturer: "",
    model_number: "",
    serial_number: "",
    asset_tag: "",
    installation_date: "",
    ownership_type: "owned",
    lease_provider: "",
    lease_end_date: "",
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
          logout();
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
    async () => {
      try {
        const response =
          await fetch(
            LOCATIONS_API,
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
      }
    };


  // =====================================================
  // LOAD EQUIPMENT
  // =====================================================

  const fetchEquipment =
    async (
      searchValue = search,
      filterValues = filters
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

        const params =
          new URLSearchParams();

        if (cleanSearch) {
          params.set(
            "search",
            cleanSearch
          );
        }

        Object.entries(
          filterValues || {}
        ).forEach(
          ([key, value]) => {
            if (
              String(value || "").trim()
            ) {
              params.set(
                key,
                String(value).trim()
              );
            }
          }
        );

        const url =
          params.toString()
            ? `${EQUIPMENT_API}?${params.toString()}`
            : EQUIPMENT_API;


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
            "Unable to load equipment."
          );
        }


        const data =
          await response.json();


        const nextEquipment =
          Array.isArray(data)
            ? data
            : data.results || [];

        setEquipment(
          nextEquipment
        );

        setKnownEquipmentTypes(
          (previous) => {
            const merged = new Set(
              previous
            );

            nextEquipment.forEach(
              (item) => {
                const value = String(
                  item.equipment_type || ""
                ).trim();

                if (value) {
                  merged.add(value);
                }
              }
            );

            return Array.from(merged)
              .sort((a, b) =>
                a.localeCompare(
                  b,
                  undefined,
                  {
                    numeric: true,
                    sensitivity: "base",
                  }
                )
              );
          }
        );

      } catch (error) {
        console.error(
          error
        );


        setError(
          "Unable to load equipment."
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
        // No need to load create/edit dropdown data.

        if (
          normalized !==
          "technician"
        ) {
          await Promise.all([
            fetchCustomers(),
            fetchLocations(),
          ]);
        }


        await fetchEquipment(
          ""
        );
      };


    initializePage();

  }, []);


  // =====================================================
  // FILTER LOCATIONS
  // =====================================================

  const filteredLocations =
    useMemo(() => {
      if (
        !selectedCustomer
      ) {
        return [];
      }


      return (
        locations.filter(
          (location) =>
            String(
              location.customer
            ) ===
            String(
              selectedCustomer
            )
        )
      );

    }, [
      locations,
      selectedCustomer,
    ]);


  useEffect(() => {
    const state = routeLocation.state;

    if (
      !state?.openAddEquipment ||
      !permissionsLoaded ||
      !canManageEquipment ||
      !customers.length ||
      !locations.length
    ) {
      return;
    }

    openAddModal({
      customerId: state.customerId,
      locationId: state.locationId,
    });

    // Consume the navigation state so refresh/close does not reopen the form.
    navigate(routeLocation.pathname, { replace: true, state: null });
  }, [
    routeLocation.state,
    routeLocation.pathname,
    permissionsLoaded,
    canManageEquipment,
    customers.length,
    locations.length,
  ]);


  const filterLocationOptions =
    useMemo(() => {
      if (!filters.customer) {
        return locations;
      }

      return locations.filter(
        (item) =>
          String(item.customer) ===
          String(filters.customer)
      );
    }, [
      locations,
      filters.customer,
    ]);


  // =====================================================
  // NEXT ASSET TAG
  // =====================================================

  const fetchNextAssetTag =
    async () => {
      try {
        const response =
          await fetch(
            NEXT_ASSET_TAG_API,
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
          return "";
        }

        const data =
          await response.json();

        return (
          data.asset_tag || ""
        );

      } catch (error) {
        console.error(
          "Asset tag generation error:",
          error
        );

        return "";
      }
    };


  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddModal = (context = {}) => {
    if (!canManageEquipment) {
      return;
    }

    const customerId = context.customerId ? String(context.customerId) : "";
    const locationId = context.locationId ? String(context.locationId) : "";

    setEditingEquipment(null);
    setSelectedCustomer(customerId);
    setForm({
      ...emptyForm,
      location: locationId,
      asset_tag: "",
    });
    setError("");
    setShowModal(true);
  };


  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = (
    item
  ) => {
    if (
      !canManageEquipment
    ) {
      return;
    }


    setEditingEquipment(
      item
    );


    setSelectedCustomer(
      String(
        item.customer || ""
      )
    );


    setForm({
      location:
        item.location || "",

      equipment_name:
        item.equipment_name || "",

      equipment_type:
        item.equipment_type || "",

      manufacturer:
        item.manufacturer || "",

      model_number:
        item.model_number || "",

      serial_number:
        item.serial_number || "",

      asset_tag:
        item.asset_tag || "",

      installation_date:
        item.installation_date || "",

      ownership_type:
        item.ownership_type || "owned",

      lease_provider:
        item.lease_provider || "",

      lease_end_date:
        item.lease_end_date || "",

      status:
        item.status || "active",

      notes:
        item.notes || "",
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

  const closeModal = () => {
    setShowModal(
      false
    );

    setEditingEquipment(
      null
    );

    setSelectedCustomer(
      ""
    );

    setForm(
      emptyForm
    );

    setError(
      ""
    );
  };


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
      (previous) => {
        const next = {
          ...previous,
          [name]: value,
        };

        if (name === "ownership_type" && value !== "leased") {
          next.lease_provider = "";
          next.lease_end_date = "";
        }

        return next;
      }
    );
  };


  const handleCustomerChange = (
    event
  ) => {
    setSelectedCustomer(
      event.target.value
    );


    setForm(
      (previous) => ({
        ...previous,
        location: "",
      })
    );
  };



  const findDuplicateAssetTag =
    async (
      assetTag,
      ignoreId = null
    ) => {
      const cleanTag =
        String(
          assetTag || ""
        ).trim();

      if (!cleanTag) {
        return null;
      }

      const response =
        await fetch(
          `${EQUIPMENT_API}?search=${encodeURIComponent(cleanTag)}`,
          {
            headers:
              authHeaders,
          }
        );

      if (
        response.status === 401
      ) {
        logout();
        return null;
      }

      if (!response.ok) {
        return null;
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

      return (
        rows.find(
          (item) =>
            String(
              item.asset_tag || ""
            )
              .trim()
              .toLowerCase()
            ===
            cleanTag.toLowerCase()
            &&
            (
              !ignoreId
              ||
              String(item.id)
              !== String(ignoreId)
            )
        )
        || null
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
      !canManageEquipment
    ) {
      setError(
        "You do not have permission to modify equipment."
      );

      return;
    }




    const editing =
      Boolean(
        editingEquipment
      );


    const url =
      editing
        ? `${EQUIPMENT_API}${editingEquipment.id}/`
        : EQUIPMENT_API;


    try {
      setError(
        ""
      );


      const duplicateAsset =
        await findDuplicateAssetTag(
          form.asset_tag,
          editingEquipment?.id
        );


      if (duplicateAsset) {
        setError(
          `Duplicate Asset Tag warning: ${form.asset_tag} is already assigned to ${duplicateAsset.equipment_name || "another equipment record"}. Please use a different Asset Tag.`
        );

        return;
      }


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
              JSON.stringify({
                ...form,

                location:
                  form.location
                    ? Number(form.location)
                    : null,

                installation_date:
                  form.installation_date ||
                  null,

                lease_provider:
                  form.ownership_type === "leased"
                    ? form.lease_provider
                    : "",

                lease_end_date:
                  form.ownership_type === "leased"
                    ? form.lease_end_date || null
                    : null,
              }),
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
          "You do not have permission to modify equipment."
        );

        return;
      }


      if (!response.ok) {
        let message =
          "Unable to save equipment.";


        try {
          const data =
            await response.json();


          if (data.detail || data.message) {
            message = data.detail || data.message;
          } else if (data && typeof data === "object") {
            const fieldMessages = Object.entries(data)
              .flatMap(([field, value]) => {
                const messages = Array.isArray(value) ? value : [value];
                return messages.map((item) =>
                  `${field.replaceAll("_", " ")}: ${String(item)}`
                );
              })
              .filter(Boolean);

            if (fieldMessages.length) {
              message = fieldMessages.join(" ");
            }
          }

        } catch {
          // Keep fallback.
        }


        setError(
          message
        );

        return;
      }


      showSuccessToast(editingEquipment ? "Equipment Updated" : "Equipment Created", editingEquipment ? "Equipment information was successfully saved." : "New equipment was successfully added.");

      closeModal();


      await fetchEquipment(
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
    item
  ) => {
    if (
      !canManageEquipment
    ) {
      return;
    }


    setDeleteTarget(
      item
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
        !canManageEquipment
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
            `${EQUIPMENT_API}${deleteTarget.id}/`,
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
            "You do not have permission to delete equipment."
          );

          return;
        }


        if (!response.ok) {
          let message =
            "Unable to delete equipment.";


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


        showSuccessToast("Equipment Deleted", "The equipment was successfully deleted.");

        setDeleteTarget(
          null
        );

        setDeleteError(
          ""
        );


        await fetchEquipment(
          search
        );

      } catch (error) {
        console.error(
          "Delete equipment error:",
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
  // SORT
  // =====================================================

  const handleSort = (key) => {
    setSortConfig((previous) => ({
      key,
      direction:
        previous.key === key &&
        previous.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };


  const sortedEquipment =
    useMemo(() => {
      if (!sortConfig.key) {
        return equipment;
      }


      const sorted = [
        ...equipment,
      ];


      sorted.sort((a, b) => {
        let aValue = "";
        let bValue = "";


        if (
          sortConfig.key ===
          "equipment_name"
        ) {
          aValue =
            a.equipment_name || "";
          bValue =
            b.equipment_name || "";

        } else if (
          sortConfig.key ===
          "customer"
        ) {
          aValue =
            a.customer_name || "";
          bValue =
            b.customer_name || "";

        } else if (
          sortConfig.key ===
          "location"
        ) {
          aValue =
            a.location_name || "";
          bValue =
            b.location_name || "";

        } else if (
          sortConfig.key ===
          "equipment_type"
        ) {
          aValue =
            a.equipment_type || "";
          bValue =
            b.equipment_type || "";

        } else if (
          sortConfig.key ===
          "manufacturer"
        ) {
          aValue =
            a.manufacturer || "";
          bValue =
            b.manufacturer || "";

        } else if (
          sortConfig.key ===
          "model_number"
        ) {
          aValue =
            a.model_number || "";
          bValue =
            b.model_number || "";

        } else if (
          sortConfig.key ===
          "asset_tag"
        ) {
          aValue =
            a.asset_tag || "";
          bValue =
            b.asset_tag || "";

        } else if (
          sortConfig.key ===
          "ownership_type"
        ) {
          aValue =
            a.ownership_type || "";
          bValue =
            b.ownership_type || "";

        } else if (
          sortConfig.key ===
          "status"
        ) {
          aValue =
            a.status || "";
          bValue =
            b.status || "";
        }


        const aBlank =
          !String(aValue).trim();

        const bBlank =
          !String(bValue).trim();


        if (aBlank && !bBlank) {
          return 1;
        }

        if (!aBlank && bBlank) {
          return -1;
        }


        const comparison =
          String(aValue)
            .localeCompare(
              String(bValue),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              }
            );


        return (
          sortConfig.direction ===
          "asc"
            ? comparison
            : -comparison
        );
      });


      return sorted;
    }, [
      equipment,
      sortConfig,
    ]);


  const renderSortHeader = (
    label,
    key
  ) => {
    const active =
      sortConfig.key === key;


    return (
      <button
        type="button"
        onClick={() =>
          handleSort(key)
        }
        title={`Sort by ${label}`}
        aria-label={`Sort by ${label}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: 0,
          border: 0,
          background: "transparent",
          color: "inherit",
          font: "inherit",
          fontWeight: "inherit",
          cursor: "pointer",
        }}
      >
        <span>{label}</span>

        {active ? (
          sortConfig.direction ===
          "asc" ? (
            <ChevronUp
              size={14}
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              size={14}
              aria-hidden="true"
            />
          )
        ) : (
          <ArrowUpDown
            size={14}
            aria-hidden="true"
          />
        )}
      </button>
    );
  };


  const updateFilter = (
    name,
    value
  ) => {
    const nextFilters = {
      ...filters,
      [name]: value,
    };

    if (name === "customer") {
      nextFilters.location = "";
    }

    setFilters(
      nextFilters
    );

    fetchEquipment(
      search,
      nextFilters
    );
  };


  const resetFilters = () => {
    const cleared = {
      customer: "",
      location: "",
      equipment_type: "",
      status: "",
      ownership_type: "",
    };

    setFilters(cleared);
    setSearch("");
    fetchEquipment(
      "",
      cleared
    );
  };


  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (
    event
  ) => {
    event.preventDefault();


    fetchEquipment(
      search,
      filters
    );
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="equipment-page">

      <style>
        {DELETE_MODAL_CSS}
      </style>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="equipment-header">

        <div>

          <button
            type="button"
            className="equipment-back"
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
            Equipment<PageGuide title="Equipment" text="Track equipment assigned to customers and locations, including ownership, rental or lease information, identifiers, dates, and status." />
          </h1>


          <p>
            {isTechnician
              ? "View equipment related to your assigned service tickets."
              : (
                "Manage customer equipment, Asset Tags, "
                + "serial numbers, locations, and status."
              )}
          </p>

        </div>


        {canManageEquipment && (

          <button
            type="button"
            className="add-equipment-btn"
            onClick={
              () => openAddModal()
            }
          >
            <Plus
              size={18}
            />

            Add Equipment
          </button>

        )}

      </div>


      {/* =================================================
          CARD
      ================================================= */}

      <div className="equipment-card">


        <form
          className="equipment-search"
          onSubmit={
            handleSearch
          }
        >
          <Search
            size={18}
          />


          <input
            placeholder="Search equipment, Asset Tag, serial/MAC, customer..."
            value={
              search
            }
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              fetchEquipment(
                value,
                filters
              );
            }}
          />


          <button
            type="submit"
          >
            Search
          </button>

        </form>


        <div className="equipment-filters">

          {!isTechnician && (
            <select
              value={filters.customer}
              onChange={(event) =>
                updateFilter(
                  "customer",
                  event.target.value
                )
              }
              aria-label="Filter by customer"
            >
              <option value="">All customers</option>
              {customers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.company_name || item.contact_name || `Customer #${item.id}`}
                </option>
              ))}
            </select>
          )}

          {!isTechnician && (
            <select
              value={filters.location}
              onChange={(event) =>
                updateFilter(
                  "location",
                  event.target.value
                )
              }
              aria-label="Filter by location"
            >
              <option value="">All locations</option>
              {filterLocationOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.location_name || `Location #${item.id}`}
                </option>
              ))}
            </select>
          )}

          <select
            value={filters.equipment_type}
            onChange={(event) =>
              updateFilter(
                "equipment_type",
                event.target.value
              )
            }
            aria-label="Filter by equipment type"
          >
            <option value="">All equipment types</option>
            {knownEquipmentTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                "status",
                event.target.value
              )
            }
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_service">Out of Service</option>
          </select>

          <select
            value={filters.ownership_type}
            onChange={(event) =>
              updateFilter(
                "ownership_type",
                event.target.value
              )
            }
            aria-label="Filter by ownership"
          >
            <option value="">All ownership</option>
            <option value="owned">Owned</option>
            <option value="leased">Leased</option>
            <option value="rented">Rented</option>
          </select>

          <button
            type="button"
            className="equipment-reset-filters"
            onClick={resetFilters}
          >
            <RotateCcw size={14} />
            Reset
          </button>

        </div>


        {error &&
          !showModal && (

          <div className="equipment-error">
            {error}
          </div>

        )}


        {loading ? (

          <div className="equipment-empty">
            Loading equipment...
          </div>

        ) :
        equipment.length === 0 ? (

          <div className="equipment-empty">

            <Monitor
              size={45}
            />


            <h3>
              No equipment found
            </h3>


            <p>
              {isTechnician
                ? (
                  "No equipment is currently linked "
                  + "to your assigned tickets."
                )
                : (
                  "Add equipment to a customer location."
                )}
            </p>

          </div>

        ) : (

          <div className="equipment-table-wrapper">

            <table className="equipment-table">

              <thead>

                <tr>
                  <th>
                    {renderSortHeader(
                      "Equipment",
                      "equipment_name"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Customer",
                      "customer"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Location",
                      "location"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Type",
                      "equipment_type"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Manufacturer",
                      "manufacturer"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Model",
                      "model_number"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Asset Tag",
                      "asset_tag"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Ownership",
                      "ownership_type"
                    )}
                  </th>

                  <th>
                    {renderSortHeader(
                      "Status",
                      "status"
                    )}
                  </th>

                  {canManageEquipment && (
                    <th>
                      Actions
                    </th>
                  )}

                </tr>

              </thead>


              <tbody>

                {sortedEquipment.map(
                  (item) => (

                    <tr
                      key={
                        item.id
                      }
                    >

                      <td>

                        <strong>
                          {
                            item.equipment_name
                          }
                        </strong>

                      </td>


                      <td>
                        {
                          item.customer_name
                        }
                      </td>


                      <td>
                        {
                          item.location_name
                        }
                      </td>


                      <td>
                        {
                          item.equipment_type ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          item.manufacturer ||
                          "—"
                        }
                      </td>


                      <td>
                        {
                          item.model_number ||
                          "—"
                        }
                      </td>


                      <td>
                        <strong>
                          {
                            item.asset_tag ||
                            "—"
                          }
                        </strong>
                      </td>


                      <td>
                        <strong>
                          {item.ownership_type === "leased"
                            ? "Leased"
                            : item.ownership_type === "rented"
                            ? "Rented"
                            : "Owned"}
                        </strong>
                        {item.ownership_type === "leased" && item.lease_provider ? (
                          <small style={{ display: "block", color: "#7a8795", marginTop: 3 }}>
                            {item.lease_provider}
                          </small>
                        ) : null}
                      </td>


                      <td>

                        <span
                          className={`equipment-status ${item.status}`}
                        >

                          {item.status ===
                          "active"
                            ? "Active"
                            : item.status ===
                              "inactive"
                            ? "Inactive"
                            : "Out of Service"}

                        </span>

                      </td>


                      {canManageEquipment && (

                        <td>

                          <div className="equipment-actions">

                            <button
                              type="button"
                              className="equipment-edit"
                              title="Edit equipment"
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>


                            <button
                              type="button"
                              className="equipment-delete"
                              title="Delete equipment"
                              onClick={() =>
                                openDeleteModal(
                                  item
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
        canManageEquipment && (

        <div className="equipment-modal-overlay">

          <div className="equipment-modal">

            <div className="equipment-modal-header">

              <div>

                <h2>
                  {editingEquipment
                    ? "Edit Equipment"
                    : "Add Equipment"}
                </h2>


                <p>
                  Assign equipment
                  to a customer
                  location.
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

              <div className="equipment-error">
                {error}
              </div>

            )}


            <form
              onSubmit={
                handleSave
              }
            >

              <div className="equipment-form-grid">


                <div className="equipment-field">

                  <label>
                    Customer
                  </label>


                  <select
                    value={
                      selectedCustomer
                    }
                    onChange={
                      handleCustomerChange
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


                <div className="equipment-field">

                  <label>
                    Location
                  </label>


                  <select
                    name="location"
                    value={
                      form.location
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      !selectedCustomer
                    }
                  >

                    <option value="">
                      Select location
                    </option>


                    {filteredLocations.map(
                      (location) => (

                        <option
                          key={
                            location.id
                          }
                          value={
                            location.id
                          }
                        >
                          {
                            location.location_name
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="equipment-field full">

                  <label>
                    Equipment Name
                  </label>


                  <input
                    name="equipment_name"
                    value={
                      form.equipment_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Example: AC Unit #001"
                  />

                </div>


                <div className="equipment-field">

                  <label>
                    Equipment Type
                  </label>


                  <input
                    name="equipment_type"
                    value={
                      form.equipment_type
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Air Conditioner"
                  />

                </div>


                <div className="equipment-field">

                  <label>
                    Manufacturer
                  </label>


                  <input
                    name="manufacturer"
                    value={
                      form.manufacturer
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="equipment-field">

                  <label>
                    Model Number
                  </label>


                  <input
                    name="model_number"
                    value={
                      form.model_number
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="equipment-field">

                  <label>
                    Serial Number
                  </label>


                  <input
                    name="serial_number"
                    value={
                      form.serial_number
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <small className="equipment-field-hint">
                    Optional. You can add the Serial Number / MAC later.
                  </small>

                </div>


                <div className="equipment-field">

                  <label>
                    Asset Tag
                  </label>


                  <input
                    name="asset_tag"
                    value={
                      form.asset_tag
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="ET-0001"
                  />

                  <small className="equipment-field-hint">
                    Optional. Leave blank if the Asset Tag is not known yet; you can update it later.
                  </small>

                </div>


                <div className="equipment-field">

                  <label>
                    Installation Date
                  </label>


                  <input
                    type="date"
                    name="installation_date"
                    value={
                      form.installation_date
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="equipment-field">

                  <label>
                    Ownership
                  </label>

                  <select
                    name="ownership_type"
                    value={form.ownership_type}
                    onChange={handleChange}
                  >
                    <option value="owned">Owned</option>
                    <option value="leased">Leased</option>
                    <option value="rented">Rented</option>
                  </select>

                </div>

                {form.ownership_type === "leased" && (
                  <>
                    <div className="equipment-field">
                      <label>Lease Provider</label>
                      <input
                        name="lease_provider"
                        value={form.lease_provider}
                        onChange={handleChange}
                        placeholder="Lease company"
                      />
                    </div>

                    <div className="equipment-field">
                      <label>Lease End Date</label>
                      <input
                        type="date"
                        name="lease_end_date"
                        value={form.lease_end_date}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}


                <div className="equipment-field">

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

                    <option value="out_of_service">
                      Out of Service
                    </option>

                  </select>

                </div>


                <div className="equipment-field full">

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
                  />

                </div>

              </div>


              <div className="equipment-modal-actions">

                <button
                  type="button"
                  className="equipment-cancel"
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="equipment-save"
                >
                  {editingEquipment
                    ? "Save Changes"
                    : "Add Equipment"}
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
        canManageEquipment && (

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
            aria-labelledby="delete-equipment-title"
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

              <h2 id="delete-equipment-title">
                Delete equipment?
              </h2>


              <p>
                This will permanently
                delete{" "}

                <strong>
                  {
                    deleteTarget.equipment_name
                  }
                </strong>

                . This action cannot
                be undone.
              </p>


              <div className="app-delete-record">

                <span>
                  EQUIPMENT
                </span>


                <strong>
                  {
                    deleteTarget.equipment_name
                  }
                </strong>


                <small>
                  {
                    deleteTarget.asset_tag ||
                    deleteTarget.serial_number ||
                    deleteTarget.location_name ||
                    "Equipment record"
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
                  : "Delete Equipment"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default Equipment;