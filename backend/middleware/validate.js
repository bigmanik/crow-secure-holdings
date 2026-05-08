// middleware/validate.js
import { validationResult } from 'express-validator';

// Runs after your validation rule arrays.
// If any rule failed, it returns a 400 with the full error list.
// If everything passed, it calls next() and your controller runs.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export default validate;