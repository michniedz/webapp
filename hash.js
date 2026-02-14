const bcrypt = require('bcryptjs');
const password = 'test';
bcrypt.hash(password, 10, (err, hash) => {
    console.log(hash);
});