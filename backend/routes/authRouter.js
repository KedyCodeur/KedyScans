const express = require("express");

const router = new express.Router();
const AuthController = require("../controllers/authController")


router.post("/register",AuthController.register)



module.exports = router

