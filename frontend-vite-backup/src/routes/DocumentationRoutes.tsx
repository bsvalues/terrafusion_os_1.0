import React from 'react';
import {Routes, Route} from 'react-router-dom';

// Simple placeholder component since we've excluded components-enhanced for now
const DocumentationHub = () => (<div style={{ padding: '2rem', textAlign: 'center'}}><h1>Documentation Hub</h1><p>Terrafusion OS Documentation - Coming Soon</p></div>);

const DocumentationRoutes: React.FC = () => {
  return (<Routes><Route path='/docs' element={<DocumentationHub />} /><Route path='/docs/api' element={<DocumentationHub />} /><Route path='/docs/tutorials' element={<DocumentationHub />} /><Route path='/docs/videos' element={<DocumentationHub />} /></Routes>
  );
};

export default DocumentationRoutes;
