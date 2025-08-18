import logo from "../assets/logo.png";
import { NavLink, Outlet } from "react-router-dom";
import "./Dashborad.css";
import { useState } from "react";

// The Dashboard component serves as the main layout for the application after a user logs in.
// It includes a persistent header and sidebar, with a main content area that renders nested routes.

const Dashborad = () => {
    // Sidebar open/close state for mobile screens
    // When true, sidebar slides in; when false, sidebar is hidden (on small screens)
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Handles user logout (placeholder)
    const handleLogout = () => {
        console.log("User logged out");
        // Example: remove token from localStorage and redirect
        // localStorage.removeItem("authToken");
        // window.location.href = "/login";
    };

    // Toggles sidebar open/close state (used by hamburger/close button on mobile)
    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
        console.log("toggle is fired")
    };

    // Closes sidebar when a navigation link is clicked (for better mobile UX)
    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    return (
        <section className="app">
            {/* Header contains logo, logout button, profile icon, and sidebar toggle button (visible on mobile) */}
            <header className="header">
                <div className="header-left">
                    {/* Sidebar toggle button (hamburger/close icon) for mobile screens */}
                    <ToggleButton sidebarOpen={sidebarOpen} handleSidebarToggle={handleSidebarToggle} />
                    {/* Logo */}
                    <div className="img-container">
                        <img src={logo} alt="AI Feedback Logo" />
                    </div>
                </div>

                <div className="btn-container">
                    {/* Logout button */}
                    <button className="logout-btn" onClick={handleLogout}>
                        Log Out
                    </button>
                    {/* User profile icon */}
                    <div className="user-profile-icon">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                </div>
            </header>

            {/* Sidebar navigation: collapsible on mobile, always visible on desktop */}
            {/* 'open' class is added when sidebarOpen is true, sliding sidebar in on mobile */}
            <aside className={`sidebar ${sidebarOpen ? " open" : ""}`}>
                  {sidebarOpen && (<div className="sidebar-header">
                    <h1>Dashborad</h1>
                    <ToggleButton sidebarOpen={sidebarOpen} handleSidebarToggle={handleSidebarToggle} />
                  </div> )} 
                <nav>
                    {/* Enhanced navigation items with emoji icons and better UX */}
                    <NavLink className="nav-item" data-icon="dashboard" to="/dashborad" end onClick={handleNavClick}>
                        <span>📊</span>
                        Dashboard
                    </NavLink>
                    <NavLink className="nav-item" data-icon="feedback" to="/dashborad/feedbackes" onClick={handleNavClick}>
                        <span>💬</span>
                        All Feedback
                    </NavLink>
                    <NavLink className="nav-item" data-icon="categories" to="/dashborad/categories" onClick={handleNavClick}>
                        <span>📁</span>
                        Categories
                    </NavLink>
                    <NavLink className="nav-item" data-icon="chat" to="/dashborad/chat-ai" onClick={handleNavClick}>
                        <span>🤖</span>
                        Chat With AI
                    </NavLink>
                    <NavLink className="nav-item" data-icon="settings" to="/dashborad/settings" onClick={handleNavClick}>
                        <span>⚙️</span>
                        Settings
                    </NavLink>
                </nav>
            </aside>

            {/* Main content area for nested routes (renders child pages) */}
            <Outlet />
        </section>
    );
};

export default Dashborad;


const ToggleButton = ({sidebarOpen, handleSidebarToggle})=>{
    return(
        <button
                        className="sidebar-toggle-btn"
                        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                        onClick={handleSidebarToggle}
                    >
                        {/* Shows close icon if sidebar is open, hamburger if closed */}
                        {sidebarOpen ? (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bccce6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bccce6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        )}
                </button>
    )
}