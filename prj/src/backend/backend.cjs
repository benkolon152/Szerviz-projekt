const express = require('express');
const app = express();
const port = 3333;
const cors = require('cors');

app.use(cors());
app.use(express.json());



app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});