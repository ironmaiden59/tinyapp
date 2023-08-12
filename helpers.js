// helpers.js
const getUserByEmail = function(email, usersDatabase) {
  for (const userId in usersDatabase) {
    if (usersDatabase.hasOwnProperty(userId) && usersDatabase[userId].email === email) {
      return usersDatabase[userId];
    }
  }
  return null;
};

module.exports = { getUserByEmail };