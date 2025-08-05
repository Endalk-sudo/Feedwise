import { Link } from "react-router-dom";
import "./HomePage.css";


const HomePage = () => {
  return (
    <section className='home'>
      <div className='container'>
        <h1>Welcome to AI Feedback Collector</h1>
        <p>
          Collect, manage, and act on feedback efficiently. Use the navigation to submit new feedback
          or browse existing responses.
        </p>
        <div className='actions'>
          <Link className='btn btn-primary' to='/feedback'>Get Started</Link>
        </div>
      </div>
    </section>
  )
}

export default HomePage