import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Home, 
  Search, 
  Building, 
  Calculator, 
  Map, 
  FileText 
} from 'lucide-react';
import { TFFlex } from '@terrafusion';

const NavContainer = styled.nav`
  display: flex;
  gap: var(--tf-spacing-sm);
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--tf-spacing-xs);
  padding: var(--tf-spacing-sm) var(--tf-spacing-md);
  border-radius: var(--tf-radius-md);
  color: var(--tf-color-gray);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  
  &:hover {
    color: var(--tf-color-light);
    background: rgba(0, 153, 255, 0.1);
    border-color: rgba(0, 153, 255, 0.2);
  }
  
  &.active {
    color: var(--tf-color-light);
    background: var(--tf-color-primary);
    border-color: var(--tf-color-primary);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

export const Navigation: React.FC = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/assessment', label: 'Assessment', icon: Calculator },
    { path: '/gis', label: 'GIS', icon: Map },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <NavContainer>
      {navItems.map(({ path, label, icon: Icon }) => (
        <NavItem key={path} to={path}>
          <Icon />
          <span>{label}</span>
        </NavItem>
      ))}
    </NavContainer>
  );
};