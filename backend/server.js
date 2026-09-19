const express = require('express');
const cors = require('cors');
require('dotenv').config(); 


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


app.use(express.static('Public'));


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});