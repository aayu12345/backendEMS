const bcrypt = require('bcryptjs');

console.log("admin123 -> " + bcrypt.hashSync("admin123", 10));
console.log("employee123 -> " + bcrypt.hashSync("employee123", 10));
