const mongoose = require('mongoose');

// Define the Post schema
const postSchema = new mongoose.Schema({
  title: String,
  image: String,
  caption: String,
  text: String
}, { timestamps: true });

// Define the Group schema
const groupSchema = new mongoose.Schema({
  groupId:     { type: String, required: true, unique: true },
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
  group_name:  { type: String, required: true },
  country:     { type: String, required: true },
  experience:  { type: String, required: true },
  description: { type: String, required: true },
  title:       { type: String, required: true },
  logo:        { type: String },
  posts:       [postSchema],
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym' },
    status: { type: String, enum: ['subscribe', 'subscribed'], default: 'subscribe' }
  }]
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;          // <<< export the model itself
