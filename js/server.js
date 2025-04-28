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


// Register New User Endpoint
// Endpoint to handle user registration
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, password, role, contactType, contactInfo } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    try {
        // Step 1: Check if email already exists
        const checkQuery = 'SELECT * FROM tblUsers WHERE Email = ?';
        db.get(checkQuery, [email], async (err, row) => {
            if (err) {
                console.error("Error during email check:", err);
                return res.status(500).json({ error: "Database error during email check." });
            }

            if (row) {
                return res.status(409).json({ error: "Email already exists." });
            }

            // Step 2: Hash password
            const hashedPassword = await bcrypt.hash(password, intSalt);

            // Step 3: Insert user into tblUsers
            const insertUserQuery = `
                INSERT INTO tblUsers (FirstName, LastName, Email, Password, CreationDateTime, Role)
                VALUES (?, ?, ?, ?, datetime('now'), ?)
            `;
            db.run(insertUserQuery, [firstName, lastName, email, hashedPassword, role], function (err) {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).json({ error: "Database error during user insertion." });
                }

                // Step 4 (optional): Insert contact info if student
                if (role === 'student' && contactType && contactInfo) {
                    let socialInsertQuery = '';
                    let socialType = '';

                    if (contactType === 'mobile') {
                        // If mobile, insert into tblPhone
                        const phoneInsertQuery = `
                            INSERT INTO tblPhone (NationCode, AreaCode, PhoneNumber, Status, UserEmail)
                            VALUES ('1', '', ?, 'Active', ?)
                        `;
                        db.run(phoneInsertQuery, [contactInfo, email], function (err) {
                            if (err) {
                                console.error("Error inserting phone contact:", err);
                                return res.status(500).json({ error: "Database error during phone insertion." });
                            }
                            return res.status(201).json({ message: "User and phone contact registered successfully." });
                        });
                    } else if (contactType === 'discord' || contactType === 'teams') {
                        // If Discord or Teams, insert into tblSocials
                        const socialInsertQuery = `
                            INSERT INTO tblSocials (SocialType, UserName, UserEmail)
                            VALUES (?, ?, ?)
                        `;
                        db.run(socialInsertQuery, [contactType, contactInfo, email], function (err) {
                            if (err) {
                                console.error("Error inserting social contact:", err);
                                return res.status(500).json({ error: "Database error during social contact insertion." });
                            }
                            return res.status(201).json({ message: "User and social contact registered successfully." });
                        });
                    } else {
                        return res.status(400).json({ error: "Invalid contact type." });
                    }
                } else {
                    // No extra contact info needed (e.g., instructor)
                    return res.status(201).json({ message: "User registered successfully." });
                }
            });
        });

    } catch (error) {
        console.error("Unexpected error during registration:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});



app.get('/',(req,res,next) => {
    res.status(200).json({message:"Server is working"})
})


app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})