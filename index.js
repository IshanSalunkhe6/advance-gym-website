const fs = require('fs');
const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const upload = require('./upload'); // Ensure this path is correct

const Gym = require('./module/gym');
const Group = require('./module/group'); // Import the Group model

const app = express();

// Create the uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.static('public'));
app.use('/test7', express.static(path.join(__dirname, 'test7')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method')); // Method override middleware

const PORT = 5000;

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/gym');
  console.log("connected");
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Middleware to check if the user is logged in
function checkAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

// Function to generate unique IDs
function generateUniqueId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Routing
app.get('/login', (req, res) => {
  res.render('connect/login');
});

app.post('/login', async (req, res) => {
  try {
    const user = await Gym.findOne({ email: req.body.email, name: req.body.name });

    if (!user) {
      return res.send("User not found");
    }

    if (user.password === req.body.password) {
      req.session.userId = user._id; // Store user ID in session
      res.redirect(`/homepage`);
    } else {
      return res.render('connect/login', { error: "Wrong password" });
    }
  } catch (err) {
    console.error(err);
    res.send("Error");
  }
});

app.post('/create', async (req, res) => {
  const newEmail = new Gym(req.body);
  await newEmail.save();
  res.redirect('/login');
});

app.get('/create', (req, res) => {
  res.render('connect/create');
});

app.get('/homepage', checkAuthenticated, async (req, res) => {
  try {
    const userinfo = await Gym.findById(req.session.userId);
    if (!userinfo) {
      return res.redirect('/login');
    }
    res.render('connect/home', { userinfo });
  } catch (error) {
    console.error('Error', error);
    res.send('Error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.get('/ai_personal_trainer', checkAuthenticated, (req, res) => {
  res.render('connect/ai_personal_trainer');
});

app.get('/community', async (req, res) => {
  try {
    const currentUserID = req.session.userId;

    const groups = await Group.find({
      ownerId: { $ne: currentUserID },
      'members.userId': { $ne: currentUserID }
    }).populate('ownerId'); // Populate the ownerId field

    res.render('connect/grouphomepage', { groups });
  } catch (err) {
    console.error(err);
    res.send("Error fetching groups");
  }
});


app.get('/addgroup', async (req, res) => {
  res.render('connect/creategroup');
});

app.post('/create_group', upload.single('logo'), async (req, res) => {
  try {
    const { group_name, title, country, experience, description } = req.body;
    const ownerId = req.session.userId;
    const groupId = generateUniqueId();
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!ownerId) {
      return res.status(401).send('Unauthorized');
    }

    console.log("Logo path:", logo); // Log the logo path

    const newGroup = new Group({
      groupId: groupId,
      group_name: group_name,
      title: title,
      country: country,
      experience: experience,
      description: description,
      ownerId: ownerId,
      logo: logo
    });

    await newGroup.save();
    res.redirect('/community');
  } catch (err) {
    console.error(err);
    res.send("Error creating group");
  }
});

app.delete('/deletegroup/:groupId', checkAuthenticated, async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findOneAndDelete({ groupId: groupId, ownerId: req.session.userId });

    if (!group) {
      return res.status(404).send('Group not found or you are not authorized to delete this group');
    }

    res.status(200).send('Group deleted');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/group', async (req, res) => {
  try {
    const groups = await Group.find({ ownerId: req.session.userId });
    res.render('connect/groupinterface', { groups });
  } catch (err) {
    console.error(err);
    res.send("Error fetching groups");
  }
});

app.get('/joinedgroups', async (req, res) => {
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
});

app.get("/groupmembers/:id", async (req, res) => {
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
});

app.get('/joinedgroups/:id', async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ groupId: id });
  res.render('connect/joinedgrouphomepage', { group });
});

app.get('/viewdetailsowner/:id', async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ groupId: id });

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  res.render('connect/ownerpageview', { group });
});

app.get('/createpost/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findOne({ groupId: groupId });

    if (!group) {
      return res.status(404).send('Group not found');
    }

    res.render('connect/createpost', { group: group });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/createpost/:groupId', upload.single('post-image'), async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { 'post-content': postContent, title } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const newPost = {
      title: title,
      image: image,
      text: postContent
    };

    const group = await Group.findOneAndUpdate(
      { groupId: groupId },
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
});

app.get('/viewpostpage', async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const group = await Group.findOne({ ownerId: ownerId });

    if (!group) {
      return res.status(404).send('Group not found');
    }

    res.render('connect/ownerpageview', { group: group });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/subscribe/:id', async (req, res) => {
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
});

app.get('/pay/:id', async (req, res) => {
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
});

app.delete('/deletepost/:groupId/:postId', checkAuthenticated, async (req, res) => {
  const { groupId, postId } = req.params;

  try {
    const group = await Group.findOneAndUpdate(
      { groupId: groupId },
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
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
