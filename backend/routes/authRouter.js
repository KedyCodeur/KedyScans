const express = require("express");

const router = new express.Router();
const AuthController = require("../controllers/authController")


router.post("/register",AuthController.register)
router.post("/login",AuthController.login)


module.exports = router

