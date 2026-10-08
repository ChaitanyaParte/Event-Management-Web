const express = require('express');
const { getRequirementItems } = require('../controllers/requirementController');

const router = express.Router();

router.get('/', getRequirementItems);

module.exports = router;
