import qrCode from "../assets/qr code.png"
import "./MainContent.css"

function MainContent() {
  return (
    <main className="content">
            <h1 className="main-heading">Dashboard</h1>

            <div className="qr-container">
                <div className="qr-content">
                    <h2 className="qr-heading">Share your feedback link</h2>
                    <p>Share this OR code or link With your customers to collect feedback.</p>
                    <div className="btn-container">
                        <button className="btn btn-one">Cop Link</button>
                        <button className="btn btn-two">Download QR</button>
                    </div>
                </div>

                <div className="qr-code">
                    <img src={qrCode} alt="feedback qr code" />
                </div>
            </div>

            <div className="total-feedback">
              <p>Total Feedback Received</p>
              <h1>123</h1>
            </div>

            <div className="latest-feedback">
              <h3>Latest Feedback</h3>
            </div>
    </main>
  )
}

export default MainContent