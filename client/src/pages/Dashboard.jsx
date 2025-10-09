import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext"; // Fixed import

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };
    const handleUpgrade = () => {
        navigate("/payment");
    }
    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
    };

    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    return (
        <section className="app">
            <header className="header">
                <div className="header-left">
                    <ToggleButton sidebarOpen={sidebarOpen} handleSidebarToggle={handleSidebarToggle} />
                    <div className={`ai-logo close-on-desktop ${sidebarOpen ? "close" : ""}`}>
                        Feedback<span className="logo-color">AI</span>
                    </div>
                </div>
 
                <div className="btn-container">
                     <button className="logout-btn" onClick={handleLogout}>
                        Log Out
                    </button>
                    {  user?.currentPlan === "basic" && <button className="logout-btn upgrade-btn" onClick={handleUpgrade}>
                        Upgrade to <span>PRO</span>
                    </button>}

                </div>
            </header>

            <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
                { !sidebarOpen &&
                    <>
                    <div className="sidebar-header">
                        <div className="header-left">
                            <div className="ai-logo">
                                Feedback<span className="logo-color">AI</span>
                            </div>
                        </div>
                    </div>
                    <hr />
                </>}
                <nav>
                    <NavLink className="nav-item" data-icon="dashboard" to="/dashboard" end onClick={handleNavClick}>
                        <span>📊</span>
                        Dashboard
                    </NavLink>
                    <NavLink className="nav-item" data-icon="feedback" to="/dashboard/feedbackes" onClick={handleNavClick}>
                        <span>💬</span>
                        All Feedback
                    </NavLink>
                    <NavLink className="nav-item" data-icon="analysis" to="/dashboard/pro-analysis" onClick={handleNavClick}>
                        <span>📊</span>
                        {user?.currentPlan === 'pro' ? 'Pro Analysis' : 'Basic Analysis'}
                    </NavLink>
                    {user?.currentPlan === 'pro' && (
                        <>
                            <NavLink className="nav-item" data-icon="chat" to="/dashboard/chat-ai" onClick={handleNavClick}>
                                <span>🤖</span>
                                Chat With AI
                            </NavLink>
                        </>
                    )}
                    <NavLink className="nav-item" data-icon="settings" to="/dashboard/settings" onClick={handleNavClick}>
                        <span>⚙️</span>
                        Settings
                    </NavLink>
                </nav>
                {user?.currentPlan === "basic" && <div className="upgrade-container">
                   <h2>Upgrade to Pro</h2>
                   <p>
                    Get advanced analytics, smart AI insights,  
                    and your personal AI chatbot.  
                    </p>  
                    <button onClick={handleUpgrade} className="logout-btn upgrade-button">Upgrade to Pro</button>
                </div>}
            </aside>
            
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            <Outlet />
        </section>
    );
};

const ToggleButton = ({sidebarOpen, handleSidebarToggle}) => {
    return (
        <button
            className="sidebar-toggle-btn"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            onClick={handleSidebarToggle}
        >
            {sidebarOpen ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bccce6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bccce6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
        </button>
    );
};

export default Dashboard;