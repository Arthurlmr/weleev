import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="main-layout">
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
