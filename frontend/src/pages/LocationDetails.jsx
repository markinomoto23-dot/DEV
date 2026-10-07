import { showSuccessToast } from "../components/SuccessToast";
import { apiUrl } from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageGuide from "../components/PageGuide";
import {
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  Download,
  Trash2,
  X,
  Pencil,
  RefreshCw,
  Plus,
} from "lucide-react";

import "./LocationDetails.css";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function StatusBadge({ value }) {
  const label = String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <span className={`location-detail-status ${String(value || "").toLowerCase().replaceAll("_", "-")}`}>{label || "—"}</span>;
}

function LocationDetails() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const authHeaders = useMemo(() => ({ Authorization: `Token ${token}` }), [token]);

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentDeleteId, setDocumentDeleteId] = useState(null);
  const [documentDeleteTarget, setDocumentDeleteTarget] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    customer: "",
    location_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    status: "active",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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
      const err = new Error(`Request failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return response.json();
  };

  const loadLocation = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchJson(apiUrl(`/api/locations/${locationId}/`));
      setLocation(data);
    } catch (err) {
      if (err.message !== "UNAUTHORIZED") {
        setError(err.status === 404 ? "Location not found." : "Unable to load this location.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (locationValue = location) => {
    if (!locationValue?.customer) return;
    setDocumentsLoading(true);
    setDocumentsError("");
    try {
      const query = new URLSearchParams({
        customer: String(locationValue.customer),
        location: String(locationId),
      });
      const data = await fetchJson(apiUrl(`/api/locations/documents/?${query.toString()}`));
      setDocuments(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      if (err.message !== "UNAUTHORIZED") setDocumentsError("Unable to load documents.");
    } finally {
      setDocumentsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      logoutAndRedirect();
      return;
    }
    loadLocation();
  }, [locationId]);

  useEffect(() => {
    if (location) loadDocuments(location);
  }, [location]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!documentFile || documentUploading || !location) return;

    const formData = new FormData();
    formData.append("customer", String(location.customer));
    formData.append("location", String(location.id));
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
          const data = await response.json();
          message = data.file?.[0] || data.detail || message;
        } catch {}
        setDocumentsError(message);
        return;
      }
      setDocumentFile(null);
      showSuccessToast("Document Uploaded", "The document was successfully uploaded.");
      await loadDocuments(location);
    } catch {
      setDocumentsError("Unable to connect to the server.");
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleDelete = (document) => {
    if (documentDeleteId) return;
    setDocumentsError("");
    setDocumentDeleteTarget(document);
  };

  const closeDocumentDeleteModal = () => {
    if (documentDeleteId) return;
    setDocumentDeleteTarget(null);
  };

  const confirmDocumentDelete = async () => {
    if (!documentDeleteTarget || documentDeleteId) return;
    const documentId = documentDeleteTarget.id;

    try {
      setDocumentDeleteId(documentId);
      setDocumentsError("");
      const response = await fetch(apiUrl(`/api/locations/documents/${documentId}/`), {
        method: "DELETE",
        headers: authHeaders,
      });
      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }
      if (!response.ok) {
        setDocumentsError("Unable to delete the document.");
        return;
      }
      showSuccessToast("Document Deleted", "The document was successfully deleted.");
      await loadDocuments(location);
      setDocumentDeleteTarget(null);
    } catch {
      setDocumentsError("Unable to connect to the server.");
    } finally {
      setDocumentDeleteId(null);
    }
  };

  const backToCustomer = () => {
    if (location?.customer) {
      navigate(`/customers/${location.customer}`);
    } else {
      navigate("/locations");
    }
  };

  const editLocation = () => {
    if (!location) return;
    setEditError("");
    setEditForm({
      customer: location.customer || "",
      location_name: location.location_name || "",
      address_line1: location.address_line1 || "",
      address_line2: location.address_line2 || "",
      city: location.city || "",
      state_province: location.state_province || "",
      postal_code: location.postal_code || "",
      country: location.country || "",
      contact_name: location.contact_name || "",
      contact_email: location.contact_email || "",
      phone: location.phone || "",
      status: location.status || "active",
      notes: location.notes || "",
    });
    setShowEditModal(true);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({ ...previous, [name]: value }));
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    if (!location || editSaving) return;


    try {
      setEditSaving(true);
      setEditError("");
      const response = await fetch(apiUrl(`/api/locations/${location.id}/`), {
        method: "PATCH",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          customer: Number(editForm.customer),
        }),
      });

      if (response.status === 401) {
        logoutAndRedirect();
        return;
      }

      if (!response.ok) {
        let message = "Unable to save location. Please check the information.";
        try {
          const data = await response.json();
          const firstFieldError = Object.values(data || {}).flatMap((value) => Array.isArray(value) ? value : [value]).find(Boolean);
          message = data.detail || data.message || firstFieldError || message;
        } catch {}
        setEditError(String(message));
        return;
      }

      const updated = await response.json();
      setLocation(updated);
      showSuccessToast("Location Updated", "Location information was successfully saved.");
      setShowEditModal(false);
    } catch {
      setEditError("Unable to connect to the server.");
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="location-detail-page">
        <div className="location-detail-loading"><RefreshCw className="location-detail-spin" size={24} /> Loading location...</div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="location-detail-page">
        <div className="location-detail-error">
          <h2>{error || "Location not found."}</h2>
          <button type="button" onClick={() => navigate("/locations")}>Back to Locations</button>
        </div>
      </div>
    );
  }

  const fullAddress = [
    location.address_line1,
    location.address_line2,
    [location.city, location.state_province, location.postal_code].filter(Boolean).join(", "),
    location.country,
  ].filter(Boolean);

  return (
    <div className="location-detail-page">
      <div className="location-detail-shell">
        <div className="location-detail-header">
          <div>
            <button type="button" className="location-detail-back" onClick={backToCustomer}>
              <ArrowLeft size={16} /> Back to list
            </button>
            <h1>{location.location_name}<PageGuide title="Location Details" text="View and manage the selected location, including address, contact information, documents, status, and edits." /></h1>
            <p>{location.customer_name || "Customer"} <span>•</span> <StatusBadge value={location.status} /></p>
          </div>
          <div className="location-detail-header-actions">
            <button
              type="button"
              className="location-detail-secondary-button"
              onClick={() =>
                navigate("/equipment", {
                  state: {
                    openAddEquipment: true,
                    customerId: Number(location.customer),
                    customerName: location.customer_name,
                    locationId: Number(location.id),
                    locationName: location.location_name,
                  },
                })
              }
            >
              <Plus size={15} /> Add Equipment
            </button>
            <button type="button" className="location-detail-secondary-button" onClick={editLocation}>
              <Pencil size={15} /> Edit
            </button>
            <button type="button" className="location-detail-secondary-button" onClick={loadLocation}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        <div className="location-detail-grid">
          <section className="location-detail-card">
            <h2>Address</h2>
            <div className="location-detail-address">
              {fullAddress.length ? fullAddress.map((line, index) => <div key={`${line}-${index}`}>{line}</div>) : <div>—</div>}
            </div>
          </section>

          <section className="location-detail-card">
            <h2>Contact</h2>
            <div className="location-detail-contact-list">
              <div><span>Name</span><strong>{location.contact_name || "—"}</strong></div>
              <div><span>Email</span><strong>{location.contact_email || "—"}</strong></div>
              <div><span>Phone</span><strong>{location.phone || "—"}</strong></div>
              {location.notes && <p>{location.notes}</p>}
            </div>
          </section>
        </div>

        <section className="location-detail-card location-detail-documents">
          <div className="location-detail-card-heading">
            <div>
              <h2>Documents</h2>
              <p>Documents uploaded for {location.location_name}.</p>
            </div>
          </div>

          <form className="location-detail-upload" onSubmit={handleUpload}>
            <div>
              <strong>Upload file</strong>
              <label className="location-detail-file-input">
                <span>{documentFile ? documentFile.name : "Choose file"}</span>
                <input type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
              </label>
              <small>Maximum file size: 25 MB</small>
            </div>
            <button type="submit" disabled={!documentFile || documentUploading}>
              <Upload size={16} /> {documentUploading ? "Uploading..." : "Upload"}
            </button>
          </form>

          {documentsError && <div className="location-detail-documents-error">{documentsError}</div>}

          <div className="location-detail-document-table-wrap">
            <table className="location-detail-document-table">
              <thead><tr><th>Name</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead>
              <tbody>
                {documentsLoading ? (
                  <tr><td colSpan="4" className="location-detail-document-empty">Loading documents...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan="4" className="location-detail-document-empty">No documents yet.</td></tr>
                ) : (
                  documents.map((document) => (
                    <tr key={document.id}>
                      <td>
                        <a href={document.file_url} target="_blank" rel="noreferrer" className="location-detail-document-name">
                          <FileText size={16} /> {document.original_name}
                        </a>
                      </td>
                      <td>{formatFileSize(document.file_size)}</td>
                      <td>{formatDate(document.uploaded_at)}</td>
                      <td>
                        <div className="location-detail-document-actions">
                          <a href={document.file_url} target="_blank" rel="noreferrer" title="Open document"><Download size={16} /></a>
                          <button type="button" title="Delete document" onClick={() => handleDelete(document)} disabled={documentDeleteId === document.id}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>



      {documentDeleteTarget && (
        <div className="location-delete-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDocumentDeleteModal(); }}>
          <div className="location-delete-modal" role="dialog" aria-modal="true" aria-labelledby="location-delete-document-title">
            <div className="location-delete-top">
              <div className="location-delete-icon"><Trash2 size={24} /></div>
              <button type="button" className="location-delete-close" onClick={closeDocumentDeleteModal} disabled={Boolean(documentDeleteId)} aria-label="Close delete confirmation"><X size={19} /></button>
            </div>
            <div className="location-delete-content">
              <div className="location-delete-eyebrow">Permanent action</div>
              <h2 id="location-delete-document-title">Delete document?</h2>
              <p>You’re about to permanently delete this document. This action cannot be undone.</p>
              <div className="location-delete-record">
                <span>DOCUMENT</span>
                <strong>{documentDeleteTarget.original_name}</strong>
                <small>{formatFileSize(documentDeleteTarget.file_size)}</small>
              </div>
              {documentsError && <div className="location-delete-error">{documentsError}</div>}
            </div>
            <div className="location-delete-actions">
              <button type="button" className="location-delete-cancel" onClick={closeDocumentDeleteModal} disabled={Boolean(documentDeleteId)}>Cancel</button>
              <button type="button" className="location-delete-confirm" onClick={confirmDocumentDelete} disabled={Boolean(documentDeleteId)}><Trash2 size={16} />{documentDeleteId ? "Deleting..." : "Delete Document"}</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="location-edit-overlay">
          <div className="location-edit-modal" role="dialog" aria-modal="true" aria-labelledby="location-edit-title">
            <div className="location-edit-modal-header">
              <div>
                <h2 id="location-edit-title">Edit Location</h2>
                <p>Add a customer site, office, branch, or service location.</p>
              </div>
              <button type="button" className="location-edit-close" onClick={() => setShowEditModal(false)} aria-label="Close edit location">
                <X size={20} />
              </button>
            </div>

            {editError && <div className="location-edit-error">{editError}</div>}

            <form onSubmit={saveLocation}>
              <div className="location-edit-grid">
                <div className="location-edit-field full">
                  <label>Customer</label>
                  <input value={location.customer_name || ""} disabled />
                </div>

                <div className="location-edit-field full">
                  <label>Location Name</label>
                  <input name="location_name" value={editForm.location_name} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field full">
                  <label>Address Line 1</label>
                  <input name="address_line1" value={editForm.address_line1} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field full">
                  <label>Address Line 2</label>
                  <input name="address_line2" value={editForm.address_line2} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>City</label>
                  <input name="city" value={editForm.city} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>State / Province</label>
                  <input name="state_province" value={editForm.state_province} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>Postal Code</label>
                  <input name="postal_code" value={editForm.postal_code} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>Country</label>
                  <input name="country" value={editForm.country} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>Contact Person</label>
                  <input name="contact_name" value={editForm.contact_name} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>Phone</label>
                  <input name="phone" value={editForm.phone} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>Email</label>
                  <input name="contact_email" type="email" value={editForm.contact_email} onChange={handleEditChange} />
                </div>

                <div className="location-edit-field">
                  <label>Status</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  <option value="credit_hold">Credit Hold</option>
                  </select>
                </div>

                <div className="location-edit-field full">
                  <label>Notes</label>
                  <textarea name="notes" rows="4" value={editForm.notes} onChange={handleEditChange} />
                </div>
              </div>

              <div className="location-edit-actions">
                <button type="button" className="location-edit-cancel" onClick={() => setShowEditModal(false)} disabled={editSaving}>Cancel</button>
                <button type="submit" className="location-edit-save" disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationDetails;