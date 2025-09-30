import SentimentOverviewChart from '../components/SentimentOverviewChart';
import CategoryBreakdownChart from '../components/CategoryBreakdownChart';
import TopRecurringIssues from '../components/TopRecurringIssues';
import SentimentByCategoryHeatmap from '../components/SentimentByCategoryHeatmap';
import PriorityAlerts from '../components/PriorityAlerts';
import GrowthRecommendations from '../components/GrowthRecommendations';
import "./AnalyticsPage.css"
import { useState } from 'react';

const AnalyticsPage = () => {
  const [range , setRange] = useState("30")

  const startDate = new Date();
  const endDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(range));

  return (
    <main className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Pro Analysis Dashboard</h1>
        <p>Gain deep insights into your customer feedback with AI-powered analytics</p>
      </div>
      <div className="time-filter">
        <button className={`time-filter-btn ${range === "7" ? "active" : ""}`} onClick={() => setRange("7")}>Last 7 Days</button>
        <button className={`time-filter-btn ${range === "30" ? "active" : ""}`} onClick={() => setRange("30")}>Last 30 Days</button>
        <button className={`time-filter-btn ${range === "90" ? "active" : ""}`} onClick={() => setRange("90")}>Last 90 Days</button>
      </div>

      <div className="analytics-grid">
        <div className="analytics-row">
          <SentimentOverviewChart startDate={startDate} range={range} endDate={endDate}/>
          <CategoryBreakdownChart startDate={startDate} range={range} endDate={endDate}/>
        </div>

        <div className="analytics-row">
          <TopRecurringIssues startDate={startDate} range={range} endDate={endDate}/>
          <SentimentByCategoryHeatmap startDate={startDate} range={range} endDate={endDate}/>
        </div>

        <div className="analytics-row">
          <PriorityAlerts />
          <GrowthRecommendations />
        </div>
      </div>
    </main>
  );
};

export default AnalyticsPage;