import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search, ArrowUpDown  } from '@mui/icons-material';

export default function Comparables() {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-2xl font-bold text-gray-800">Comparable Properties</h1>
          <p
</> className="text-gray-600">Manage and analyze comparable properties for your appraisals</p>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><>

              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
</>
              type="text"
              className="form-input pl-10"
              placeholder="Search comparables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" /><>

          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Comparable Properties Found</h3>
          <p
</> className="text-gray-500 mb-6">
            Comparable properties will appear here after they are added to an appraisal.
          </p>
          <Link to="/properties" className="btn btn-primary">
            Browse Properties
          </Link>
        </div>
      </div>
    </div>
  );
}