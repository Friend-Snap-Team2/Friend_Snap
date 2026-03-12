const express = require('express');
const app = express();
require('dotenv').config();

const authRoutes = require('./routes/auth');


app.use(express.json());        //reads incoming data
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});