import { useState } from "react";

interface SidebarSectionProps {
  title: string;
  items?: string[];
  isOpen?: boolean;
  activePath?: string;
  onItemClick?: (item: string) => void;
}

function SidebarSection({
  title,
  items = [],
  isOpen = false,
  activePath = "",
  onItemClick,
}: SidebarSectionProps) {
  const [expanded, setExpanded] = useState(isOpen);

  return (
    <div className="mb-4">
      <h3
        className="flex items-center justify-between px-2 py-1 text-sm font-medium text-neutral-dark cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      ><>

        <span>{title}</span>
        <svg
</>
          className={`h-4 w-4 transform ${expanded ? "rotate-0" : "-rotate-90"} transition-transform duration-200`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </h3>

      {expanded && (
        <ul className="mt-1 ml-2">
          {items.map((item) => (
            <li key={item}>
              <button
                className={`block w-full text-left px-2 py-1 text-sm ${activePath === item ? "text-primary" : "text-neutral-gray hover:text-primary"}`}
                onClick={() => onItemClick?.(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SidebarProps {
  activePath?: string;
  onSectionItemClick?: (section: string, item: string) => void;
}

export default function Sidebar({ activePath = "Subject", onSectionItemClick }: SidebarProps) {
  const handleItemClick = (section: string, item: string) => {
    onSectionItemClick?.(section, item);
  };

  return (
    <aside className="w-64 bg-white shadow-md z-10 flex flex-col border-r border-neutral-medium">
      <div className="p-4 border-b border-neutral-medium">
        <div className="relative">
          <input
            type="text"
            placeholder="Search fields..."
            className="w-full px-3 py-2 pl-8 border border-neutral-medium rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <svg
            className="h-4 w-4 text-neutral-gray absolute left-2.5 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2">
          <SidebarSection
            title="PROPERTY INFORMATION"
            items={["Subject", "Contract", "Neighborhood", "Site", "Improvements"]}
            isOpen={true}
            activePath={activePath}
            onItemClick={(item) => handleItemClick("PROPERTY INFORMATION", item)}
          />

          <SidebarSection
            title="SALES COMPARISON"
            items={["Comparable Selection", "Adjustments Grid", "Market Analysis"]}
            isOpen={true}
            activePath={activePath}
            onItemClick={(item) => handleItemClick("SALES COMPARISON", item)}
          />

          <SidebarSection
            title="COST APPROACH"
            items={[]}
            isOpen={false}
            onItemClick={(item) => handleItemClick("COST APPROACH", item)}
          />

          <SidebarSection
            title="INCOME APPROACH"
            items={[]}
            isOpen={false}
            onItemClick={(item) => handleItemClick("INCOME APPROACH", item)}
          />

          <SidebarSection
            title="RECONCILIATION"
            items={[]}
            isOpen={false}
            onItemClick={(item) => handleItemClick("RECONCILIATION", item)}
          />

          <SidebarSection
            title="ATTACHMENTS"
            items={[]}
            isOpen={false}
            onItemClick={(item) => handleItemClick("ATTACHMENTS", item)}
          />
        </div>
      </nav>

      <div className="p-4 border-t border-neutral-medium">
        <button className="w-full bg-primary text-white py-2 rounded-md flex items-center justify-center shadow-sm hover:bg-primary-dark">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      </div>
    </aside>
  );
}
