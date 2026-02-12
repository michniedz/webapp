import React from 'react';

const Navbar = ({ onLogin }) => {
    return (
        <nav className="navbar">
            <div className="logo">
                Tech<span>Edu</span>.js
            </div>
            <ul className="nav-links">
                <li><a href="#home">Start</a></li>
                <li><a href="#kursy">Kursy</a></li>
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