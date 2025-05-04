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
                    user: { UserID: row.UserID, FirstName: row.FirstName, LastName: row.LastName, Email: row.Email }
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



app.post('/enroll', (req, res) => {
    const { joinCode, email } = req.body;

    if (!joinCode || !email) {
        return res.status(400).json({ error: "Join code and email are required." });
    }

    console.log("Incoming enroll request body:", req.body);

    // Step 1: Look up user ID based on email
    db.get(`SELECT UserID FROM tblUsers WHERE Email = ?`, [email], (err, userRow) => {
        if (err) {
            console.error("Error finding user:", err);
            return res.status(500).json({ error: "Database error while finding user." });
        }

        if (!userRow) {
            return res.status(404).json({ error: "User not found." });
        }

        const userId = userRow.UserID;

        // Step 2: Look up course ID using the join code
        db.get(`SELECT CourseID FROM tblCourses WHERE JoinCode = ?`, [joinCode], (err, courseRow) => {
            if (err) {
                console.error("Error finding course:", err);
                return res.status(500).json({ error: "Database error while finding course." });
            }

            if (!courseRow) {
                return res.status(404).json({ error: "Invalid join code." });
            }

            const courseId = courseRow.CourseID;

            // Step 3: Check if already enrolled
            db.get(`
                SELECT * FROM tblEnrollments
                WHERE CourseID = ? AND UserID = ?
            `, [courseId, userId], (err, existingRow) => {
                if (err) {
                    console.error("Error checking enrollment:", err);
                    return res.status(500).json({ error: "Database error checking enrollment." });
                }

                if (existingRow) {
                    return res.status(409).json({ error: "Already enrolled in this course." });
                }

                // Step 4: Insert enrollment
                db.run(`
                    INSERT INTO tblEnrollments (CourseID, UserID)
                    VALUES (?, ?)
                `, [courseId, userId], function (err) {
                    if (err) {
                        console.error("Error enrolling user:", err);
                        return res.status(500).json({ error: "Database error during enrollment." });
                    }

                    return res.status(200).json({ message: "Successfully enrolled." });
                });
            });
        });
    });
});





// Create a new course
app.post('/createCourse', (req, res) => {
    const { courseName, courseCode, courseSection, joinCode, userID} = req.body;

    if (!courseName || !courseCode || !courseSection || !joinCode || !userID) {
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
            INSERT INTO tblCourses (CourseNumber, CourseName, CourseSection, JoinCode, UserID)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [courseCode, courseName, courseSection, joinCode, userID], function (err) {
            if (err) {
                console.error("Error inserting course:", err);
                return res.status(500).json({ error: "Database error during course insertion." });
            }
            return res.status(201).json({ message: "Course created successfully." });
        });
    });
});

//sending newly created teams to database
app.post('/teams', (req, res) => {
    const { courseCode, teamName, studentEmails } = req.body;

    if (!courseCode || !teamName || !Array.isArray(studentEmails)) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Step 1: Get CourseID from CourseNumber
    db.get(`SELECT CourseID FROM tblCourses WHERE CourseNumber = ?`, [courseCode], (err, courseRow) => {
        if (err || !courseRow) {
            console.error("Error finding course:", err);
            return res.status(404).json({ error: "Course not found." });
        }

        const courseId = courseRow.CourseID;

        // Step 2: Insert into tblCourseGroups
        db.run(`INSERT INTO tblCourseGroups (GroupName, CourseID) VALUES (?, ?)`, [teamName, courseId], function (err) {
            if (err) {
                console.error("Error inserting group:", err);
                return res.status(500).json({ error: "Failed to create group." });
            }

            const groupId = this.lastID;

            // Step 3: Get UserIDs from studentEmails
            const placeholders = studentEmails.map(() => '?').join(',');
            db.all(`SELECT UserID FROM tblUsers WHERE Email IN (${placeholders})`, studentEmails, (err, userRows) => {
                if (err || userRows.length === 0) {
                    console.error("Error finding users:", err);
                    return res.status(500).json({ error: "Failed to get student IDs." });
                }

                // Step 4: Insert each into tblGroupMembers
                const insertStmt = db.prepare(`INSERT INTO tblGroupMembers (GroupID, UserID) VALUES (?, ?)`);
                userRows.forEach(row => {
                    insertStmt.run(groupId, row.UserID);
                });
                insertStmt.finalize();

                return res.status(201).json({ message: "Team created and students assigned." });
            });
        });
    });
});



