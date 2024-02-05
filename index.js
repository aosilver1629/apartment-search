const express = require('express');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 3000;



// Import the pool instance from the db configuration file
const pool = require('./db/config');

app.use(express.json());

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Connection to PostgreSQL database failed', err.stack);
    } else {
      console.log('Connected successfully to the PostgreSQL database', res.rows);
    }
  });
  

// User registration route
app.post('/api/users/register', async (req, res) => {
    try {
        const { firstname, lastname, email} = req.body;

        // Check if the user already exists in the database
        const existingUserQuery = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (existingUserQuery.rows.length) {
            return res.status(400).json({ message: "User already exists" });
        }


        // Insert the new user into the database
        const newUserQuery = 'INSERT INTO users (firstname, lastname, email) VALUES ($1, $2, $3) RETURNING *';
        const newUser = await pool.query(newUserQuery, [firstname, lastname, email]);

        // Respond with the newly created user, excluding the password
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.rows[0].userid, // assuming your user ID column is named user_id
                firstname: newUser.rows[0].firstname,
                lastname: newUser.rows[0].lastname,
                email: newUser.rows[0].email
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
});

// User Login

app.post('/api/users/login', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // For simplicity, assuming a successful login without password verification
        res.json({
            message: "Logged in successfully",
            user: user.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: "Login error", error: error.message });
    }
});


// Fetch User Profile
app.get('/api/users/profile', authenticate, async (req, res) => {
    try {
        // Assuming req.user.id is set by the authenticate middleware
        const user = await pool.query('SELECT * FROM users WHERE userid = $1', [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: user.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
});


// Update user profile

app.put('/api/users/profile/update', authenticate, async (req, res) => {
    const { firstname, lastname, email } = req.body;

    try {
        const updatedUser = await pool.query(
            'UPDATE users SET firstname = $1, lastname = $2, email = $3 WHERE userid = $4 RETURNING *',
            [firstname, lastname, email, req.user.id]
        );

        res.json({
            message: "User profile updated successfully",
            user: updatedUser.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating user profile", error: error.message });
    }
});


// Delete user account

app.delete('/api/users/delete', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE userid = $1', [req.user.id]);
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
