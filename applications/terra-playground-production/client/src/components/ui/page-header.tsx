interface PageHeaderProps {
  title: string;
  subtitle?: string;
  lastUpdate?: string;
  location?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  lastUpdate = 'Today at 3:45 PM',
  location = 'Benton County, WA',
  actions,
}) => {
  return (
    <div className="bg-gradient-to-r from-primary-blue-light/5 to-primary-blue/10 shadow-md border-b border-primary-blue-light/20">
      <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
        <div className="py-6 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <div>
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold leading-7 text-primary-blue-dark sm:leading-9 sm:truncate tf-font-heading">
                    {title}
                  </h1>
                  {subtitle && (
                    <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-teal-light/20 text-primary-teal-dark">
                      {subtitle}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                  <div className="mt-2 flex items-center text-sm text-primary-blue tf-font-body">
                    <svg
                      className="flex-shrink-0 mr-1.5 h-5 w-5 text-primary-teal"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Last updated: <span className="font-medium">{lastUpdate}</span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-primary-blue tf-font-body">
                    <svg
                      className="flex-shrink-0 mr-1.5 h-5 w-5 text-primary-teal"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    ><>

                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
</> className="font-medium">{location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {actions && <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
