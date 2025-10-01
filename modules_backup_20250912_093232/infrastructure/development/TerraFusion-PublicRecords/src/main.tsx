import React from 'react';
import ReactDOM from 'react-dom/client';
import ChampionshipPortal from './ChampionshipPortal';
import './index.css';

const root = document.getElementById('root');

if (root) {ReactDOM.createRoot(root).render(
    <React.StrictMode><ChampionshipPortal /></React.StrictMode>
  );}
