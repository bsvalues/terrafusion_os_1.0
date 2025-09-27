import React from 'react';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App';
import Monitoring from './pages/Monitoring';

const Router: React.FC = () =>{
  return (<BrowserRouter><Routes><Route path='/' element={<App />} /><Route path='/monitoring' element={<Monitoring />} /><Route path='/modules/*' element={<div>Module Loading...</div>} /></Routes></BrowserRouter>
  );
};

export default Router;
