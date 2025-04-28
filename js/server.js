const express = require('express')
const cors = require('cors')
const {v4:uuidv4} = require('uuid')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const intSalt = 10;

const dbSource = "../Peer_Assessment.db" // Should go back to the root directory to access the database file, may need to update in future.
const HTTP_PORT = 8000
const db = new sqlite3.Database(dbSource)

var app = express()
app.use(cors())
app.use(express.json())


app.get('/',(req,res,next) => {
    res.status(200).json({message:"Server is working"})
})


app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})