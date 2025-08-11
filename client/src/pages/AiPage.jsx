import "./AiPage.css"



const AiPage = () => {
  return (
    <section className="ai-app">
      <div className="ai-container">
          <div className="ai-chat-header">
              <h1>Ask InsightBot</h1>
              <p>Your Al assistant for customer feedback.</p>
          </div>
          <div className="ai-play-ground">

          </div>
          <form action="" id="ai-form">
              <input type="text" name="user-prompt" id="chat-input" placeholder="Ask something about your feedbace."/>
              <button className="ai-chat-send-btn btn">send</button>
          </form>
        </div>
    </section>
  )
}

export default AiPage;