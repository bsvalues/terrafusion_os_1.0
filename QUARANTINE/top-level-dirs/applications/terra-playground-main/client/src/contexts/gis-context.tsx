// This file is a redirect to the main GIS context
// It exists to avoid having to update all the imports in the codebase
// as we move the GIS context to a more appropriate location

import { useGIS, GISProvider } from '@/modules/gis/contexts/GISContext';

export { useGIS, GISProvider };
