const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const SECRET_KEY = "how do you turn this on"; // summons a Shelby AC Cobra in Age of Empires 2

const user = {
  email: "user@example.com",
  passwordHash: bcrypt.hashSync("password", 10),
};

function login(email, password) {
  if (email === user.email && bcrypt.compareSync(password, user.passwordHash)) {
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
    return { token };
  } else {
    throw new Error("Invalid credentials");
  }
}

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.redirect("/login");

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.redirect("/login");

    req.user = user;
    next();
  });
}

module.exports = { login, authenticateToken };
