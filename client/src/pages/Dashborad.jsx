import logo from "../assets/logo.png"
import {NavLink ,Outlet} from "react-router-dom" 
import MainContent from "../components/MainContent"
import "./Dashborad.css"

const Dashborad = () => {
  return (
    <section className="app">
        <header className="header">
            <div className="img-container">
                <img src={logo} alt="logo" />
            </div>

            <div className="btn-container">
                <button className="logout-btn">Log Out</button>
                
                <svg style={{color: "#ffff"}} width="40px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path  fill="#bccce6" d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg>

            </div>
        </header>

        <aside className="sidebar">
            <nav>
                <NavLink  className="nav-item" to="/dashborad">Dashborad</NavLink>
                <NavLink  className="nav-item" to="/dashborad/feedbackes">All Feedback</NavLink>
                <NavLink  className="nav-item" to="/">Categortes</NavLink>
                <NavLink  className="nav-item" to="/">Chat With Al</NavLink>
                <NavLink  className="nav-item" to="/">Settings</NavLink>
            </nav>
        </aside>

        {/* <MainContent /> */}
        <Outlet />
    </section>
  )
}

export default Dashborad