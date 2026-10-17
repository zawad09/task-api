// TEMPORARY: replaced by real JWT auth on Day 3.
// Reads the user id from the x-user-id header so tasks can be scoped per user.
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
  const id = req.header('x-user-id');
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(401).json({ error: 'Missing or invalid x-user-id header' });
  }
  req.userId = id;
  next();
};
