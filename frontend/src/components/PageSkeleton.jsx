import "./PageSkeleton.css";

function Block({ className = "", style }) {
  return <div className={`page-skeleton-block ${className}`} style={style} />;
}

export default function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-hidden="true">
      <div className="page-skeleton-header">
        <div>
          <Block className="page-skeleton-title" />
          <Block className="page-skeleton-subtitle" />
        </div>

        <Block className="page-skeleton-action" />
      </div>

      <div className="page-skeleton-filters">
        <Block className="page-skeleton-search" />
        <Block className="page-skeleton-filter" />
        <Block className="page-skeleton-filter small" />
      </div>

      <div className="page-skeleton-card-grid">
        <Block className="page-skeleton-card" />
        <Block className="page-skeleton-card" />
        <Block className="page-skeleton-card" />
      </div>

      <div className="page-skeleton-table">
        <div className="page-skeleton-table-row header">
          <Block />
          <Block />
          <Block />
          <Block />
          <Block />
          <Block />
        </div>

        {Array.from({ length: 7 }).map((_, index) => (
          <div className="page-skeleton-table-row" key={index}>
            <Block />
            <Block />
            <Block />
            <Block />
            <Block />
            <Block />
          </div>
        ))}
      </div>
    </div>
  );
}
