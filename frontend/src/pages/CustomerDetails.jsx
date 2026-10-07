import { apiUrl } from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Monitor,
  KeyRound,
  ShieldCheck,
  Ticket,
  CreditCard,
  Mail,
  Phone,
  UserRound,
  FileText,
  ExternalLink,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Upload,
  Download,
  Eye,
} from "lucide-react";

import "./CustomerDetails.css";

const RESOURCE_CONFIG = {
  locations: {
    label: "Locations",
    icon: MapPin,
    endpoint: "/api/locations/",
    managePath: "/locations",
  },
  equipment: {
    label: "Equipment",
    icon: Monitor,
    endpoint: "/api/equipment/",
    managePath: "/equipment",
  },
  licenses: {
    label: "Licenses",
    icon: KeyRound,
    endpoint: "/api/licenses/",
    managePath: "/licenses",
  },
  warranties: {
    label: "Warranties",
    icon: ShieldCheck,
    endpoint: "/api/warranties/",
    managePath: "/warranties",
  },
  tickets: {
    label: "Tickets",
    icon: Ticket,
    endpoint: "/api/tickets/",
    managePath: "/tickets",
  },
  billing: {
    label: "Billing",
    icon: CreditCard,
    endpoint: "/api/billing/",
    managePath: "/billing",
  },
};

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  ...Object.entries(RESOURCE_CONFIG).map(([id, config]) => ({
    id,
    label: config.label,
    icon: config.icon,
  })),
];

const EMPTY_RESOURCE_STATE = Object.keys(RESOURCE_CONFIG).reduce(
  (accumulator, key) => {
    accumulator[key] = [];
    return accumulator;
  },
  {}
);

const EMPTY_ERROR_STATE = Object.keys(RESOURCE_CONFIG).reduce(
  (accumulator, key) => {
    accumulator[key] = "";
    return accumulator;
  },
  {}
);

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.results) ? data.results : [];
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value || "—";
  }

  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

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

function StatusBadge({ value }) {
  if (!value) {
    return <span className="customer-detail-muted">—</span>;
  }

  const normalized = String(value).toLowerCase().replaceAll("_", "-");
  const label = String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <span className={`customer-detail-status ${normalized}`}>
      {label}
    </span>
  );
}

function EmptyTab({ label }) {
  return (
    <div className="customer-detail-empty">
      <FileText size={34} />
      <h3>No {label.toLowerCase()} found</h3>
      <p>This customer does not have any {label.toLowerCase()} records yet.</p>
    </div>
  );
}

