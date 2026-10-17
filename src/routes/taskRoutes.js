const express = require('express');
const mongoose = require('mongoose');
const tempAuth = require('../middleware/tempAuth');
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/taskController');

const router = express.Router();

router.use(tempAuth);

// Reject malformed ids with 400 before they reach the database
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid task id' });
  next();
});

router.route('/')
  .post(asyncHandler(controller.createTask))
  .get(asyncHandler(controller.getTasks));

router.route('/:id')
  .get(asyncHandler(controller.getTask))
  .patch(asyncHandler(controller.updateTask))
  .delete(asyncHandler(controller.deleteTask));

module.exports = router;
