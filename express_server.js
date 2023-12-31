
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers");

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
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: null },
  "9sm5xK": { longURL: "http://www.google.com", userID: null }
};

app.use(express.urlencoded({ extended: true })); 
app.use(cookieSession({
  name: "session",
  keys: ["secret-key"], 
  maxAge: 0, 
})); 



const users = {};

app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

const urlsForUser = (id) => {
  const userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }

  return userURLs;
};

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    const errorMessage = "You must be logged in to view your URLs. Please log in or register.";
    const errorHTML = `<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`;
    res.status(403).send(errorHTML); // Send the error message as HTML
    return;
  }

  const userURLs = urlsForUser(user.id);

  const templateVars = {
    urls: userURLs,
    user: user,
    urlDatabase: urlDatabase // Pass the urlDatabase to the template
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // Check if the user is logged in
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
    return;
  }

  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});



app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!user) {
    const errorMessage = "You must be logged in to view this URL. Please log in or register.";
    const errorHTML = `<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`;
    res.status(403).send(errorHTML); // Send the error message as HTML
    return;
  }

  if (!url) {
    res.status(404).send("<html><body>Short URL not found.</body></html>\n");
    return;
  }

  // Check if the URL belongs to the current user
  if (url.userID !== user.id) {
    const errorMessage = "You don't have permission to access this URL.";
    const errorHTML = `<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`;
    res.status(403).send(errorHTML); // Send the error message as HTML
    return;
  }

  const templateVars = { id: id, longURL: urlDatabase[id].longURL, user: user };
  console.log(urlDatabase[id].longURL);
  res.render("urls_show", templateVars);
});

app.get("/urls/:id/edit", (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!user) {
    const errorMessage = "You must be logged in to edit this URL. Please log in or register.";
    const errorHTML = `<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`;
    res.status(403).send(errorHTML); // Send the error message as HTML
    return;
  }

  if (!url) {
    const errorMessage = "Short URL not found.";
    res.status(404).send(errorMessage);
    return;
  }

  if (url.userID !== user.id) {
    const errorMessage = "You don't have permission to edit this URL.";
    const errorHTML = `<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`;
    res.status(403).send(errorHTML); // Send the error message as HTML
    return;
  }

  const templateVars = { id: id, longURL: urlDatabase[id].longURL, user: user };
  res.render("urls_show", templateVars); // Use the same template as the one for viewing URLs
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    const errorMessage = "Short URL not found.";
    res.status(404).send(errorMessage);
    return;
  }

  if (!user) {
    const errorMessage = "You must be logged in to edit this URL.";
    res.status(403).send(errorMessage);
    return;
  }

  if (url.userID !== user.id) {
    const errorMessage = "You don't have permission to edit this URL.";
    res.status(403).send(errorMessage);
    return;
  }

  const newLongURL = req.body.newLongURL;
  urlDatabase[id].longURL = newLongURL;
  res.redirect("/urls"); // Redirect back to the /urls page after updating the URL
});

app.post("/urls", (req, res) => {
  // Check if the user is logged in
  const user = users[req.session.user_id];
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
  const urlObject = urlDatabase[shortURL];
  
  if (urlObject) {
    const longURL = urlObject.longURL;
    res.redirect(longURL);
  } else {
    const errorMessage = "Short URL not found.";
    res.status(404).send(`<html><body>${errorMessage}</body></html>\n`);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const url = urlDatabase[id];

  if (!url) {
    const errorMessage = "Short URL not found.";
    res.status(404).send(errorMessage);
    return;
  }

  if (!user) {
    const errorMessage = "You must be logged in to delete this URL.";
    res.status(403).send(errorMessage);
    return;
  }

  if (url.userID !== user.id) {
    const errorMessage = "You don't have permission to delete this URL.";
    res.status(403).send(errorMessage);
    return;
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});



//login form
app.get("/login", (req, res) => {
  // Check if the user is already logged in
  if (users[req.session.user_id]) {
    res.redirect("/urls");
    return;
  }

  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

// Update the POST /login endpoint
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Find the user by email
  const user = getUserByEmail(email, users);

  if (!user) {
    res.status(403).send("User not found.");
    return;
  }

  // Compare the provided password with the hashed password using bcrypt
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Incorrect password.");
    return;
  }

  // Both email and password are correct, set the user_id cookie
  req.session.user_id = user.id;
  res.redirect("/urls");
});


//register form
app.get("/register", (req, res) => {
  // Check if the user is already logged in
  if (users[req.session.user_id]) {
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
  if (getUserByEmail(email, users)) {
    res.status(400).send("E-mail already exists.");
    return;
  }

  // Hash the password using bcrypt
  const hashedPassword = bcrypt.hashSync(password, 10);

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword, // Save the hashed password
  };

  users[userId] = newUser;
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  
});


