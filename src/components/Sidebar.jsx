import React from 'react';

const Sidebar = ({ onLogout }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                Tech<span>Panel</span>
            </div>
            <nav className="side-nav">
                <a href="#" className="active">🏠 Pulpit</a>
                <a href="#">📘 Moje Kursy</a>
                <a href="#">📁 Pliki</a>
                <a href="#">📝 Egzaminy</a>
            </nav>
            <button className="logout-btn" onClick={onLogout}>
                Wyloguj się
            </button>
        </aside>
    );
};

export default Sidebar;