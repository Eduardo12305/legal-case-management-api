function sanitizeUser(user) {
  if (!user) return user;

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

function sanitizeUserCollection(users = []) {
  return users.map(sanitizeUser);
}

module.exports = {
  sanitizeUser,
  sanitizeUserCollection,
};
