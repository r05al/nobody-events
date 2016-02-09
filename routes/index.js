var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

var Event = mongoose.model('Event');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.param('event', function(req, res, next, id) {
  var query = Event.findById(id);

  query.exec(function(err, event) {
    if (err) { return next(err); }
    if (!event) { return next(new Error('can\'t find event')); }

    event.username = "test";
    req.event = event;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function(err, comment) {
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });
});

router.get('/users', function(req, res, next) {
  User.find(function(err, users){
    if(err) { return next(err); }

    res.json(users);
  });
});

router.get('/events', function(req, res, next) {
  Event.find(function(err, events){
    if(err) { return next(err); }

    res.json(events);
  });
});

router.post('/events', auth, function(req, res, next) {
  var event = new Event(req.body);

  event.author = req.payload;

  event.save(function(err, event) {
    if(err) { return next(err); }

    res.json(event);
  });
});

// router.route('/events/:event')
//   .get(function(req, res){
//     res.json(req.event);
//   });

router.get('/events/:event', function(req, res, next) {
  req.event.populate('attendants').populate('comments', function(err, event) {
    if (err) { return next(err); }

    res.json(event);
  });
});

router.put('/events/:event/upvote', auth, function(req, res, next) {
  req.event.upvote(function(err, event){
    if (err) { return next(err); }

    res.json(event);
  });
});

router.post('/events/:event/comments', auth, function(req, res, next){
  var comment = new Comment(req.body);
  comment.event = req.event;
  comment.author = req.payload;

  comment.save(function(err, comment){
    if(err) { return next(err); }

    req.event.comments.push(comment);
    req.event.save(function(err, event){
      if(err) { return next(err); }

      res.json(comment);
    });
  });
});

router.post('/events/:event/attend', auth, function(req, res, next){
  var joiner = req.payload;

  req.event.addAttendant(joiner);
  req.event.populate('attendants', function(err, event){
    if(err) { return next(err); }

    res.json(event);
  });
});

router.put('/events/:event/cancel', auth, function(req, res, next){
  var joiner = req.payload;

  req.event.removeAttendant(joiner);
  req.event.populate('attendants', function(err, event){
    if(err) { return next(err); }

    res.json(event);
  })
});

router.put('/events/:event/comments/:comment/upvote', auth, function(req, res, next){
  req.comment.upvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});

router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({ message: 'Please fill out all fields' });
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password);

  user.save(function(err) {
    if(err) { return next(err); }

    return res.json({ token: user.generateJWT()});
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({ message: 'Please fill out all fields' });
  }

  passport.authenticate('local', function(err, user, info){
    if(err) { return next(err) }

    if(user) {
      return res.json({ token: user.generateJWT() });
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
