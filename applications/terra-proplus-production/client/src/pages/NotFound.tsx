import { Link } from 'react-router-dom';
import { Home, AlertCircle  } from '@mui/icons-material';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
      <div className="mb-6 text-red-500"><>

        <AlertCircle size={80} />
      </div>
      <h1
</> className="text-3xl font-bold mb-2">404 - Page Not Found</h1><>

      <p className="text-gray-600 mb-8 max-w-md">
        The page you were looking for doesn't exist or has been moved.
      </p>
      <Link
</> to="/" className="btn btn-primary inline-flex items-center">
        <Home className="w-5 h-5 mr-2" />
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;