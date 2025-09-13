const express = require('express');
const router = express.Router();
const group = require('../controllers/groupController');
const upload = require('../upload'); // reuse your existing multer setup

// same middleware behavior as before
function checkAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

router.get('/community', group.getCommunity);

router.get('/addgroup', group.getAddGroup);
router.post('/create_group', upload.single('logo'), group.postCreateGroup);

router.delete('/deletegroup/:groupId', checkAuthenticated, group.deleteGroup);

router.get('/group', group.getOwnerGroups);
router.get('/joinedgroups', group.getJoinedGroups);
router.get('/groupmembers/:id', group.getGroupMembers);
router.get('/joinedgroups/:id', group.getJoinedGroupHome);

router.get('/viewdetailsowner/:id', group.getOwnerGroupDetails);

router.get('/createpost/:groupId', group.getCreatePost);
router.post('/createpost/:groupId', upload.single('post-image'), group.postCreatePost);

router.get('/viewpostpage', group.getViewPostPage);

router.get('/subscribe/:id', group.getSubscribe);
router.get('/pay/:id', group.getPay);

router.delete('/deletepost/:groupId/:postId', checkAuthenticated, group.deletePost);

module.exports = router;
