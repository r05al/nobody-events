var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
  title: String,
  location: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

EventSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

EventSchema.methods.addAttendant = function(user, cb) {
  this.attendants.addToSet(user);
  this.save(cb);
};

EventSchema.methods.removeAttendant = function(user, cb) {
  this.attendants.pull(user);
  this.save(cb);
};

mongoose.model('Event', EventSchema);
