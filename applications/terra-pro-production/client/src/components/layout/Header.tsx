import { useCallback } from "react";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  currentReport?: string;
  userName?: string;
}

export default function Header({
  currentReport = "123 Main Street",
  userName = "John Appraiser",
}: HeaderProps) {
  const [location, setLocation] = useLocation();

  const isActive = useCallback(
    (path: string) => {
      return location === path;
    },
    [location]
  );

  return (
    <header className="bg-primary text-white shadow-md z-10">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center">
          <svg className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><>

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <h1
</> className="text-xl font-medium">AppraisalCore</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="flex items-center text-sm px-3 py-1 rounded hover:bg-primary-dark"><>

              <span>Current Report: {currentReport}</span>
              <svg
</> className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-1 rounded hover:bg-primary-dark" title="Save to cloud">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
            <button className="p-1 rounded hover:bg-primary-dark" title="Export report">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            </button>
            <button className="p-1 rounded hover:bg-primary-dark" title="Settings">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <div className="relative group">
              <button className="flex items-center space-x-1 p-1 rounded hover:bg-primary-dark"><>

                <span>{userName}</span>
                <svg
</> className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-primary-dark">
        <Link href="/form">
          <span
            className={`px-4 py-2 text-white cursor-pointer ${isActive("/form") ? "bg-primary font-medium" : "hover:bg-primary"}`}
          >
            Form
          </span>
        </Link>
        <Link href="/comps">
          <span
            className={`px-4 py-2 text-white cursor-pointer ${isActive("/comps") ? "bg-primary font-medium" : "hover:bg-primary"}`}
          >
            Comps
          </span>
        </Link>
        <Link href="/photos">
          <span
            className={`px-4 py-2 text-white cursor-pointer ${isActive("/photos") ? "bg-primary font-medium" : "hover:bg-primary"}`}
          >
            Photos
          </span>
        </Link>
        <Link href="/sketches">
          <span
            className={`px-4 py-2 text-white cursor-pointer ${isActive("/sketches") ? "bg-primary font-medium" : "hover:bg-primary"}`}
          >
            Sketches
          </span>
        </Link>
        <Link href="/reports">
          <span
            className={`px-4 py-2 text-white cursor-pointer ${isActive("/reports") ? "bg-primary font-medium" : "hover:bg-primary"}`}
          >
            Reports
          </span>
        </Link>
        <Link href="/compliance">
          <span
            className={`px-4 py-2 text-white cursor-pointer ${isActive("/compliance") ? "bg-primary font-medium" : "hover:bg-primary"}`}
          >
            Compliance
          </span>
        </Link>
      </div>
    </header>
  );
}
