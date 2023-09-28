
const express = require('express');
const bodyParser = require('body-parser');
const firebaseAdmin = require('firebase-admin');
const serviceAccount = require('./key.json'); 
const axios = require('axios');
const bcrypt = require('bcrypt')

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const path = require('path'); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://console.firebase.google.com/u/0/project/project-t-67397/firestore/data/~2Fstudent~2F5955728327', // Replace with your Firebase URL
});


// Define routes
app.get('/', (req, res) => {
  res.render('index');
});

// Registration route
app.get('/register', (req, res) => {
  res.render('register');
});

// POST request for user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the username already exists in Firebase Firestore
    const userSnapshot = await firebaseAdmin.firestore()
      .collection('students')
      .where('username', '==', username)
      .get();

    if (!userSnapshot.empty) {
      return res.send('Username already exists. Please choose another username.');
    }

    // Hash the password before storing it in Firebase Firestore
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store the username and hashed password in Firebase database
    await firebaseAdmin.firestore().collection('students').add({
      username: username,
      password: hashedPassword, // Storing  the hashed password
    });

    res.send('User registered successfully');
  } catch (error) {
    res.send('Registration failed');
  }
});
// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    //  find a user with the provided username
    const userSnapshot = await firebaseAdmin.firestore()
      .collection('students')
      .where('username', '==', username)
      .get();

    if (!userSnapshot.empty) {
      // Get the user document from the snapshot
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Comparing the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (isPasswordValid) {
        // Authentication successful
        res.redirect('/city'); // Redirect to the city route
      } else {
        // Authentication failed
        res.send('Login failed');
      }
    } else {
      // User not found
      res.send('User not found');
    }
  } catch (error) {
    // Error handling
    res.send('Login failed');
  }
});


// Weather route
app.get('/weather', async (req, res) => {
  const city = req.query.city; //  city input is sent as a query parameter

  try {
    // Make API request to get weather data using the city name
    const apiKey = '31ca75ab2730487187774335232805'; 
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
    const response = await axios.get(apiUrl);

    const weatherData = response.data; // Extracting  relevant data from the API response

    // Render the weather.ejs view and pass the weatherData to it
    res.render('weather', { weatherData });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).send('Weather data retrieval failed');
  }
});

// Add a new route for handling the city form submission
app.get('/city', (req, res) => {
  res.render('city');
});

app.post('/weather', async (req, res) => {
  const { city } = req.body;

  try {
    const apiKey = '31ca75ab2730487187774335232805'; 
    const response = await axios.get(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);
    const weatherData = response.data;
    res.render('weather', { weatherData }); // Rendering the weather template with data
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.render('weather', { weatherData: null }); // Rendering the weather template without data
  }
});

//(starting server)

const PORT = process.env.PORT || 7800;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
