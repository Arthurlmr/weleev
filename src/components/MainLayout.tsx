import { Outlet, NavLink } from 'react-router-dom';
import { Home, Heart, User } from 'lucide-react';
import './MainLayout.css';

export function MainLayout() {
  return (
    <div className="main-layout">
      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/feed" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Explorer</span>
        </NavLink>

        <NavLink to="/favorites" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Heart size={24} />
          <span>Favoris</span>
        </NavLink>

        <NavLink to="/account" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>Compte</span>
        </NavLink>
      </nav>
    </div>
  );
}
