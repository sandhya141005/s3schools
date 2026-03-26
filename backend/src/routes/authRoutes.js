const express = require('express');
const { register, login, logout, resetPassword, getMe } = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router()

//Auth routes

//Public
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

//Protected
router.post("/reset-password", authMiddleware, resetPassword);
router.get("/me", authMiddleware, getMe);

module.exports = router;