import React from 'react'
import {Link} from "react-router-dom"
import "./NotFound.css" 

const NotFound = () => {
  return (
    <section className='not-found-page-container'>
            <div className="not-found-content">
                <svg className="not-found-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19S3 15.4183 3 11 6.58172 3 11 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h1>404</h1>
                <p>Page Not Found</p>
                <p>Sorry, the page you're looking for doesn't exist.</p>
                <Link to="/" className="btn btn-primary">Go Back Home</Link>
            </div>
    
        </section>
  )
}

export default NotFound