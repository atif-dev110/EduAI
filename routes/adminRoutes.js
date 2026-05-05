// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAllStudentsForAdmin } = require('../controllers/adminController');

// This matches the fetch URL we will use in React
router.get('/students', getAllStudentsForAdmin);

module.exports = router;