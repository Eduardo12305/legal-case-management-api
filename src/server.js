require('dotenv').config();
const app = require('./app.jsx');
const env = require('./config/env.jsx');

app.listen(env.port, () => {
  console.log(`Server is running on http://localhost:${env.port}`);
});