//route for creating reviews
app.post('/create-assessment', (req, res) => {
    const { courseCode, title, questions } = req.body;

    if (!courseCode || !title || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Default dates can be used or updated later
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]; // +7 days

    // Step 1: Get CourseID
    db.get(`SELECT CourseID FROM tblCourses WHERE CourseNumber = ?`, [courseCode], (err, courseRow) => {
        if (err || !courseRow) {
            console.error("Course lookup failed:", err);
            return res.status(500).json({ error: "Course not found." });
        }

        const courseID = courseRow.CourseID;

        // Step 2: Insert into tblAssessments
        db.run(`
            INSERT INTO tblAssessments (CourseID, StartDate, EndDate, Name, Status, Type)
            VALUES (?, ?, ?, ?, 'Active', 'Peer')
        `, [courseID, startDate, endDate, title], function (err) {
            if (err) {
                console.error("Assessment insert failed:", err);
                return res.status(500).json({ error: "Failed to create assessment." });
            }

            const assessmentID = this.lastID;

            // Step 3: Insert each question
            const stmt = db.prepare(`
                INSERT INTO tblAssessmentQuestions 
                (AssessmentID, QuestionType, Options, QuestionNarrative, HelperText)
                VALUES (?, ?, ?, ?, ?)
            `);

            questions.forEach(q => {
                const optionsJSON = q.options.length > 0 ? JSON.stringify(q.options) : null;
                stmt.run(assessmentID, q.type, optionsJSON, q.text, '');
            });

            stmt.finalize();
            return res.status(201).json({ message: "Assessment and questions saved successfully." });
        });
    });
});

//allows user to edit a saved review
app.get('/assessment-details/:assessmentID', (req, res) => {
    const id = req.params.assessmentID;

    db.get(`SELECT Name FROM tblAssessments WHERE AssessmentID = ?`, [id], (err, assessment) => {
        if (err || !assessment) {
            return res.status(404).json({ error: "Assessment not found" });
        }

        db.all(`SELECT QuestionType, Options, QuestionNarrative FROM tblAssessmentQuestions WHERE AssessmentID = ?`, [id], (err, questions) => {
            if (err) {
                return res.status(500).json({ error: "Failed to load questions" });
            }

            const formattedQuestions = questions.map(q => ({
                type: q.QuestionType,
                text: q.QuestionNarrative,
                options: q.Options ? JSON.parse(q.Options) : []
            }));

            res.status(200).json({
                title: assessment.Name,
                questions: formattedQuestions
            });
        });
    });
});

