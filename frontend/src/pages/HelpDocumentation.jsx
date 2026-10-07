import {
  BookOpen,
  Search,
  LayoutDashboard,
  Users,
  MapPin,
  Monitor,
  ShieldCheck,
  KeyRound,
  Ticket,
  UserCog,
  CreditCard,
  BarChart3,
  ClipboardList,
  Settings,
  FileText,
  CircleHelp,
  LogIn,
} from "lucide-react";
import { useMemo, useState } from "react";

import PageGuide from "../components/PageGuide";
import "./HelpDocumentation.css";

const SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: LogIn,
    description: "Basic steps for accessing and navigating the application.",
    topics: [
      ["Sign in", "Enter your username and password on the login page. Use the Forgot Password option when you need to reset your credentials."],
      ["Navigation", "Use the grouped sidebar to move between Platform, CRM, Assets, Operations, and Administration areas."],
      ["Signing out", "Use the profile menu and choose Sign out when you finish working, especially on shared computers."],
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description: "Your at-a-glance view of tickets, customers, activity, and scheduled work.",
    topics: [
      ["Summary cards", "Review total tickets, active tickets, resolved tickets, and total customers."],
      ["Tickets Overview", "The chart visualizes ticket activity over the most recent seven-day period."],
      ["Upcoming Service Calendar", "Review scheduled service jobs. Use Open calendar to jump directly to the Tickets calendar view."],
    ],
  },
  {
    id: "customers",
    title: "Customers & Customer Records",
    icon: Users,
    description: "Manage parent companies, contacts, documents, and customer-specific records.",
    topics: [
      ["Search customers", "Type in the search box to narrow the customer list as you work."],
      ["Customer records", "Select a company name to open its record and review related locations, equipment, licenses, warranties, tickets, and billing."],
      ["Documents", "Upload and manage documents at the parent-company level."],
      ["Credit Hold", "A parent company can be marked Active, Inactive, or Credit Hold without deleting or archiving the record."],
    ],
  },
  {
    id: "locations",
    title: "Locations",
    icon: MapPin,
    description: "Manage customer sites, branches, offices, and service locations.",
    topics: [
      ["Search and filters", "Search locations instantly and filter by customer and status."],
      ["Add a location", "Create a site and enter its address, contact, phone, email, status, and notes."],
      ["View a location", "Open a location to see its full address, contact details, and location-specific documents."],
      ["Edit a location", "Update the location details and save changes without leaving the workflow."],
      ["Location Credit Hold", "A single location can be placed on Credit Hold while the parent company remains Active."],
      ["Documents", "Upload and manage documents that belong specifically to the location."],
    ],
  },
  {
    id: "equipment",
    title: "Equipment",
    icon: Monitor,
    description: "Track customer assets and their ownership, installation, and lifecycle details.",
    topics: [
      ["Create equipment", "Enter the customer, location, equipment name/type, manufacturer, model, serial number, asset tag, dates, and notes."],
      ["Ownership", "Use Owned for company-owned equipment, Leased for equipment with a lease arrangement, and Rented for assets owned by the service provider but rented to a customer."],
      ["Lease information", "Use Lease Provider and Lease End Date for true leased equipment. Rented equipment does not require a lease end date."],
      ["Search", "Use the equipment search field to quickly narrow the asset list."],
    ],
  },
  {
    id: "warranties",
    title: "Warranties",
    icon: ShieldCheck,
    description: "Track warranty coverage and important expiry dates.",
    topics: [
      ["Create warranty", "Attach warranty information to the appropriate equipment or customer context."],
      ["Monitor expiry", "Review warranty dates and use the available filters/search tools to locate records."],
    ],
  },
  {
    id: "licenses",
    title: "Licenses",
    icon: KeyRound,
    description: "Manage software or service licenses associated with customers and assets.",
    topics: [
      ["Track licenses", "Record license details, relevant dates, and the customer/equipment relationship."],
      ["Search", "Use the page search to locate license records quickly."],
    ],
  },
  {
    id: "tickets",
    title: "Tickets & Calendar",
    icon: Ticket,
    description: "Manage service requests, assignment, scheduling, and ticket status.",
    topics: [
      ["Create a ticket", "Select a customer using the type-ahead field: type letters and the customer list narrows as you continue typing."],
      ["Search and filters", "Search tickets and refine results by status, priority, or technician."],
      ["Table view", "Use Table to review tickets as a list with sorting/filtering controls."],
      ["Calendar view", "Use Calendar to see service dates and scheduled work. The Dashboard Open calendar link opens this view automatically."],
      ["Ticket lifecycle", "Update status, priority, assignment, service date, and ticket details as work progresses."],
    ],
  },
  {
    id: "technicians",
    title: "Technicians",
    icon: UserCog,
    description: "Manage technicians and the service work assigned to them.",
    topics: [
      ["Technician records", "Review technician information and assignment details."],
      ["Ticket scheduling", "Use technician assignment and service dates to plan field work."],
    ],
  },
  {
    id: "billing",
    title: "Billing",
    icon: CreditCard,
    description: "Review invoices, payments, balances, and outstanding amounts.",
    topics: [
      ["Currency", "Billing is configured to display US Dollars (USD)."],
      ["Invoices", "Review invoice totals, paid amounts, balances, and statuses."],
      ["Outstanding balances", "Use billing summaries to identify unpaid or partially paid amounts."],
    ],
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChart3,
    description: "Review operational and management information for the service organization.",
    topics: [
      ["Run reports", "Use the available filters and reporting controls to focus on the information you need."],
      ["Review trends", "Use report outputs to support service, customer, and operational decisions."],
    ],
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    icon: ClipboardList,
    description: "Review recorded user and system activity for accountability and troubleshooting.",
    topics: [
      ["Review activity", "Use the audit list to see actions such as login, logout, updates, and other recorded events."],
      ["Pagination", "Use the page controls to move through the audit history without losing your place."],
      ["Search", "Use the search/filter controls to narrow the audit results."],
    ],
  },
  {
    id: "administration",
    title: "Administration",
    icon: Settings,
    description: "Control access, user accounts, and system configuration.",
    topics: [
      ["Roles", "Define and review role-based access to application areas."],
      ["Users", "Create and manage user accounts and access."],
      ["Settings", "Configure system preferences such as company details, notification behavior, date formats, timezone, and session timeout."],
    ],
  },
];

