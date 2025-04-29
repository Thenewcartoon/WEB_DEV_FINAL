 
const express = require('express')
const cors = require('cors')
const corsOptions = {
    origin: 'http://127.0.0.1:5500',  // ✅ frontend origin
    credentials: true                 // ✅ allow cookies
};
const {v4:uuidv4} = require('uuid')
const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')
const intSalt = 10;

const dbSource = "Peer_Assessment.db" // Should go back to the root directory to access the database file, may need to update in future.
const HTTP_PORT = 8000
const db = new sqlite3.Database(dbSource)

var app = express()
app.use(cors(corsOptions))
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


// Create a new course
app.post('/createCourse', (req, res) => {
    const { courseName, courseCode, courseSection, joinCode } = req.body;

    if (!courseName || !courseCode || !courseSection || !joinCode) {
        return res.status(400).json({ error: "Missing required fields to create course." });
    }

    const checkQuery = 'SELECT * FROM tblCourses WHERE CourseNumber = ?'; //CourseNumber is the same thing as CourseCode
    db.get(checkQuery, [courseCode], (err, row) => {
        if (err) {
            console.error("Error checking for existing course:", err);
            return res.status(500).json({ error: "Database error while checking for course." });
        }

        if (row) {
            return res.status(409).json({ error: "Course number already exists." });
        }

        const insertQuery = `
            INSERT INTO tblCourses (CourseNumber, CourseName, CourseSection, JoinCode)
            VALUES (?, ?, ?, ?)
        `;

        db.run(insertQuery, [courseCode, courseName, courseSection, joinCode], function (err) {
            if (err) {
                console.error("Error inserting course:", err);
                return res.status(500).json({ error: "Database error during course insertion." });
            }
            return res.status(201).json({ message: "Course created successfully." });
        });
    });
});


// Get all active courses
app.get('/courses', (req, res) => {
    const query = `
        SELECT CourseNumber, CourseName, CourseSection, JoinCode
        FROM tblCourses
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching courses:", err); // <--- check your backend terminal for this
            return res.status(500).json({ error: "Database error while fetching courses." });
        }

        return res.status(200).json({ courses: rows });
    });
});


// Get students in a specific course
app.get('/courses/:courseCode/students', (req, res) => {
    const { courseCode } = req.params;

    const query = `
        SELECT u.FirstName, u.LastName, u.Email
        FROM tblEnrollments e
        JOIN tblUsers u ON e.StudentEmail = u.Email
        WHERE e.CourseCode = ?
    `;

    db.all(query, [courseCode], (err, rows) => {
        if (err) {
            console.error("Error fetching students:", err);
            return res.status(500).json({ error: "Database error while fetching students." });
        }

        return res.status(200).json({ students: rows });
    });
});


// Delete a course
app.delete('/courses/:courseCode', (req, res) => {
    const { courseCode } = req.params;

    const query = `
        DELETE FROM tblCourses
        WHERE CourseNumber = ?
    `;

    db.run(query, [courseCode], function(err) {
        if (err) {
            console.error("Error deleting course:", err);
            return res.status(500).json({ error: "Database error while deleting course." });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: "Course not found." });
        }

        return res.status(200).json({ message: "Course deleted successfully." });
    });
});




app.get('/',(req,res,next) => {
    res.status(200).json({message:"Server is working"})
})


app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})