//delete a saved review from database
app.delete('/delete-assessment/:assessmentID', (req, res) => {
    const id = req.params.assessmentID;

    db.run(`DELETE FROM tblAssessmentQuestions WHERE AssessmentID = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: "Failed to delete questions" });

        db.run(`DELETE FROM tblAssessments WHERE AssessmentID = ?`, [id], function (err) {
            if (err) return res.status(500).json({ error: "Failed to delete assessment" });

            res.status(200).json({ message: "Assessment deleted" });
        });
    });
});

//route for sending reviews to tblScheduledReviews
app.post('/assign-review', (req, res) => {
    const { assessmentID, courseID, dueDate } = req.body;

    if (!assessmentID || !courseID || !dueDate) {
        return res.status(400).json({ error: "Missing data" });
    }

    const startDate = new Date().toISOString().split("T")[0];
    const endDate = dueDate;

    // First, check for duplicates
    const checkQuery = `
        SELECT * FROM tblScheduledReviews
        WHERE AssessmentID = ? AND CourseID = ?
    `;

    db.get(checkQuery, [assessmentID, courseID], (err, row) => {
        if (err) {
            console.error("Error checking for duplicates:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (row) {
            return res.status(409).json({ error: "This review is already scheduled for this course." });
        }

        // Proceed to insert if no duplicate
        const insertQuery = `
            INSERT INTO tblScheduledReviews (AssessmentID, CourseID, StartDate, EndDate)
            VALUES (?, ?, ?, ?)
        `;

        db.run(insertQuery, [assessmentID, courseID, startDate, endDate], function (err) {
            if (err) {
                console.error("Error assigning review:", err);
                return res.status(500).json({ error: "Database error" });
            }

            return res.status(201).json({ message: "Review assigned successfully" });
        });
    });
});



//route for displaying already assigned reviews to the instructor
app.get('/scheduled-reviews/:userID', (req, res) => {
    const userID = req.params.userID;

    const query = `
        SELECT sr.ScheduleID, sr.AssessmentID, sr.StartDate, sr.EndDate AS DueDate,
               a.Name AS ReviewTitle,
               c.CourseNumber, c.CourseName
        FROM tblScheduledReviews sr
        JOIN tblAssessments a ON sr.AssessmentID = a.AssessmentID
        JOIN tblCourses c ON sr.CourseID = c.CourseID
        WHERE c.UserID = ?
        ORDER BY sr.EndDate DESC
    `;

    db.all(query, [userID], (err, rows) => {
        if (err) {
            console.error("Error fetching scheduled reviews:", err);
            return res.status(500).json({ error: "Database error while fetching scheduled reviews." });
        }

        res.status(200).json({ scheduledReviews: rows });
    });
});




//route for populating the Review Select dropdown on schedule reviews tab
app.get('/reviews-by-course/:courseCode', (req, res) => {
    const courseCode = req.params.courseCode;

    const query = `
        SELECT a.AssessmentID, a.Name
        FROM tblAssessments a
        JOIN tblCourses c ON a.CourseID = c.CourseID
        WHERE c.CourseNumber = ?
        ORDER BY a.AssessmentID DESC
    `;

    db.all(query, [courseCode], (err, rows) => {
        if (err) {
            console.error("Failed to fetch reviews:", err);
            return res.status(500).json({ error: "Error fetching reviews." });
        }

        res.json(rows);
    });
});



// returns assesssments that belong to logged in instructor
app.get('/instructor-assessments/:userID', (req, res) => {
    const userID = req.params.userID;

    const query = `
        SELECT a.AssessmentID, a.Name, c.CourseNumber, c.CourseName
        FROM tblAssessments a
        JOIN tblCourses c ON a.CourseID = c.CourseID
        WHERE c.UserID = ?
        ORDER BY a.AssessmentID DESC
    `;

    db.all(query, [userID], (err, rows) => {
        if (err) {
            console.error("Error fetching assessments:", err);
            return res.status(500).json({ error: "Database error while fetching assessments." });
        }

        res.status(200).json({ assessments: rows });
    });
});

//fetches questions for a review
app.get('/assessment-questions/:assessmentID', (req, res) => {
    const assessmentID = req.params.assessmentID;

    const query = `
        SELECT QuestionID, QuestionNarrative, QuestionType, Options
        FROM tblAssessmentQuestions
        WHERE AssessmentID = ?
    `;

    db.all(query, [assessmentID], (err, rows) => {
        if (err) {
            console.error("Error fetching questions:", err);
            return res.status(500).json({ error: "Failed to fetch questions." });
        }

        const questions = rows.map(q => ({
            id: q.QuestionID,
            text: q.QuestionNarrative,
            type: q.QuestionType,
            options: q.Options ? JSON.parse(q.Options) : []
        }));

        res.status(200).json({ questions });
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


// Get all courses for a specific instructor
app.get('/courses/:userID', (req, res) => {
    const userID = req.params.userID;

    const query = `SELECT * FROM tblCourses WHERE UserID = ?`;

    db.all(query, [userID], (err, rows) => {
        if (err) {
            console.error("Error fetching instructor courses:", err);
            return res.status(500).json({ error: "Database error while fetching courses." });
        }

        res.json({ courses: rows });
    });
});


//get the teams for each selected course
app.get('/courses/:courseCode/teams', (req, res) => {
    const { courseCode } = req.params;

    const query = `
        SELECT g.GroupID, g.GroupName, u.FirstName || ' ' || u.LastName AS StudentName
        FROM tblCourseGroups g
        JOIN tblCourses c ON g.CourseID = c.CourseID
        JOIN tblGroupMembers gm ON g.GroupID = gm.GroupID
        JOIN tblUsers u ON gm.UserID = u.UserID
        WHERE c.CourseNumber = ?
        ORDER BY g.GroupID
    `;

    db.all(query, [courseCode], (err, rows) => {
        if (err) {
            console.error("Error fetching teams:", err);
            return res.status(500).json({ error: "Database error while fetching teams." });
        }

        // Group students under their teams
        const teamsMap = {};
        rows.forEach(row => {
            if (!teamsMap[row.GroupID]) {
                teamsMap[row.GroupID] = {
                    groupId: row.GroupID,           // 👈 ADD THIS
                    teamName: row.GroupName,
                    members: []
                };
            }
            teamsMap[row.GroupID].members.push(row.StudentName);
        });

        // Convert to array
        const teams = Object.values(teamsMap);
        res.status(200).json({ teams });
    });
});


//put for updating teams
app.put('/teams/:groupId', (req, res) => {
    const { groupId } = req.params;
    const { teamName, studentEmails, courseCode } = req.body;

    if (!teamName || !studentEmails || !Array.isArray(studentEmails) || studentEmails.length === 0) {
        return res.status(400).json({ error: "Invalid data." });
    }

    // Step 1: Get CourseID from courseCode
    db.get(`SELECT CourseID FROM tblCourses WHERE CourseNumber = ?`, [courseCode], (err, courseRow) => {
        if (err || !courseRow) {
            return res.status(404).json({ error: "Course not found." });
        }

        const courseID = courseRow.CourseID;

        // Step 2: Update team name
        db.run(`UPDATE tblCourseGroups SET GroupName = ?, CourseID = ? WHERE GroupID = ?`,
            [teamName, courseID, groupId],
            function (err) {
                if (err) {
                    console.error("Error updating team name:", err);
                    return res.status(500).json({ error: "Failed to update team." });
                }

                // Step 3: Remove existing members
                db.run(`DELETE FROM tblGroupMembers WHERE GroupID = ?`, [groupId], function (err) {
                    if (err) {
                        console.error("Error clearing group members:", err);
                        return res.status(500).json({ error: "Failed to update members." });
                    }

                    // Step 4: Add new members
                    const insertStmt = db.prepare(`INSERT INTO tblGroupMembers (GroupID, UserID) VALUES (?, ?)`);
                    let inserted = 0;

                    studentEmails.forEach(email => {
                        db.get(`SELECT UserID FROM tblUsers WHERE Email = ?`, [email], (err, userRow) => {
                            if (!err && userRow) {
                                insertStmt.run(groupId, userRow.UserID, () => {
                                    inserted++;
                                    if (inserted === studentEmails.length) {
                                        insertStmt.finalize();
                                        return res.status(200).json({ message: "Team updated successfully." });
                                    }
                                });
                            } else {
                                console.error("Skipping invalid student email:", email);
                            }
                        });
                    });
                });
            });
    });
});




// Get students in a specific course
// app.get('/courses/:courseCode/students', (req, res) => {
//     const { courseCode } = req.params;

//     const query = `
//         SELECT u.FirstName, u.LastName, u.Email
//         FROM tblEnrollments e
//         JOIN tblUsers u ON e.StudentEmail = u.Email
//         WHERE e.CourseNumber = ?
//     `;

//     db.all(query, [courseCode], (err, rows) => {
//         if (err) {
//             console.error("Error fetching students:", err);
//             return res.status(500).json({ error: "Database error while fetching students." });
//         }

//         return res.status(200).json({ students: rows });
//     });
// });

app.get('/courses/:courseCode/students', (req, res) => {
    const { courseCode } = req.params;

    const query = `
        SELECT u.FirstName, u.LastName, u.Email
        FROM tblEnrollments e
        JOIN tblUsers u ON e.UserID = u.UserID
        JOIN tblCourses c ON e.CourseID = c.CourseID
        WHERE c.CourseNumber = ?
    `;

    db.all(query, [courseCode], (err, rows) => {
        if (err) {
            console.error("Error fetching students:", err);
            return res.status(500).json({ error: "Database error while fetching students." });
        }

        return res.status(200).json({ students: rows });
    });
});


app.get('/student-courses', (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    const query = `
        SELECT c.CourseName, c.CourseNumber, c.JoinCode
        FROM tblCourses c
        JOIN tblEnrollments e ON c.CourseID = e.CourseID
        JOIN tblUsers u ON e.UserID = u.UserID
        WHERE u.Email = ?
    `;

    db.all(query, [email], (err, rows) => {
        if (err) {
            console.error("Error fetching student courses:", err);
            return res.status(500).json({ error: "Database error while fetching student courses." });
        }

        return res.status(200).json({ courses: rows });
    });
});



//route for displaying the team/teams a logged in student is in
app.get('/student-teams', (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: "Missing student email." });
    }

    const query = `
        SELECT 
            g.GroupID,
            g.GroupName,
            c.CourseNumber,
            c.CourseName,
            u.Email AS MemberEmail,
            u.FirstName || ' ' || u.LastName AS MemberName,
            COALESCE(p.PhoneNumber, s.UserName) AS ContactInfo,
            COALESCE(NULLIF(p.PhoneNumber, ''), s.SocialType) AS ContactType
        FROM tblUsers current
        JOIN tblGroupMembers gm_self ON current.UserID = gm_self.UserID
        JOIN tblCourseGroups g ON gm_self.GroupID = g.GroupID
        JOIN tblCourses c ON g.CourseID = c.CourseID
        JOIN tblGroupMembers gm ON g.GroupID = gm.GroupID
        JOIN tblUsers u ON gm.UserID = u.UserID
        LEFT JOIN tblPhone p ON u.Email = p.UserEmail
        LEFT JOIN tblSocials s ON u.Email = s.UserEmail
        WHERE current.Email = ?
        ORDER BY g.GroupID, u.FirstName
    `;

    db.all(query, [email], (err, rows) => {
        if (err) {
            console.error("Error fetching student teams with members:", err);
            return res.status(500).json({ error: "Database error while fetching student teams." });
        }

        const grouped = {};

        rows.forEach(row => {
            if (!grouped[row.GroupID]) {
                grouped[row.GroupID] = {
                    groupName: row.GroupName,
                    courseNumber: row.CourseNumber,
                    courseName: row.CourseName,
                    members: []
                };
            }

            grouped[row.GroupID].members.push({
                name: row.MemberName,
                contact: row.ContactInfo || 'N/A',
                type: row.ContactType || 'N/A'
            });
        });

        const teams = Object.values(grouped);
        return res.status(200).json({ teams });
    });
});


