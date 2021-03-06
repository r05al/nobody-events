var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

var Event = mongoose.model('Event');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');


var populatedEvent = function(req, res, next) {
  var query = Event.findById(req.event._id).populate('author', 'username')
    .populate('attendants', 'username').populate('comments');

  query.exec(function(err,event) {
    if (err) { return next(err); }
    if (!event) { return next(new Error('can\'t find event')); }

    User.populate(event, {
      path: 'comments.author',
    }, function(err, event) {

      req.populatedEvent = event;
      return next();
    });
  });
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.param('event', function(req, res, next, id) {
  var query = Event.findById(id);

  query.exec(function(err, event) {
    if (err) { return next(err); }
    if (!event) { return next(new Error('can\'t find event')); }

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

router.param('user', function(req, res, next, id) {
  var query = User.findById(id);

  query.exec(function(err, user) {
    if (err) { return next(err); }
    if (!user) { return next(new Error('can\'t find user')); }

    req.user = user;
    return next();
  });
});

router.get('/users/:user', function(req, res, next) {
  Event.find()
  res.json(req.user);
});

router.get('/events', function(req, res, next) {
  var query = Event.find();

  query.exec(function(err, events) {
    if (err) { return next(err); }
    if (!events) { return next(new Error('can\'t find events')); }

    User.populate(events, {
      path: 'author',
    }, function(err, event) {

      res.json(event);
    });
  });

  // Event.find(function(err, events){
  //   if(err) { return next(err); }

  //   events.populate('author', function(err, event) {
  //     if (err) { return next(err); }

  //     res.json(event);
  //   });

  //   res.json(events);
  // });
});

router.post('/events', auth, function(req, res, next) {
  var event = new Event(req.body);

  event.author = req.payload;

  event.save(function(err, event) {
    if(err) { return next(err); }

    event.populate('author', function(err, event) {
      if (err) { return next(err); }

      res.json(event);
    })
  });
});

// router.route('/events/:event')
//   .get(function(req, res){
//     res.json(req.event);
//   });

router.get('/events/:event', populatedEvent, function(req, res, next) {
  res.json(req.populatedEvent);
});

router.delete('/events/:event', function(req, res, next) {
  Event.remove({ _id: req.event._id }, function(err, event) {
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

      comment.populate('author', function(err, comment) {
        if (err) { return next(err); }

        res.json(comment);
      });
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
