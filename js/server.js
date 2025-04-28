const express = require('express')
const cors = require('cors')
const {v4:uuidv4} = require('uuid')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const intSalt = 10;

const dbSource = "Peer_Assessment.db" // Should go back to the root directory to access the database file, may need to update in future.
const HTTP_PORT = 8000
const db = new sqlite3.Database(dbSource)

var app = express()
app.use(cors())
app.use(express.json())

//Use a post here since we are accepting user input as the login and password to validate, but do not update anything in the database.
app.post('/validateUserLogin', (req, res, next) =>{
    const { username, password } = req.body
    

    const query = 'SELECT * FROM tblUsers WHERE email = ?'
    db.get(query, [username], (err, row) => {
        if (err) {
            //Interal server error.
            return res.status(500).json({ error: "Error in connecting to database."})
        }

        if (!row){
            //Not found error.
            return res.status(404).json({ error: "Email not found in the database."})
        }

        bcrypt.compare(password, row.Password, (err, userFound) => {
            if (err) {
                //Interal server error.
                return res.status(500).json({ error: "Error in connecting to database."})
            }
            if(userFound){
                return res.status(200).json({
                    message: "Login successful",
                    // For now only returns some data.
                    user: { UserId: row.UserId, FirstName: row.FirstName, LastName: row.LastName, Email: row.Email }
                })
            }
            else{
                // Unauthorized
                return res.status(401).json({ error: 'Invalid Password..'})
            }
        })
    })
})


app.get('/',(req,res,next) => {
    res.status(200).json({message:"Server is working"})
})


app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})