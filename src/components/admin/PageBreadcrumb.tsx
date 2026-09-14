import { Link } from "react-router-dom";

interface PageBreadcrumbProps {
  pageTitle: string;
  parentTitle?: string;
  parentPath?: string;
}

export default function PageBreadcrumb({
  pageTitle,
  parentTitle,
  parentPath,
}: PageBreadcrumbProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-title-md font-semibold text-gray-800">{pageTitle}</h2>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500"
              to="/admin"
            >
              Panel
              <svg
                className="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          {parentTitle && parentPath && (
            <li>
              <Link
                className="inline-flex items-center gap-1.5 text-sm text-gray-500"
                to={parentPath}
              >
                {parentTitle}
                <svg
                  className="stroke-current"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>
          )}
          <li className="text-sm text-gray-800">{pageTitle}</li>
        </ol>
      </nav>
    </div>
  );
}