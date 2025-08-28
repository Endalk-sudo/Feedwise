import { NavLink, Outlet,useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useState,useContext } from "react";
import AuthContext from "../AuthContext";

// The Dashboard component serves as the main layout for the application after a user logs in.
// It includes a persistent header and sidebar, with a main content area that renders nested routes.
// NEW FEATURE: It also handles showing the OrganizationModal to new users before accessing the dashboard.

const Dashboard = () => {
    // Sidebar open/close state for mobile screens
    // When true, sidebar slides in; when false, sidebar is hidden (on small screens)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const {logout} = useContext(AuthContext)

     const navigate = useNavigate()

    // Handles user logout (placeholder)
    const handleLogout = () => {
        console.log("User logged out");
        logout()
        navigate("/auth")
    };

    // Toggles sidebar open/close state (used by hamburger/close button on mobile)
    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
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
                    <div className="ai-logo">
                        Feedback<span className="logo-color">AI</span>
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
            <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
                <div className="sidebar-header-mobile">
                    <h1>Dashboard</h1>
                </div>
                <nav>
                    {/* Enhanced navigation items with emoji icons and better UX */}
                    <NavLink className="nav-item" data-icon="dashboard" to="/dashboard" end onClick={handleNavClick}>
                        <span>📊</span>
                        Dashboard
                    </NavLink>
                    <NavLink className="nav-item" data-icon="feedback" to="/dashboard/feedbackes" onClick={handleNavClick}>
                        <span>💬</span>
                        All Feedback
                    </NavLink>
                    <NavLink className="nav-item" data-icon="chat" to="/dashboard/chat-ai" onClick={handleNavClick}>
                        <span>🤖</span>
                        Chat With AI
                    </NavLink>
                    <NavLink className="nav-item" data-icon="settings" to="/dashboard/settings" onClick={handleNavClick}>
                        <span>⚙️</span>
                        Settings
                    </NavLink>
                </nav>
            </aside>
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* Main content area for nested routes (renders child pages) */}
            <Outlet />
        </section>
    );
};

export default Dashboard;


// ToggleButton Component
// A reusable button component that shows either a hamburger menu or close icon
// depending on whether the sidebar is open or closed
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