function CustomerDetails() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [customer, setCustomer] = useState(null);
  const [resources, setResources] = useState(EMPTY_RESOURCE_STATE);
  const [resourceErrors, setResourceErrors] = useState(EMPTY_ERROR_STATE);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");

  const [currentRole, setCurrentRole] = useState("");
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const normalizedRole = String(currentRole || "").trim().toLowerCase();
  const isTechnician = normalizedRole === "technician";
  const canManageLocations =
    permissionsLoaded && Boolean(currentRole) && !isTechnician;
  const canManageDocuments =
    permissionsLoaded && Boolean(currentRole) && !isTechnician;

  const [locationSearch, setLocationSearch] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState(null);
  const [deleteLocationLoading, setDeleteLocationLoading] = useState(false);
  const [deleteLocationError, setDeleteLocationError] = useState("");
  const [locationSaving, setLocationSaving] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentScope, setDocumentScope] = useState({ type: "customer", location: null });
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentDeleteId, setDocumentDeleteId] = useState(null);
  const [documentDeleteTarget, setDocumentDeleteTarget] = useState(null);
  const [documentDeleteError, setDocumentDeleteError] = useState("");

  const emptyLocationForm = {
    customer: "",
    location_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "Philippines",
    contact_name: "",
    phone: "",
    status: "active",
    notes: "",
  };

  const [locationForm, setLocationForm] = useState(emptyLocationForm);

  const authHeaders = useMemo(
    () => ({ Authorization: `Token ${token}` }),
    [token]
  );

  const logoutAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, { headers: authHeaders });

    if (response.status === 401) {
      logoutAndRedirect();
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  };

  const loadLocationPermissions = async () => {
    try {
      const data = await fetchJson(apiUrl("/api/access/me/permissions/"));
      setCurrentRole(data.role || "");
    } catch (error) {
      if (error.message !== "UNAUTHORIZED") {
        setCurrentRole("");
      }
    } finally {
      setPermissionsLoaded(true);
    }
  };

  const loadCustomer = async () => {
    setLoading(true);
    setFatalError("");

    try {
      const customerData = await fetchJson(
        apiUrl(`/api/customers/${customerId}/`)
      );

      setCustomer(customerData);

      const resourceEntries = Object.entries(RESOURCE_CONFIG);

      const results = await Promise.allSettled(
        resourceEntries.map(([, config]) =>
          fetchJson(apiUrl(`${config.endpoint}?customer=${customerId}`))
        )
      );

      const nextResources = { ...EMPTY_RESOURCE_STATE };
      const nextErrors = { ...EMPTY_ERROR_STATE };

      results.forEach((result, index) => {
        const [key, config] = resourceEntries[index];

        if (result.status === "fulfilled") {
          nextResources[key] = normalizeList(result.value);
          return;
        }

        if (result.reason?.message === "UNAUTHORIZED") {
          return;
        }

        nextErrors[key] =
          result.reason?.status === 403
            ? `You do not have permission to view ${config.label.toLowerCase()}.`
            : `Unable to load ${config.label.toLowerCase()}.`;
      });

      setResources(nextResources);
      setResourceErrors(nextErrors);
    } catch (error) {
      if (error.message !== "UNAUTHORIZED") {
        setFatalError(
          error.status === 404
            ? "Customer not found."
            : "Unable to load this customer."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      logoutAndRedirect();
      return;
    }

    loadLocationPermissions();
    loadCustomer();
    fetchDocuments({ type: "customer", location: null });
  }, [customerId]);

  useEffect(() => {
    if (activeTab === "overview" && customer) {
      fetchDocuments({ type: "customer", location: null });
    }
  }, [activeTab, customerId, customer]);

  const counts = {
    locations: resources.locations.length,
    equipment: resources.equipment.length,
    licenses: resources.licenses.length,
    warranties: resources.warranties.length,
    tickets: resources.tickets.length,
    billing: resources.billing.length,
  };

  const renderResourceError = (key) => {
    if (!resourceErrors[key]) {
      return null;
    }

    return (
      <div className="customer-detail-inline-error">
        {resourceErrors[key]}
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    const size = Number(bytes || 0);
    if (!size) return "—";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const fetchDocuments = async (scope = documentScope) => {
    setDocumentsLoading(true);
    setDocumentsError("");

    try {
      const query = new URLSearchParams();
      query.set("customer", customerId);

      if (scope.type === "location" && scope.location?.id) {
        query.set("location", scope.location.id);
      } else {
        query.set("parent", "true");
      }

      const data = await fetchJson(
        apiUrl(`/api/locations/documents/?${query.toString()}`)
      );
      setDocuments(normalizeList(data));
    } catch (error) {
      if (error.message !== "UNAUTHORIZED") {
        setDocumentsError("Unable to load documents.");
      }
    } finally {
      setDocumentsLoading(false);
    }
  };

  const openCustomerDocuments = async () => {
    setDocumentScope({ type: "customer", location: null });
    setDocumentFile(null);
    setShowDocumentsModal(false);
    await fetchDocuments({ type: "customer", location: null });
  };

  const openLocationDocuments = async (location) => {
    setDocumentScope({ type: "location", location });
    setDocumentFile(null);
    setShowDocumentsModal(true);
    await fetchDocuments({ type: "location", location });
  };

  const closeDocumentsModal = () => {
    if (documentUploading) return;
    setShowDocumentsModal(false);
    setDocumentFile(null);
    setDocumentsError("");
  };

  const handleDocumentUpload = async (event) => {
    event.preventDefault();
    if (!documentFile || documentUploading) return;

    const formData = new FormData();
    formData.append("customer", String(customerId));
    if (documentScope.type === "location" && documentScope.location?.id) {
      formData.append("location", String(documentScope.location.id));
    }
    formData.append("file", documentFile);

    try {
      setDocumentUploading(true);
      setDocumentsError("");

      const response = await fetch(apiUrl("/api/locations/documents/"), {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        let message = "Unable to upload the document.";
        try {
          const errorData = await response.json();
          message = errorData.file?.[0] || errorData.detail || message;
        } catch {
          // Keep fallback message.
        }
        setDocumentsError(message);
        return;
      }

      setDocumentFile(null);
      await fetchDocuments(documentScope);
    } catch (error) {
      console.error("Upload customer document error:", error);
      setDocumentsError("Unable to connect to the server.");
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleDocumentDownload = async (document) => {
    if (!document?.id) return;

    try {
      setDocumentsError("");

      const downloadUrl =
        document.file_url ||
        apiUrl(`/api/locations/documents/${document.id}/download/`);

      const response = await fetch(
        downloadUrl,
        {
          method: "GET",
          headers: authHeaders,
        }
      );

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        let message = "Unable to download the document.";

        try {
          const errorData = await response.json();
          message = errorData.detail || errorData.message || message;
        } catch {
          // Keep fallback message.
        }

        setDocumentsError(message);
        return;
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");

      link.href = blobUrl;
      link.download = document.original_name || "document";
      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download customer document error:", error);
      setDocumentsError("Unable to connect to the server.");
    }
  };

  const handleDocumentDelete = (document) => {
    if (documentDeleteId) return;

    setDocumentDeleteError("");
    setDocumentDeleteTarget(document);
  };

  const closeDocumentDeleteModal = () => {
    if (documentDeleteId) return;

    setDocumentDeleteTarget(null);
    setDocumentDeleteError("");
  };

  const confirmDocumentDelete = async () => {
    if (!documentDeleteTarget || documentDeleteId) return;

    try {
      setDocumentDeleteId(documentDeleteTarget.id);
      setDocumentDeleteError("");
      setDocumentsError("");

      const response = await fetch(
        apiUrl(`/api/locations/documents/${documentDeleteTarget.id}/`),
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      if (response.status === 401) {
        setDocumentDeleteTarget(null);
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        let message = "Unable to delete the document.";

        try {
          const data = await response.json();
          message = data.detail || data.message || message;
        } catch {
          // Keep fallback message.
        }

        setDocumentDeleteError(message);
        return;
      }

      setDocumentDeleteTarget(null);
      setDocumentDeleteError("");

      await fetchDocuments(documentScope);
    } catch (error) {
      console.error("Delete customer document error:", error);
      setDocumentDeleteError("Unable to connect to the server.");
    } finally {
      setDocumentDeleteId(null);
    }
  };

  const renderDocumentsContent = () => (
    <div className="customer-detail-documents">
      {canManageDocuments && (
        <form className="customer-detail-document-upload" onSubmit={handleDocumentUpload}>
          <div>
            <strong>Upload file</strong>
            <label className="customer-detail-document-file">
              <span>{documentFile ? documentFile.name : "Choose file"}</span>
              <input
                type="file"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
              />
            </label>
            <small>Maximum file size: 4 MB</small>
          </div>
          <button type="submit" disabled={!documentFile || documentUploading}>
            <Upload size={16} />
            {documentUploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

      {documentsError && (
        <div className="customer-detail-document-error">{documentsError}</div>
      )}

      <div className="customer-detail-document-table-wrap">
        <table className="customer-detail-document-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentsLoading ? (
              <tr>
                <td colSpan="4" className="customer-detail-document-empty">Loading documents...</td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan="4" className="customer-detail-document-empty">No documents yet.</td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr key={document.id}>
                  <td>
                    <button
                      type="button"
                      className="customer-detail-document-name"
                      onClick={() => handleDocumentDownload(document)}
                      title="Download document"
                    >
                      <FileText size={16} />
                      <span>{document.original_name}</span>
                    </button>
                  </td>
                  <td>{formatFileSize(document.file_size)}</td>
                  <td>{formatDate(document.uploaded_at)}</td>
                  <td>
                    <div className="customer-detail-document-actions">
                      <button
                        type="button"
                        title="Download document"
                        onClick={() => handleDocumentDownload(document)}
                      >
                        <Download size={16} />
                      </button>
                      {canManageDocuments && (
                        <button
                          type="button"
                          title="Delete document"
                          onClick={() => handleDocumentDelete(document)}
                          disabled={documentDeleteId === document.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canManageDocuments && documentDeleteTarget && (
        <div
          className="customer-detail-location-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDocumentDeleteModal();
            }
          }}
        >
          <div
            className="customer-detail-location-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
          >
            <div className="customer-detail-location-delete-top">
              <div className="customer-detail-location-delete-icon">
                <Trash2 size={24} />
              </div>

              <button
                type="button"
                className="customer-detail-location-delete-close"
                onClick={closeDocumentDeleteModal}
                disabled={Boolean(documentDeleteId)}
                aria-label="Close delete confirmation"
              >
                <X size={20} />
              </button>
            </div>

            <div className="customer-detail-location-delete-content">
              <h2 id="delete-document-title">Delete document?</h2>

              <p>
                Are you sure you want to permanently delete{" "}
                <strong>{documentDeleteTarget.original_name}</strong>?
                {" "}This action cannot be undone.
              </p>

              <div className="customer-detail-location-delete-record">
                <span>DOCUMENT</span>

                <strong>{documentDeleteTarget.original_name}</strong>

                <small>
                  {formatFileSize(documentDeleteTarget.file_size)}
                </small>
              </div>

              {documentDeleteError && (
                <div className="customer-detail-location-delete-error">
                  {documentDeleteError}
                </div>
              )}
            </div>

            <div className="customer-detail-location-delete-actions">
              <button
                type="button"
                className="customer-detail-location-delete-cancel"
                onClick={closeDocumentDeleteModal}
                disabled={Boolean(documentDeleteId)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="customer-detail-location-delete-confirm"
                onClick={confirmDocumentDelete}
                disabled={Boolean(documentDeleteId)}
              >
                <Trash2 size={16} />
                {documentDeleteId ? "Deleting..." : "Delete Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="customer-detail-overview">
      <div className="customer-detail-summary-grid">
        {Object.entries(RESOURCE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;

          return (
            <button
              key={key}
              type="button"
              className="customer-detail-summary-card"
              onClick={() => setActiveTab(key)}
            >
              <span className="customer-detail-summary-icon">
                <Icon size={20} />
              </span>

              <span>
                <strong>{counts[key]}</strong>
                <small>{config.label}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="customer-detail-two-column">
        <section className="customer-detail-panel">
          <div className="customer-detail-panel-heading">
            <h2>Customer Information</h2>
          </div>

          <div className="customer-detail-info-list">
            <div>
              <UserRound size={17} />
              <span>
                <small>Primary Contact</small>
                <strong>{customer.contact_name || "—"}</strong>
              </span>
            </div>

            <div>
              <Mail size={17} />
              <span>
                <small>Email</small>
                <strong>{customer.email || "—"}</strong>
              </span>
            </div>

            <div>
              <Phone size={17} />
              <span>
                <small>Phone</small>
                <strong>{customer.phone || "—"}</strong>
              </span>
            </div>

            <div>
              <Building2 size={17} />
              <span>
                <small>Status</small>
                <StatusBadge value={customer.status} />
              </span>
            </div>
          </div>
        </section>

        <section className="customer-detail-panel">
          <div className="customer-detail-panel-heading">
            <h2>Notes</h2>
          </div>

          <p className="customer-detail-notes">
            {customer.notes || "No customer notes have been added."}
          </p>
        </section>
      </div>

      <section className="customer-detail-panel">
        <div className="customer-detail-panel-heading">
          <h2>Customer Record</h2>
        </div>

        <div className="customer-detail-record-meta">
          <span>
            <small>Customer ID</small>
            <strong>#{customer.id}</strong>
          </span>
          <span>
            <small>Created</small>
            <strong>{formatDate(customer.created_at)}</strong>
          </span>
          <span>
            <small>Last Updated</small>
            <strong>{formatDate(customer.updated_at)}</strong>
          </span>
        </div>
      </section>

      <section className="customer-detail-panel customer-detail-documents-panel">
        <div className="customer-detail-panel-heading">
          <div>
            <h2>Documents</h2>
            <p>Documents uploaded for {customer.company_name}.</p>
          </div>
        </div>
        {renderDocumentsContent()}
      </section>
    </div>
  );

  const fetchCustomerLocations = async (searchValue = locationSearch) => {
    setLocationLoading(true);
    setLocationError("");

    try {
      const cleanSearch = searchValue.trim();
      const query = new URLSearchParams();
      query.set("customer", customerId);

      if (cleanSearch) {
        query.set("search", cleanSearch);
      }

      const data = await fetchJson(
        apiUrl(`/api/locations/?${query.toString()}`)
      );

      setResources((previous) => ({
        ...previous,
        locations: normalizeList(data),
      }));
    } catch (error) {
      if (error.message !== "UNAUTHORIZED") {
        setLocationError("Unable to load locations.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSearch = (event) => {
    event.preventDefault();
    fetchCustomerLocations(locationSearch);
  };

  const clearLocationSearch = () => {
    setLocationSearch("");
    fetchCustomerLocations("");
  };

  const handleLocationChange = (event) => {
    const { name, value } = event.target;

    setLocationForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddLocationModal = () => {
    if (!canManageLocations) {
      return;
    }

    setEditingLocation(null);
    setLocationError("");

    setLocationForm({
      ...emptyLocationForm,
      customer: String(customerId),
    });

    setShowLocationModal(true);
  };

  const openEditLocationModal = (location) => {
    if (!canManageLocations) {
      return;
    }

    setEditingLocation(location);
    setLocationError("");

    setLocationForm({
      customer: String(location.customer || customerId),
      location_name: location.location_name || "",
      address_line1: location.address_line1 || "",
      address_line2: location.address_line2 || "",
      city: location.city || "",
      state_province: location.state_province || "",
      postal_code: location.postal_code || "",
      country: location.country || "",
      contact_name: location.contact_name || "",
      phone: location.phone || "",
      status: location.status || "active",
      notes: location.notes || "",
    });

    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    if (locationSaving) {
      return;
    }

    setShowLocationModal(false);
    setEditingLocation(null);
    setLocationForm(emptyLocationForm);
    setLocationError("");
  };

  const handleLocationSave = async (event) => {
    event.preventDefault();

    if (!canManageLocations) {
      setLocationError("You do not have permission to modify locations.");
      return;
    }


    const editing = Boolean(editingLocation);
    const url = editing
      ? apiUrl(`/api/locations/${editingLocation.id}/`)
      : apiUrl("/api/locations/");

    const payload = {
      ...locationForm,
      customer: Number(customerId),
    };

    try {
      setLocationSaving(true);
      setLocationError("");

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        setLocationError(
          "You do not have permission to modify locations."
        );
        return;
      }

      if (!response.ok) {
        let message = "Unable to save location. Please check the information.";

        try {
          const errorData = await response.json();
          message = errorData.detail || errorData.message || message;
        } catch {
          // Keep fallback message.
        }

        setLocationError(message);
        return;
      }

      setShowLocationModal(false);
      setEditingLocation(null);
      setLocationForm(emptyLocationForm);

      await fetchCustomerLocations(locationSearch);
    } catch (error) {
      console.error("Save customer location error:", error);
      setLocationError("Unable to connect to the server.");
    } finally {
      setLocationSaving(false);
    }
  };

  const openDeleteLocationModal = (location) => {
    if (!canManageLocations) {
      return;
    }

    setDeleteLocationTarget(location);
    setDeleteLocationError("");
  };

  const closeDeleteLocationModal = () => {
    if (deleteLocationLoading) {
      return;
    }

    setDeleteLocationTarget(null);
    setDeleteLocationError("");
  };

  const confirmDeleteLocation = async () => {
    if (!deleteLocationTarget || !canManageLocations) {
      return;
    }

    try {
      setDeleteLocationLoading(true);
      setDeleteLocationError("");

      const response = await fetch(
        apiUrl(`/api/locations/${deleteLocationTarget.id}/`),
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      if (response.status === 401) {
        setDeleteLocationTarget(null);
        logoutAndRedirect();
        return;
      }

      if (response.status === 403) {
        setDeleteLocationError(
          "You do not have permission to delete locations."
        );
        return;
      }

      if (!response.ok) {
        let message = "Unable to delete location.";

        try {
          const data = await response.json();
          message = data.detail || data.message || message;
        } catch {
          // Keep fallback message.
        }

        setDeleteLocationError(message);
        return;
      }

      setDeleteLocationTarget(null);
      setDeleteLocationError("");

      await fetchCustomerLocations(locationSearch);
    } catch (error) {
      console.error("Delete customer location error:", error);
      setDeleteLocationError("Unable to connect to the server.");
    } finally {
      setDeleteLocationLoading(false);
    }
  };

  const renderLocations = () => {
    if (resourceErrors.locations) return renderResourceError("locations");

    const locations = resources.locations || [];

    return (
      <div className="customer-detail-locations">
        <div className="customer-detail-location-toolbar">
          <form
            className="customer-detail-location-search"
            onSubmit={handleLocationSearch}
          >
            <Search size={18} />

            <input
              type="text"
              placeholder="Search locations..."
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
            />

            <button type="submit">Search</button>
          </form>

          {locationSearch && (
            <button
              type="button"
              className="customer-detail-location-clear"
              onClick={clearLocationSearch}
            >
              Clear search
            </button>
          )}
        </div>

        {locationError && !showLocationModal && !deleteLocationTarget && (
          <div className="customer-detail-location-error">{locationError}</div>
        )}

        {locationLoading ? (
          <div className="customer-detail-location-empty">
            <MapPin size={42} />
            <h3>Loading locations...</h3>
          </div>
        ) : locations.length === 0 ? (
          <div className="customer-detail-location-empty">
            <MapPin size={45} />
            <h3>No locations found</h3>
            <p>
              {locationSearch
                ? "No locations match your search."
                : "Add the first location for this customer to get started."}
            </p>
          </div>
        ) : (
          <div className="customer-detail-location-table-wrapper">
            <table className="customer-detail-location-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Status</th>
                  {canManageLocations && <th>Actions</th>}
                </tr>
              </thead>

              <tbody>
                {locations.map((location) => (
                  <tr key={location.id}>
                    <td>
                      <div className="customer-detail-location-name-cell">
                        <div className="customer-detail-location-icon">
                          <MapPin size={16} />
                        </div>
                        <strong>{location.location_name}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="customer-detail-location-customer">
                        <Building2 size={15} />
                        <span>
                          {location.customer_name || customer.company_name || "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td>{location.address_line1 || "—"}</td>
                    <td>{location.city || "—"}</td>
                    <td>{location.contact_name || "—"}</td>
                    <td>{location.phone || "—"}</td>

                    <td>
                      <span
                        className={`customer-detail-location-status ${location.status}`}
                      >
                        {formatLocationStatus(location.status)}
                      </span>
                    </td>

                    {canManageLocations && (
                      <td>
                        <div className="customer-detail-location-actions">
                          <button
                            type="button"
                            className="customer-detail-location-edit"
                            title="Edit location"
                            onClick={() => openEditLocationModal(location)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            className="customer-detail-location-view"
                            title="View location"
                            onClick={() => navigate(`/locations/${location.id}`)}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="customer-detail-location-delete"
                            title="Delete location"
                            onClick={() => openDeleteLocationModal(location)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showLocationModal && canManageLocations && (
          <div className="customer-detail-location-modal-overlay">
            <div className="customer-detail-location-modal">
              <div className="customer-detail-location-modal-header">
                <div>
                  <h2>{editingLocation ? "Edit Location" : "Add Location"}</h2>
                  <p>
                    Add a customer site, office, branch, or service location.
                  </p>
                </div>

                <button
                  type="button"
                  className="customer-detail-location-modal-close"
                  onClick={closeLocationModal}
                  disabled={locationSaving}
                  aria-label="Close location dialog"
                >
                  <X size={20} />
                </button>
              </div>

              {locationError && (
                <div className="customer-detail-location-modal-error">
                  {locationError}
                </div>
              )}

              <form onSubmit={handleLocationSave}>
                <div className="customer-detail-location-form-grid">
                  <div className="customer-detail-location-field full">
                    <label>Customer</label>
                    <input value={customer.company_name} readOnly />
                  </div>

                  <div className="customer-detail-location-field full">
                    <label>Location Name</label>
                    <input
                      name="location_name"
                      placeholder="Example: Main Office"
                      value={locationForm.location_name}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field full">
                    <label>Address Line 1</label>
                    <input
                      name="address_line1"
                      placeholder="Street, building, barangay"
                      value={locationForm.address_line1}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field full">
                    <label>Address Line 2</label>
                    <input
                      name="address_line2"
                      placeholder="Unit, floor, subdivision, additional address"
                      value={locationForm.address_line2}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>City</label>
                    <input
                      name="city"
                      placeholder="City"
                      value={locationForm.city}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>State / Province</label>
                    <input
                      name="state_province"
                      placeholder="Province"
                      value={locationForm.state_province}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>Postal Code</label>
                    <input
                      name="postal_code"
                      placeholder="Postal code"
                      value={locationForm.postal_code}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>Country</label>
                    <input
                      name="country"
                      placeholder="Country"
                      value={locationForm.country}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>Contact Person</label>
                    <input
                      name="contact_name"
                      placeholder="Contact person"
                      value={locationForm.contact_name}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>Phone</label>
                    <input
                      name="phone"
                      placeholder="Phone number"
                      value={locationForm.phone}
                      onChange={handleLocationChange}
                    />
                  </div>

                  <div className="customer-detail-location-field">
                    <label>Status</label>
                    <select
                      name="status"
                      value={locationForm.status}
                      onChange={handleLocationChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="credit_hold">Credit Hold</option>
                    </select>
                  </div>

                  <div className="customer-detail-location-field full">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={locationForm.notes}
                      onChange={handleLocationChange}
                      rows="4"
                      placeholder="Optional notes about this location"
                    />
                  </div>
                </div>

                <div className="customer-detail-location-modal-actions">
                  <button
                    type="button"
                    className="customer-detail-location-cancel"
                    onClick={closeLocationModal}
                    disabled={locationSaving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="customer-detail-location-save"
                    disabled={locationSaving}
                  >
                    {locationSaving
                      ? "Saving..."
                      : editingLocation
                        ? "Save Changes"
                        : "Add Location"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDocumentsModal && (
          <div
            className="customer-detail-document-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDocumentsModal();
            }}
          >
            <div className="customer-detail-document-modal" role="dialog" aria-modal="true">
              <div className="customer-detail-document-modal-header">
                <div>
                  <div className="customer-detail-eyebrow">Location Documents</div>
                  <h3>{documentScope.location?.location_name || "Location"}</h3>
                  <p>Documents linked to {customer.company_name}.</p>
                </div>
                <button
                  type="button"
                  className="customer-detail-document-modal-close"
                  onClick={closeDocumentsModal}
                  disabled={documentUploading}
                  aria-label="Close documents dialog"
                >
                  <X size={20} />
                </button>
              </div>
              {renderDocumentsContent()}
            </div>
          </div>
        )}

        {deleteLocationTarget && canManageLocations && (
          <div
            className="customer-detail-location-delete-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDeleteLocationModal();
              }
            }}
          >
            <div
              className="customer-detail-location-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-delete-location-title"
            >
              <div className="customer-detail-location-delete-top">
                <div className="customer-detail-location-delete-icon">
                  <Trash2 size={24} />
                </div>

                <button
                  type="button"
                  className="customer-detail-location-delete-close"
                  onClick={closeDeleteLocationModal}
                  disabled={deleteLocationLoading}
                  aria-label="Close delete confirmation"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="customer-detail-location-delete-content">
                <h2 id="customer-delete-location-title">
                  Delete location?
                </h2>

                <p>
                  This will permanently delete{" "}
                  <strong>{deleteLocationTarget.location_name}</strong>.
                  This action cannot be undone.
                </p>

                <div className="customer-detail-location-delete-record">
                  <span>LOCATION</span>
                  <strong>{deleteLocationTarget.location_name}</strong>
                  <small>
                    {customer.company_name || deleteLocationTarget.city || "Location record"}
                  </small>
                </div>

                {deleteLocationError && (
                  <div className="customer-detail-location-delete-error">
                    {deleteLocationError}
                  </div>
                )}
              </div>

              <div className="customer-detail-location-delete-actions">
                <button
                  type="button"
                  className="customer-detail-location-delete-cancel"
                  onClick={closeDeleteLocationModal}
                  disabled={deleteLocationLoading}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="customer-detail-location-delete-confirm"
                  onClick={confirmDeleteLocation}
                  disabled={deleteLocationLoading}
                >
                  <Trash2 size={16} />
                  {deleteLocationLoading ? "Deleting..." : "Delete Location"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEquipment = () => {
    if (resourceErrors.equipment) return renderResourceError("equipment");
    if (!resources.equipment.length) return <EmptyTab label="Equipment" />;

    return (
      <div className="customer-detail-table-wrap">
        <table className="customer-detail-table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Location</th>
              <th>Type</th>
              <th>Manufacturer / Model</th>
              <th>Serial</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {resources.equipment.map((equipment) => (
              <tr key={equipment.id}>
                <td><strong>{equipment.equipment_name}</strong></td>
                <td>{equipment.location_name || "—"}</td>
                <td>{equipment.equipment_type || "—"}</td>
                <td>
                  {[equipment.manufacturer, equipment.model_number]
                    .filter(Boolean)
                    .join(" / ") || "—"}
                </td>
                <td>{equipment.serial_number || "—"}</td>
                <td><StatusBadge value={equipment.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLicenses = () => {
    if (resourceErrors.licenses) return renderResourceError("licenses");
    if (!resources.licenses.length) return <EmptyTab label="Licenses" />;

    return (
      <div className="customer-detail-table-wrap">
        <table className="customer-detail-table">
          <thead>
            <tr>
              <th>License</th>
              <th>Equipment</th>
              <th>Location</th>
              <th>Provider</th>
              <th>Expiration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {resources.licenses.map((license) => (
              <tr key={license.id}>
                <td>
                  <strong>{license.license_number || license.license_type || `License #${license.id}`}</strong>
                  {license.license_number && license.license_type && (
                    <small className="customer-detail-subtext">{license.license_type}</small>
                  )}
                </td>
                <td>{license.equipment_name || "—"}</td>
                <td>{license.location_name || "—"}</td>
                <td>{license.provider || "—"}</td>
                <td>{formatDate(license.expiration_date)}</td>
                <td><StatusBadge value={license.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWarranties = () => {
    if (resourceErrors.warranties) return renderResourceError("warranties");
    if (!resources.warranties.length) return <EmptyTab label="Warranties" />;

    return (
      <div className="customer-detail-table-wrap">
        <table className="customer-detail-table">
          <thead>
            <tr>
              <th>Warranty</th>
              <th>Equipment</th>
              <th>Location</th>
              <th>Provider</th>
              <th>Expiration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {resources.warranties.map((warranty) => (
              <tr key={warranty.id}>
                <td><strong>{warranty.warranty_number || `Warranty #${warranty.id}`}</strong></td>
                <td>{warranty.equipment_name || "—"}</td>
                <td>{warranty.location_name || "—"}</td>
                <td>{warranty.provider || "—"}</td>
                <td>{formatDate(warranty.expiration_date)}</td>
                <td><StatusBadge value={warranty.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTickets = () => {
    if (resourceErrors.tickets) return renderResourceError("tickets");
    if (!resources.tickets.length) return <EmptyTab label="Tickets" />;

    return (
      <div className="customer-detail-table-wrap">
        <table className="customer-detail-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Subject</th>
              <th>Location</th>
              <th>Equipment</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {resources.tickets.map((ticketRecord) => (
              <tr key={ticketRecord.id}>
                <td><strong>{ticketRecord.ticket_number || `#${ticketRecord.id}`}</strong></td>
                <td>{ticketRecord.subject || "—"}</td>
                <td>{ticketRecord.location_name || "—"}</td>
                <td>{ticketRecord.equipment_name || "—"}</td>
                <td><StatusBadge value={ticketRecord.priority} /></td>
                <td><StatusBadge value={ticketRecord.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBilling = () => {
    if (resourceErrors.billing) return renderResourceError("billing");
    if (!resources.billing.length) return <EmptyTab label="Billing" />;

    return (
      <div className="customer-detail-table-wrap">
        <table className="customer-detail-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Ticket</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Total</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {resources.billing.map((invoice) => (
              <tr key={invoice.id}>
                <td><strong>{invoice.invoice_number || `Invoice #${invoice.id}`}</strong></td>
                <td>{invoice.ticket_number || "—"}</td>
                <td>{formatDate(invoice.issued_date)}</td>
                <td>{formatDate(invoice.due_date)}</td>
                <td>{formatMoney(invoice.total_amount)}</td>
                <td>{formatMoney(invoice.balance)}</td>
                <td><StatusBadge value={invoice.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "locations":
        return renderLocations();
      case "equipment":
        return renderEquipment();
      case "licenses":
        return renderLicenses();
      case "warranties":
        return renderWarranties();
      case "tickets":
        return renderTickets();
      case "billing":
        return renderBilling();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="customer-detail-page">
        <div className="customer-detail-loading">
          <RefreshCw className="customer-detail-spin" size={24} />
          Loading customer record...
        </div>
      </div>
    );
  }

  if (fatalError || !customer) {
    return (
      <div className="customer-detail-page">
        <div className="customer-detail-fatal">
          <h2>{fatalError || "Customer not found."}</h2>
          <button type="button" onClick={() => navigate("/customers")}>
            <ArrowLeft size={16} />
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const activeResource = RESOURCE_CONFIG[activeTab];

  return (
    <div className="customer-detail-page">
      <div className="customer-detail-shell">
        <button
          type="button"
          className="customer-detail-back"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft size={16} />
          Customers
        </button>

        <header className="customer-detail-header">
          <div className="customer-detail-title-wrap">
            <div className="customer-detail-company-icon">
              <Building2 size={26} />
            </div>

            <div>
              <div className="customer-detail-eyebrow">Customer Record</div>
              <h1>{customer.company_name}</h1>
              <div className="customer-detail-header-meta">
                <span>{customer.contact_name || "No primary contact"}</span>
                <span>•</span>
                <StatusBadge value={customer.status} />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="customer-detail-refresh"
            onClick={loadCustomer}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <nav className="customer-detail-tabs" aria-label="Customer sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === "overview" ? null : counts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {count !== null && <em>{count}</em>}
              </button>
            );
          })}
        </nav>

        <main className="customer-detail-content-card">
          <div className="customer-detail-content-heading">
            <div>
              <h2>
                {activeTab === "overview"
                  ? "Customer Overview"
                  : activeResource?.label}
              </h2>
              <p>
                {activeTab === "overview"
                  ? "Everything connected to this customer is organized here."
                  : `${activeResource?.label} linked to ${customer.company_name}.`}
              </p>
            </div>

            {activeTab === "locations" ? (
              <div className="customer-detail-location-heading-actions">
                {canManageLocations && (
                  <button
                    type="button"
                    className="customer-detail-manage customer-detail-location-add"
                    onClick={() =>
                      navigate("/locations", {
                        state: {
                          openAddLocation: true,
                          customerId: Number(customerId),
                          customerName: customer.company_name,
                        },
                      })
                    }
                  >
                    <Plus size={18} />
                    Add Location
                  </button>
                )}
              </div>
            ) : activeTab === "equipment" ? (
              <button
                type="button"
                className="customer-detail-manage"
                onClick={() =>
                  navigate("/equipment", {
                    state: {
                      openAddEquipment: true,
                      customerId: Number(customerId),
                      customerName: customer.company_name,
                    },
                  })
                }
              >
                <Plus size={18} />
                Add Equipment
              </button>
            ) : activeResource ? (
              <button
                type="button"
                className="customer-detail-manage"
                onClick={() =>
                  navigate(activeResource.managePath, {
                    state: {
                      customerId: Number(customerId),
                      customerName: customer.company_name,
                    },
                  })
                }
              >
                Manage {activeResource.label}
                <ExternalLink size={15} />
              </button>
            ) : null}
          </div>

          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}

export default CustomerDetails;
