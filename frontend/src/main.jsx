import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import all styling stylesheets from our design system
import '../../static/css/base.css'
import '../../static/css/animations.css'
import '../../static/css/style.css'
import '../../static/css/components/navigation/part-sidebar.css'
import '../../static/css/components/weather/part-hero.css'
import '../../static/css/components/weather/part-chart.css'
import '../../static/css/components/weather/part-daily-list.css'
import '../../static/css/components/weather/part-details.css'
import '../../static/css/components/weather/part-gauges.css'
import '../../static/css/components/safety/part-map.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
