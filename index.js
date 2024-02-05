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
app.get('/api/users/:userid', async (req, res) => {
    const { userid } = req.params;

    try {
        const user = await pool.query('SELECT * FROM users WHERE userid = $1', [userid]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Consider what user information to return and exclude sensitive details
        const userProfile = {
            userid: user.rows[0].userid,
            firstname: user.rows[0].firstname,
            lastname: user.rows[0].lastname,
            email: user.rows[0].email,
            // Add or remove fields as necessary, but exclude sensitive information like passwords
        };

        res.json(userProfile);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user profile", error: error.message });
    }
});



// Update user profile

app.put('/api/users/:userid/update', async (req, res) => {
    const { userid } = req.params;
    const { firstname, lastname, email } = req.body;

    try {
        // Perform the update operation using the provided userid
        const updatedUser = await pool.query(
            'UPDATE users SET firstname = $1, lastname = $2, email = $3 WHERE userid = $4 RETURNING *',
            [firstname, lastname, email, userid]
        );

        if (updatedUser.rows.length === 0) {
            // No rows updated, likely because the userid doesn't exist
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User profile updated successfully",
            user: updatedUser.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating user profile", error: error.message });
    }
});


// Delete user account

app.delete('/api/users/:userid/delete', async (req, res) => {
    const { userid } = req.params;

    try {
        const deleteOp = await pool.query('DELETE FROM users WHERE userid = $1', [userid]);

        if (deleteOp.rowCount === 0) {
            // No rows deleted, likely because the userid doesn't exist
            return res.status(404).json({ message: "User not found or already deleted" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
});


// create a listing

app.post('/api/listings', async (req, res) => {
    const { userid, title, description, price, streetAddress, city, state, zip, neighborhood, bedrooms, bathrooms, squarefeet, status, site } = req.body;

    try {
        const newListing = await pool.query(
            'INSERT INTO listings (userid, title, description, price, streetAddress, city, state, zip, neighborhood, bedrooms, bathrooms, squarefeet, status, createdat, site) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14) RETURNING *',
            [userid, title, description, price, streetAddress, city, state, zip, neighborhood, bedrooms, bathrooms, squarefeet, status, site]
        );

        res.status(201).json({
            message: "Listing created successfully",
            listing: newListing.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating listing", error: error.message });
    }
});


// get all listings

app.get('/api/listings', async (req, res) => {
    try {
        const listings = await pool.query('SELECT * FROM listings');
        res.json(listings.rows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching listings", error: error.message });
    }
});

// get a single listing

app.get('/api/listings/:listingid', async (req, res) => {
    const { listingid } = req.params;

    try {
        const listing = await pool.query('SELECT * FROM listings WHERE listingid = $1', [listingid]);
        if (listing.rows.length === 0) {
            return res.status(404).json({ message: "Listing not found" });
        }

        res.json(listing.rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching listing", error: error.message });
    }
});


// update a listing

app.put('/api/listings/:listingid', async (req, res) => {
    const { listingid } = req.params;
    const { title, description, price, streetAddress, city, state, zip, neighborhood, bedrooms, bathrooms, squarefeet, status } = req.body;

    try {
        const updatedListing = await pool.query(
            'UPDATE listings SET title = $1, description = $2, price = $3, streetAddress = $4, city = $5, state = $6, zip = $7, neighborhood = $8, bedrooms = $9, bathrooms = $10, squarefeet = $11, status = $12 WHERE listingid = $13 RETURNING *',
            [title, description, price, streetAddress, city, state, zip, neighborhood, bedrooms, bathrooms, squarefeet, status, listingid]
        );

        if (updatedListing.rows.length === 0) {
            return res.status(404).json({ message: "Listing not found" });
        }

        res.json({
            message: "Listing updated successfully",
            listing: updatedListing.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating listing", error: error.message });
    }
});


// Delete a listing

app.delete('/api/listings/:listingid', async (req, res) => {
    const { listingid } = req.params;

    try {
        const deleteOp = await pool.query('DELETE FROM listings WHERE listingid = $1', [listingid]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ message: "Listing not found or already deleted" });
        }

        res.json({ message: "Listing deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting listing", error: error.message });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
