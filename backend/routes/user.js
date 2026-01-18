const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/profile', userController.getUser);
router.put('/profile', userController.updateUser);
router.post('/logout', userController.logout);

module.exports = router;
