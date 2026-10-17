const Task = require('../models/Task');

const { STATUSES, PRIORITIES } = Task;

// Returns an error message if a value is provided but not allowed, otherwise null
function enumError(field, value, allowed) {
  if (value !== undefined && !allowed.includes(value)) {
    return `${field} must be one of: ${allowed.join(', ')}`;
  }
  return null;
}

// POST /api/tasks
exports.createTask = async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const problem = enumError('status', status, STATUSES) || enumError('priority', priority, PRIORITIES);
  if (problem) return res.status(400).json({ error: problem });

  const task = await Task.create({ user: req.userId, title, description, status, priority, dueDate });
  res.status(201).json(task);
};

// GET /api/tasks?status=&priority=&page=&limit=
exports.getTasks = async (req, res) => {
  const { status, priority } = req.query;
  const problem = enumError('status', status, STATUSES) || enumError('priority', priority, PRIORITIES);
  if (problem) return res.status(400).json({ error: problem });

  const filter = { user: req.userId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.status(200).json({
    data: tasks,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.status(200).json(task);
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({ error: 'title cannot be empty' });
  }
  const problem = enumError('status', status, STATUSES) || enumError('priority', priority, PRIORITIES);
  if (problem) return res.status(400).json({ error: problem });

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    updates,
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.status(200).json(task);
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.status(204).send();
};
