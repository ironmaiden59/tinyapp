// const express = require("express");
// const app = express();
// const cookieParser = require("cookie-parser");
// app.use(cookieParser());
// const PORT = 8080; // default port 8080


// app.set("view engine", "ejs")
// app.use(express.urlencoded({ extended: true }));
// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.post("/urls/:id/delete", (req, res) => {
//   const id = req.params.id;

//   // Use JavaScript's delete operator to remove the URL
//   if (urlDatabase[id]) {
//     delete urlDatabase[id];
//     res.redirect("/urls"); // Redirect back to the URLs index page
//   } else {
//     res.status(404).send("Short URL not found");
//   }
// });


// app.get("/urls", (req, res) => {
//   const templateVars = { urls: urlDatabase };
//   res.render("urls_index", templateVars);
// });

// app.get("/urls/new", (req, res) => {
//   res.render("urls_new");
// });

// app.get("/urls/:id", (req, res) => {
//   const id = req.params.id;
//   const longURL = urlDatabase[id]; // Replace urlDatabase with your actual data source
//   const templateVars = { id, longURL };
//   res.render("urls_show", templateVars);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

// app.post("/urls", (req, res) => {
//   const longURL = req.body.longURL;
//   const shortURL = generateRandomString(6);

//   // Add the new URL to the database
//   urlDatabase[shortURL] = longURL;

//   // Redirect to the URL show page for the newly generated short URL
//   res.redirect(`/urls/${shortURL}`);
// });



// app.get("/u/:id", (req, res) => {
//   const id = req.params.id;
//   const newLongURL = req.body.newLongURL;

//   if (urlDatabase[id]) {
//     urlDatabase[id] = newLongURL;
//     res.redirect("/urls"); // Redirect back to the URLs index page
//   } else {
//     res.status(404).send("Short URL not found");
//   }
// });

// function generateRandomString(length) {
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let result = '';
//   for (let i = 0; i < length; i++) {
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     result += characters.charAt(randomIndex);
//   }
//   return result;
// }

// app.post("/login", (req, res) => {
//   const username = req.body.username;
//   res.cookie("username", username);
//   res.redirect("/urls");
// });

// app.listen(PORT, () => {
//   console.log(`Example app listening on port ${PORT}!`);
// });

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = { id: id, longURL: longURL };
  res.render("urls_show", templateVars);
});
app.post("/urls", (req, res) => {
  console.log(req.body);
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect("/urls");
});
app.post("/urls/:id", (req, res) => {
  console.log(req.body);
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  console.log(urlDatabase);
  res.redirect("/urls");
});
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

app.get("urls", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