function HelpDocumentation() {
  const [query, setQuery] = useState("");

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredSections = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return SECTIONS;

    return SECTIONS.map((section) => {
      const sectionMatch =
        section.title.toLowerCase().includes(value) ||
        section.description.toLowerCase().includes(value);

      const topics = section.topics.filter(([title, text]) =>
        sectionMatch ||
        title.toLowerCase().includes(value) ||
        text.toLowerCase().includes(value)
      );

      if (!sectionMatch && !topics.length) return null;
      return { ...section, topics };
    }).filter(Boolean);
  }, [query]);

  return (
    <div className="help-page">
      <div className="help-container">
        <div className="help-heading">
          <div className="help-heading-icon">
            <BookOpen size={28} />
          </div>
          <div className="help-heading-copy">
            <div className="help-title-row">
              <h1>User Guide</h1>
              <PageGuide
                title="User Guide"
                text="Use this page as a quick reference for each area of the DEV Service Management system. Search the guide or select a section below."
              />
            </div>
            <p>How to use the DEV Service Management system.</p>
          </div>
        </div>

        <div className="help-search-card">
          <Search size={19} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the user guide..."
            aria-label="Search the user guide"
          />
        </div>

        <div className="help-layout">
          <aside className="help-toc">
            <div className="help-toc-title">Contents</div>
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.title}
              </a>
            ))}
          </aside>

          <main className="help-content">
            {filteredSections.length ? (
              filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <section className="help-section" id={section.id} key={section.id}>
                    <div className="help-section-header">
                      <div className="help-section-icon">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h2>{section.title}</h2>
                        <p>{section.description}</p>
                      </div>
                    </div>

                    <div className="help-topic-list">
                      {section.topics.map(([title, text]) => (
                        <article className="help-topic" key={`${section.id}-${title}`}>
                          <div className="help-topic-title">{title}</div>
                          <p>{text}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="help-empty">
                <CircleHelp size={28} />
                <h2>No guide topics found</h2>
                <p>Try a different search term.</p>
              </div>
            )}

            <div className="help-footer-note">
              <FileText size={18} />
              <div>
                <strong>Need more detail?</strong>
                <p>Use the question-mark button beside page titles for quick, page-specific help.</p>
              </div>
            </div>

            <div className="help-back-to-top-wrap">
              <button
                type="button"
                className="help-back-to-top"
                onClick={scrollToTop}
                aria-label="Back to top of the user guide"
              >
                ↑ Back to top
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default HelpDocumentation;
