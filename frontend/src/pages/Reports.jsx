import { apiUrl } from "../config/api";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageGuide from "../components/PageGuide";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  RefreshCcw,
  Ticket,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

import "./Reports.css";
import { formatDate } from "../utils/dateFormatter";

const REPORTS_API = apiUrl("/api/reports/summary/");
const EXPORT_API = apiUrl("/api/reports/export-csv/");
const TECHNICIANS_API = apiUrl("/api/technicians/");

const EMPTY_REPORT = {
  permissions: { can_export: false, can_view_financials: false },
  summary: {
    total_tickets: 0,
    open_tickets: 0,
    closed_tickets: 0,
    resolved_tickets: 0,
    total_customers: 0,
    total_technicians: 0,
    total_billed: 0,
    total_paid: 0,
    outstanding: 0,
  },
  tickets_by_status: { open: 0, closed: 0 },
  technician_performance: [],
  customer_history: [],
  equipment_history: [],
  recent_tickets: [],
};

function Reports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [report, setReport] = useState(EMPTY_REPORT);
  const [technicians, setTechnicians] = useState([]);
  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    technician: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = { Authorization: `Token ${token}` };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const buildParams = (activeFilters = filters) => {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params;
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch(TECHNICIANS_API, { headers: authHeaders });
      if (response.status === 401) return logout();
      if (!response.ok) return;
      const data = await response.json();
      setTechnicians(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error("Technician report filter error:", err);
    }
  };

  const fetchReport = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      const params = buildParams(activeFilters);
      const url = params.toString() ? `${REPORTS_API}?${params}` : REPORTS_API;
      const response = await fetch(url, { headers: authHeaders });
      if (response.status === 401) return logout();
      if (response.status === 403) return navigate("/access-denied");
      if (!response.ok) throw new Error("Unable to load reports.");
      const data = await response.json();
      setReport({ ...EMPTY_REPORT, ...data, summary: { ...EMPTY_REPORT.summary, ...(data.summary || {}) } });
    } catch (err) {
      console.error("Reports error:", err);
      setError("Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return logout();
    fetchReport({ date_from: "", date_to: "", technician: "", status: "" });
    fetchTechnicians();
  }, []);

  const applyFilters = (event) => {
    event.preventDefault();
    fetchReport(filters);
  };

  const resetFilters = () => {
    const empty = { date_from: "", date_to: "", technician: "", status: "" };
    setFilters(empty);
    fetchReport(empty);
  };

  const exportCsv = async () => {
    if (!report.permissions?.can_export) return;
    try {
      setExporting(true);
      const params = buildParams(filters);
      params.delete("status");
      const response = await fetch(
        params.toString() ? `${EXPORT_API}?${params}` : EXPORT_API,
        { headers: authHeaders }
      );
      if (response.status === 401) return logout();
      if (!response.ok) throw new Error("Export failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "expert-tech-ticket-report.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Unable to export the report.");
    } finally {
      setExporting(false);
    }
  };

  const money = (amount) => Number(amount || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const maxStatusCount = useMemo(
    () => Math.max(Number(report.tickets_by_status?.open || 0), Number(report.tickets_by_status?.closed || 0), 1),
    [report.tickets_by_status]
  );

  const statusRows = [
    { key: "open", label: "Open" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <button type="button" className="reports-back" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <h1>Reports<PageGuide title="Reports" text="Review ticket performance, technician workload, customer activity, service history, and reporting summaries." /></h1>
          <p>Ticket performance, technician workload, customer activity, and service history.</p>
        </div>

        {report.permissions?.can_export && (
          <button type="button" className="reports-apply" onClick={exportCsv} disabled={exporting}>
            <Download size={16} /> {exporting ? "Exporting..." : "Export CSV"}
          </button>
        )}
      </div>

      <form className="reports-filters" onSubmit={applyFilters}>
        <div className="reports-filter-field">
          <label>Date From</label>
          <input type="date" name="date_from" value={filters.date_from}
            onChange={(e) => setFilters((p) => ({ ...p, date_from: e.target.value }))} />
        </div>
        <div className="reports-filter-field">
          <label>Date To</label>
          <input type="date" name="date_to" value={filters.date_to}
            onChange={(e) => setFilters((p) => ({ ...p, date_to: e.target.value }))} />
        </div>
        <div className="reports-filter-field">
          <label>Technician</label>
          <select name="technician" value={filters.technician}
            onChange={(e) => setFilters((p) => ({ ...p, technician: e.target.value }))}>
            <option value="">All Technicians</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>{tech.employee_id} | {tech.full_name}</option>
            ))}
          </select>
        </div>
        <div className="reports-filter-field">
          <label>Ticket Status</label>
          <select name="status" value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="reports-filter-actions">
          <button type="submit" className="reports-apply">Apply Filters</button>
          <button type="button" className="reports-reset" onClick={resetFilters}>
            <RefreshCcw size={15} /> Reset
          </button>
        </div>
      </form>

      {error && <div className="reports-error">{error}</div>}

      <section className="reports-summary">
        <SummaryCard title="Total Tickets" value={loading ? "..." : report.summary.total_tickets} note="Service requests" icon={<Ticket size={22} />} />
        <SummaryCard title="Closed Tickets" value={loading ? "..." : report.summary.closed_tickets} note="Completed work" icon={<BarChart3 size={22} />} />
        <SummaryCard title="Customers" value={loading ? "..." : report.summary.total_customers} note="Customer records" icon={<Users size={22} />} />
        <SummaryCard title="Technicians" value={loading ? "..." : report.summary.total_technicians} note="Service team" icon={<UserCog size={22} />} />
        {report.permissions?.can_view_financials && (
          <SummaryCard title="Outstanding" value={loading ? "..." : money(report.summary.outstanding)} note="Admin-only billing view" icon={<CreditCard size={22} />} />
        )}
      </section>

      {report.permissions?.can_view_financials && (
        <section className="reports-summary">
          <SummaryCard title="Total Billed" value={money(report.summary.total_billed)} note="Admin only" icon={<CreditCard size={22} />} />
          <SummaryCard title="Total Paid" value={money(report.summary.total_paid)} note="Admin only" icon={<CreditCard size={22} />} />
        </section>
      )}

      <section className="reports-grid">
        <div className="reports-panel">
          <div className="reports-panel-header"><div><h2>Tickets by Status</h2><p>Open and closed ticket distribution</p></div></div>
          <div className="reports-status-chart">
            {statusRows.map((item) => {
              const count = Number(report.tickets_by_status?.[item.key] || 0);
              const width = count ? Math.max(7, (count / maxStatusCount) * 100) : 0;
              return (
                <div className="reports-status-row" key={item.key}>
                  <div className="reports-status-name"><span>{item.label}</span><strong>{count}</strong></div>
                  <div className="reports-status-track"><div className={`reports-status-bar ${item.key}`} style={{ width: `${width}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="reports-panel">
          <div className="reports-panel-header"><div><h2>Performance Focus</h2><p>Closed-ticket output is used for technician comparison</p></div></div>
          <div className="reports-overview">
            <div><Users size={23} /><span>Customers</span><strong>{report.summary.total_customers}</strong></div>
            <div><UserCog size={23} /><span>Technicians</span><strong>{report.summary.total_technicians}</strong></div>
            <div><Ticket size={23} /><span>Open Tickets</span><strong>{report.summary.open_tickets}</strong></div>
          </div>
        </div>
      </section>

      <section className="reports-panel reports-wide">
        <div className="reports-panel-header">
          <div><h2>Technician Performance</h2><p>Compare closed tickets and workload over the selected period</p></div>
        </div>
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead><tr><th>Technician</th><th>Employee ID</th><th>Assigned</th><th>Open</th><th>Closed</th><th>Closure Rate</th></tr></thead>
            <tbody>
              {!report.technician_performance?.length ? (
                <tr><td colSpan="6" className="reports-empty-cell">No technician data for this period.</td></tr>
              ) : report.technician_performance.map((item) => (
                <tr key={item.technician_id}>
                  <td><strong>{item.technician_name}</strong></td>
                  <td>{item.employee_id}</td>
                  <td>{item.total_tickets}</td>
                  <td>{item.active_tickets}</td>
                  <td><strong>{item.closed_tickets}</strong></td>
                  <td>{item.closure_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-grid">
        <HistoryPanel title="Customer Service History" subtitle="Most active customers">
          <table className="reports-table">
            <thead><tr><th>Customer</th><th>Tickets</th><th>Closed</th></tr></thead>
            <tbody>
              {!report.customer_history?.length ? <EmptyRow span="3" text="No customer history." /> : report.customer_history.map((item) => (
                <tr key={item.customer_id}><td><strong>{item.customer_name}</strong></td><td>{item.total_tickets}</td><td>{item.completed_tickets}</td></tr>
              ))}
            </tbody>
          </table>
        </HistoryPanel>

        <HistoryPanel title="Equipment Service History" subtitle="Equipment with service activity">
          <table className="reports-table">
            <thead><tr><th>Equipment</th><th>Serial #</th><th>Tickets</th></tr></thead>
            <tbody>
              {!report.equipment_history?.length ? <EmptyRow span="3" text="No equipment history." /> : report.equipment_history.map((item) => (
                <tr key={item.equipment_id}><td><strong>{item.equipment_name}</strong></td><td>{item.serial_number || "—"}</td><td>{item.total_tickets}</td></tr>
              ))}
            </tbody>
          </table>
        </HistoryPanel>
      </section>

      <section className="reports-panel reports-wide">
        <div className="reports-panel-header">
          <div><h2>Recent Tickets</h2><p>Latest matching service requests</p></div>
          <button type="button" className="reports-view-tickets" onClick={() => navigate("/tickets")}>View Tickets</button>
        </div>
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead><tr><th>Ticket</th><th>Subject</th><th>Customer</th><th>Technicians</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {!report.recent_tickets?.length ? <EmptyRow span="7" text="No tickets found." /> : report.recent_tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td><strong className="reports-ticket-number">{ticket.ticket_number}</strong></td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.customer_name}</td>
                  <td>{ticket.technician_name || "Unassigned"}</td>
                  <td><span className={`reports-priority ${ticket.priority}`}>{ticket.priority}</span></td>
                  <td><span className={`reports-ticket-status ${ticket.status}`}>{ticket.status === "closed" ? "Closed" : "Open"}</span></td>
                  <td><div className="reports-date"><CalendarDays size={13} />{formatDate(ticket.created_at)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ title, value, note, icon }) {
  return (
    <div className="reports-summary-card">
      <div><span>{title}</span><strong>{value}</strong><p>{note}</p></div>
      <div className="reports-icon">{icon}</div>
    </div>
  );
}

function HistoryPanel({ title, subtitle, children }) {
  return (
    <div className="reports-panel">
      <div className="reports-panel-header"><div><h2>{title}</h2><p>{subtitle}</p></div><Wrench size={18} /></div>
      <div className="reports-table-wrapper">{children}</div>
    </div>
  );
}

function EmptyRow({ span, text }) {
  return <tr><td colSpan={span} className="reports-empty-cell">{text}</td></tr>;
}

export default Reports;