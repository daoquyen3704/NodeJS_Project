const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerPosts = require('../controllers/posts.controller');

// USER
router.post('/api/create-post', authUser, asyncHandler(controllerPosts.createPost));
router.get('/api/get-posts', asyncHandler(controllerPosts.getPosts));
router.get('/api/get-post-by-id', asyncHandler(controllerPosts.getPostById));
router.get('/api/get-post-by-user-id', authUser, asyncHandler(controllerPosts.getPostByUserId));
router.post('/api/delete-post-user', authUser, asyncHandler(controllerPosts.deletePost));
router.post('/api/update-post-user', authUser, asyncHandler(controllerPosts.updatePostUser));
router.get('/api/get-new-post', asyncHandler(controllerPosts.getNewPost));
router.get('/api/post-suggest', asyncHandler(controllerPosts.postSuggest));
router.get('/api/get-post-vip', asyncHandler(controllerPosts.getPostVip));

// EXTEND POST (gia hạn)
router.post('/api/extend-post', authUser, asyncHandler(controllerPosts.extendPost));

// ADMIN
router.get('/api/get-all-posts', authAdmin, asyncHandler(controllerPosts.getAllPosts));
router.post('/api/approve-post', authAdmin, asyncHandler(controllerPosts.approvePost));
router.post('/api/reject-post', authAdmin, asyncHandler(controllerPosts.rejectPost));
router.post('/api/update-post', authAdmin, asyncHandler(controllerPosts.updatePost));
router.post('/api/delete-post', authAdmin, asyncHandler(controllerPosts.deletePostAdmin));

module.exports = router;
