import React from 'react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onLogin }) => {
    return (
        <nav className="navbar">
            <div className="logo">
                Tech<span>Programista</span>
            </div>
            <ul className="nav-links">
                <li><a href="#home">Start</a></li>
                <li><a href="#kursy">Kursy</a></li>
                <li><a href="#o-projekcie">O projekcie</a></li>
                <li><ThemeToggle /></li>
                <li>
                    <button className="login-btn" onClick={onLogin}>
                        Zaloguj się
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
