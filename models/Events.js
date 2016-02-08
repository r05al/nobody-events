var mongoose = require('mongoose');

var EventSchema = new mongoose.Schema({
  title: String,
  location: String,
  // attendants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

EventSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

mongoose.model('Event', EventSchema);
