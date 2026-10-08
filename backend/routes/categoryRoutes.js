const express = require('express');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getCategories);
router.post('/', authMiddleware, authorizeRoles('admin'), createCategory);
router.put('/:id', authMiddleware, authorizeRoles('admin'), updateCategory);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), deleteCategory);

module.exports = router;
