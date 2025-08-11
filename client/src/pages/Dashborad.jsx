import logo from "../assets/logo.png"
import {NavLink ,Outlet} from "react-router-dom" 
import MainContent from "../components/MainContent"
import "./Dashborad.css"

// The Dashboard component serves as the main layout for the application after a user logs in.
// It includes a persistent header and sidebar, with a main content area that renders nested routes.
const Dashborad = () => {
    // A placeholder function to handle user logout.
    // In a real application, this would clear authentication tokens and redirect the user.
  const handleLogout = () => {
    console.log("User logged out");
    // Example: remove token from localStorage and redirect
    // localStorage.removeItem("authToken");
    // window.location.href = "/login";
  };

  return (
     // The root element uses a CSS Grid layout to structure the page.
     // It's divided into a header, sidebar, and main content area.
    <section className="app">
        {/* The header is sticky and contains the logo, a logout button, and a user profile icon. */}
        <header className="header">
            <div className="img-container">
                <img src={logo} alt="logo" />
            </div>

            <div className="btn-container">
                 {/* The logout button triggers the handleLogout function when clicked. */}
                <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                
                {/* A user profile icon is displayed using an inline SVG. */}
                <svg style={{color: "#ffff"}} width="40px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path  fill="#bccce6" d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg>

            </div>
        </header>

         {/* The sidebar contains the primary navigation links for the dashboard. */}
        <aside className="sidebar">
            <nav>
                 {/* Each NavLink directs to a different section of the dashboard.
                 The 'end' prop on the first NavLink ensures it's only active on the exact path. */}
                <NavLink className="nav-item" to="/dashborad" end>Dashborad</NavLink>
                <NavLink className="nav-item" to="/dashborad/feedbackes">All Feedback</NavLink>
                <NavLink className="nav-item" to="/dashborad/categories">Categories</NavLink>
                <NavLink className="nav-item" to="/dashborad/chat-ai">Chat With AI</NavLink>
                <NavLink className="nav-item" to="/dashborad/settings">Settings</NavLink>
            </nav>
        </aside>

        {/* The Outlet component from react-router-dom renders the content of nested routes.
         This is where components like MainContent and AllFeedbacks will be displayed. */}
        <Outlet />
    </section>
  )
}

export default Dashborad