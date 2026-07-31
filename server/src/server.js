require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { startScheduler } = require("./services/scheduler/scheduler.service");
const { startWeeklyReportScheduler } = require("./services/notification/weeklyReport.scheduler");

connectDB();
startScheduler();
startWeeklyReportScheduler();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});