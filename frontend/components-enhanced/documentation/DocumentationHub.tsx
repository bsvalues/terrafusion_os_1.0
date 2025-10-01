import React from 'react';
import {Box, Container, Typography, Breadcrumbs, Link} from '@mui/material';
import {Home, Description} from '@mui/icons-material';
import InteractiveAPIDocumentation from '../../../docs/api/interactive-docs/InteractiveAPIDocumentation';

const DocumentationHub: React.FC = () =>{
  return (<Box sx={{ minHeight: '100vh', bgcolor: 'background.default'}}><Container maxWidth="xl" sx={{ py: 3}}><Breadcrumbs sx={{ mb: 3}}><Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center'}}
            color="inherit"
            href="/"
          ><><Home sx={{ mr: 0.5}} fontSize="inherit" />Terrafusion OS</Link><Typography
</>

            sx={{ display: 'flex', alignItems: 'center'}}
            color="text.primary"
          ><Description sx={{ mr: 0.5}} fontSize="inherit" />API Documentation</Typography></Breadcrumbs><InteractiveAPIDocumentation /></Container></Box>
  );
};

export default DocumentationHub;
