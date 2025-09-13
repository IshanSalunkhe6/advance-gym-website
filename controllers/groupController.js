const Group = require('../models/group');

// same helper as before
function generateUniqueId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// GET /community
exports.getCommunity = async (req, res) => {
  try {
    const currentUserID = req.session.userId;

    const groups = await Group.find({
      ownerId: { $ne: currentUserID },
      'members.userId': { $ne: currentUserID }
    }).populate('ownerId');

    res.render('connect/grouphomepage', { groups });
  } catch (err) {
    console.error(err);
    res.send("Error fetching groups");
  }
};

// GET /addgroup
exports.getAddGroup = async (req, res) => {
  res.render('connect/creategroup');
};

// POST /create_group  (uses upload.single('logo'))
exports.postCreateGroup = async (req, res) => {
  try {
    const { group_name, title, country, experience, description } = req.body;
    const ownerId = req.session.userId;
    const groupId = generateUniqueId();
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!ownerId) {
      return res.status(401).send('Unauthorized');
    }

    console.log("Logo path:", logo);

    const newGroup = new Group({
      groupId,
      group_name,
      title,
      country,
      experience,
      description,
      ownerId,
      logo
    });

    await newGroup.save();
    res.redirect('/community');
  } catch (err) {
    console.error(err);
    res.send("Error creating group");
  }
};

// DELETE /deletegroup/:groupId
exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findOneAndDelete({ groupId, ownerId: req.session.userId });

    if (!group) {
      return res.status(404).send('Group not found or you are not authorized to delete this group');
    }

    res.status(200).send('Group deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// GET /group  (owner’s groups)
exports.getOwnerGroups = async (req, res) => {
  try {
    const groups = await Group.find({ ownerId: req.session.userId });
    res.render('connect/groupinterface', { groups });
  } catch (err) {
    console.error(err);
    res.send("Error fetching groups");
  }
};

// GET /joinedgroups
exports.getJoinedGroups = async (req, res) => {
  try {
    const currentUserID = req.session.userId;
    const groups = await Group.find({
      'members.userId': currentUserID
    });

    res.render('connect/joinedgroups', { groups });
  } catch (err) {
    console.error(err);
    res.send("Error fetching groups");
  }
};

// GET /groupmembers/:id
exports.getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findOne({ groupId: id }).populate('members.userId');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const memberNames = group.members.reduce((names, member) => {
      if (member.userId) {
        names.push(member.userId.name);
      }
      return names;
    }, []);

    res.render("connect/groupmemberlist", { memberNames });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// GET /joinedgroups/:id
exports.getJoinedGroupHome = async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ groupId: id });
  res.render('connect/joinedgrouphomepage', { group });
};

// GET /viewdetailsowner/:id
exports.getOwnerGroupDetails = async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ groupId: id });

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  res.render('connect/ownerpageview', { group });
};

// GET /createpost/:groupId
exports.getCreatePost = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findOne({ groupId });

    if (!group) {
      return res.status(404).send('Group not found');
    }

    res.render('connect/createpost', { group });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// POST /createpost/:groupId  (uses upload.single('post-image'))
exports.postCreatePost = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { 'post-content': postContent, title } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = { title, image, text: postContent };

    const group = await Group.findOneAndUpdate(
      { groupId },
      { $push: { posts: newPost } },
      { new: true }
    );

    if (!group) {
      return res.status(404).send('Group not found');
    }

    res.redirect(`/viewdetailsowner/${groupId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// GET /viewpostpage
exports.getViewPostPage = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const group = await Group.findOne({ ownerId });

    if (!group) {
      return res.status(404).send('Group not found');
    }

    res.render('connect/ownerpageview', { group });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// GET /subscribe/:id
exports.getSubscribe = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findOne({ groupId: id });

    if (!group) {
      return res.status(404).send('Group not found');
    }

    res.render('connect/paymentpage', { group });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// GET /pay/:id
exports.getPay = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const group = await Group.findOne({ groupId: id });

    if (!group) {
      return res.status(404).send('Group not found');
    }

    group.members.push({ userId, status: 'subscribed' });
    await group.save();

    res.redirect('/community');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// DELETE /deletepost/:groupId/:postId
exports.deletePost = async (req, res) => {
  const { groupId, postId } = req.params;

  try {
    const group = await Group.findOneAndUpdate(
      { groupId },
      { $pull: { posts: { _id: postId } } },
      { new: true }
    );

    if (!group) {
      return res.status(404).send('Group or post not found');
    }

    res.redirect(`/viewdetailsowner/${groupId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