//drop a course from student side
app.post('/drop-course', (req, res) => {
    const { email, courseCode } = req.body;

    if (!email || !courseCode) {
        return res.status(400).json({ error: "Email and course code are required." });
    }

    db.get(`SELECT UserID FROM tblUsers WHERE Email = ?`, [email], (err, userRow) => {
        if (err || !userRow) {
            console.error("Error finding user:", err);
            return res.status(500).json({ error: "User not found." });
        }

        const userId = userRow.UserID;

        db.get(`SELECT CourseID FROM tblCourses WHERE CourseNumber = ?`, [courseCode], (err, courseRow) => {
            if (err || !courseRow) {
                console.error("Error finding course:", err);
                return res.status(500).json({ error: "Course not found." });
            }

            const courseId = courseRow.CourseID;

            db.run(`DELETE FROM tblEnrollments WHERE UserID = ? AND CourseID = ?`, [userId, courseId], function (err) {
                if (err) {
                    console.error("Error deleting enrollment:", err);
                    return res.status(500).json({ error: "Failed to drop course." });
                }

                return res.status(200).json({ message: "Course dropped successfully." });
            });
        });
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



app.delete('/teams/:groupId', (req, res) => {
    const groupId = req.params.groupId;

    db.serialize(() => {
        // First delete from tblGroupMembers
        db.run(`DELETE FROM tblGroupMembers WHERE GroupID = ?`, [groupId], function (err) {
            if (err) {
                console.error("Error deleting group members:", err);
                return res.status(500).json({ error: "Failed to delete group members." });
            }

            // Then delete from tblCourseGroups
            db.run(`DELETE FROM tblCourseGroups WHERE GroupID = ?`, [groupId], function (err) {
                if (err) {
                    console.error("Error deleting group:", err);
                    return res.status(500).json({ error: "Failed to delete team." });
                }

                res.status(200).json({ message: "Team deleted successfully." });
            });
        });
    });
});



app.get('/',(req,res,next) => {
    res.status(200).json({message:"Server is working"})
})


app.listen(HTTP_PORT,() => {
    console.log('App listening on',HTTP_PORT)
})