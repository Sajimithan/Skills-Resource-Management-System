const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const personnelRoutes = require('./routes/personnel');
const skillRoutes = require('./routes/skills');
const projectRoutes = require('./routes/projects');
const matchingRoutes = require('./routes/matching');
const dashboardRoutes = require('./routes/dashboard');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/personnel', personnelRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
