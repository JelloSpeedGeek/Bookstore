app.post('/login', jsonParser, (req, res) => {
  const { username, password } = req.body;
 
  User.findOne({ username }).then(user => {
    if (!user || !passwordIsCorrect(user, password)) throw Error('403');
   
    redis.set(crypto.getRandomString(), user.id);
    res.sendStatus(200);
  });
});
 
function passwordIsCorrect(user, password) {
  return hash(password + user.salt) === user.hashedPassword;
}
 
app.use((req, res, next) => {
  redis.get(req.headers.Auth).then(reply => {
    if (reply) {
      User.findById(reply).then(user => {
        req.user = user
        next();
      });
    } else {
      throw new Error('403');
    }
  })
});
 
app.get('/secure', (req, res) => {
  // req.user
  switch (req.user.id) {
    case 1: res.send('one user 1 can see this'); break;
    case 2: res.send('one user 2 can see this'); break;
  }
})
 
app.use((req, res, next, err) => {
  if (err.message === '403') {
    res.json(403, { message: 'auth error', detail: 'not authenticated' });
  } else {
    res.json(500, { message: 'server error' });
  }
});