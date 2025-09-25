import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './NavBar.css';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggle = () => {
    setIsOpen((p) => !p);
  }
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);
  
  // Helper function to handle navigation
  const handleNavClick = (href) => {
    setIsOpen(false);
    if (href.startsWith('#') && location.pathname === '/') {
      // Scroll to section on home page
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (href.startsWith('#')) {
      // Navigate to home page and scroll
      window.location.href = '/' + href;
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="ai-logo" onClick={() => setIsOpen(false)}>
        Feedback<span className="logo-color">AI</span>
      </Link>
      <ul className={`nav-links ${isOpen ? "expand" : ""}`}>
        <li><a href="#features" onClick={() => handleNavClick('#features')}>Features</a></li>
        <li><Link to="/payment" onClick={() => setIsOpen(false)}>Pricing</Link></li>
        <li><Link to="/login" onClick={() => setIsOpen(false)}>Login</Link></li>
        <Link to="/register" className="cta-link" onClick={() => setIsOpen(false)}>
          <button className="btn cta-primary-btn">Get Started</button>
        </Link>
      </ul>
      <button
        onClick={toggle}
        className="open"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="nav-links"
        tabIndex={0}
        role="button"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>
    </nav>
  );
};

export default NavBar;
