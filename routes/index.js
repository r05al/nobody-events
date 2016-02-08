var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Event = mongoose.model('Event');
var Comment = mongoose.model('Comment');

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

router.get('/events', function(req, res, next) {
  Event.find(function(err, events){
    if(err) { return next(err); }

    res.json(events);
  });
});

router.post('/events', function(req, res, next) {
  var event = new Event(req.body);

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
  req.event.populate('comments', function(err, event) {
    if (err) { return next(err); }

    res.json(event);
  });
});

router.put('/events/:event/upvote', function(req, res, next) {
  req.event.upvote(function(err, event){
    if (err) { return next(err); }

    res.json(event);
  });
});

router.post('/events/:event/comments', function(req, res, next){
  var comment = new Comment(req.body);
  comment.event = req.event;

  comment.save(function(err, comment){
    if(err) { return next(err); }

    req.event.comments.push(comment);
    req.event.save(function(err, event){
      if(err) { return next(err); }

      res.json(comment);
    });
  });
});

router.put('/events/:event/comments/:comment/upvote', function(req, res, next){
  req.comment.upvote(function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});

module.exports = router;
