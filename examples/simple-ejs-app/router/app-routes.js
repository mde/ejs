const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("home");
});

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/profile", (req, res) => {
  res.redirect(`/profile?username=${req.body.username}`);
});

router.get("/profile", (req, res) => {
  res.render("profile", { username: req.query.username });
});

router.get("/logout", (req, res) => {
  res.redirect("/");
});

module.exports = router;
