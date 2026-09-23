const express = require("express");

const router = new express.Router();
const AuthController = require("../controllers/authController")
const verifyToken = require("../middlewares/verifyJWT")


router.post("/register",AuthController.register);
router.post("/login",AuthController.login);
router.post("/verify",verifyToken,AuthController.verifyEmail);
router.post('/refresh',AuthController.handleRefresh);
router.post("/verifyCode",verifyToken,AuthController.sendVerifyCode);

module.exports = router

