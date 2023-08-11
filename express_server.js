
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

const generateRandomString = function() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

app.set("view engine", "ejs");
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());  

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies['user_id']];

  if (!user) {
    const templateVars = { user: null, errorMessage: "You must be logged in to view your URLs. Please log in or register." };
    res.render("urls_error", templateVars); // Render a custom error page with the message
    return;
  }

  const userURLs = {};

  // Filter URLs that belong to the current user
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === user.id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }

  const templateVars = { urls: userURLs, user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // Check if the user is logged in
  const user = users[req.cookies['user_id']];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies['user_id']];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    res.status(404).send("<html><body>Short URL not found.</body></html>\n");
    return;
  }

  // Check if the URL belongs to the current user
  if (url.userID !== user.id) {
    res.status(403).send("You don't have permission to access this URL.");
    return;
  }

  const templateVars = { id: id, longURL: url.longURL };
  res.render("urls_show", templateVars);
})

app.post("/urls", (req, res) => {
  // Check if the user is logged in
  const user = users[req.cookies['user_id']];
  if (!user) {
    res.status(403).send("You must be logged in to create short URLs.");
    return;
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: longURL, userID: user.id };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (!longURL) {
    // Short URL id does not exist in the database
    res.status(404).send("<html><body>Short URL not found.</body></html>\n");
    return;
  }

  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.cookies['user_id']];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    res.status(404).send("<html><body>Short URL not found.</body></html>\n");
    return;
  }

  if (url.userID !== user.id) {
    res.status(403).send("You don't have permission to delete this URL.");
    return;
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies['user_id']];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    res.status(404).send("<html><body>Short URL not found.</body></html>\n");
    return;
  }

  if (url.userID !== user.id) {
    res.status(403).send("You don't have permission to update this URL.");
    return;
  }

  const longURL = req.body.longURL;
  urlDatabase[id].longURL = longURL;
  res.redirect("/urls");
});

//login form
app.get("/login", (req, res) => {
  // Check if the user is already logged in
  if (users[req.cookies['user_id']]) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  res.render("urls_login", templateVars);
});

// Update the POST /login endpoint
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find the user by email
  const user = getUserByEmail(email);

  if (!user) {
    // User with the provided email doesn't exist
    res.status(403).send("User not found.");
    return;
  }

  if (user.password !== password) {
    // Password doesn't match
    res.status(403).send("Incorrect password.");
    return;
  }

  // Both email and password are correct, set the user_id cookie
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// Helper function to find a user by email
const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users.hasOwnProperty(userId) && users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

//register form
app.get("/register", (req, res) => {
  // Check if the user is already logged in
  if (users[req.cookies['user_id']]) {
    res.redirect("/urls");
    return;
  }

  let templateVars = { user: null };
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Check for empty strings in email and password
  if (!email || !password) {
    res.status(400).send("E-mail and password cannot be empty.");
    return;
  }

  // Check if the email is already in the users object
  if (getUserByEmail(email)) {
    res.status(400).send("E-mail already exists.");
    return;
  }

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email: email,
    password: password,
  };

  users[userId] = newUser;
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.cookie("user_id", null);
  res.redirect("/login");
});



