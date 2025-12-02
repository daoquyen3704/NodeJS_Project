const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerUsers = require('../controllers/users.controller');

router.post('/api/register', asyncHandler(controllerUsers.register));
router.post('/api/login', asyncHandler(controllerUsers.login));
router.post('/api/login-google', asyncHandler(controllerUsers.loginGoogle));

router.get('/api/auth', authUser, asyncHandler(controllerUsers.authUser));
router.get('/api/logout', authUser, asyncHandler(controllerUsers.logout));
router.get('/api/refresh-token', asyncHandler(controllerUsers.refreshToken));

router.get('/api/recharge-user', authUser, asyncHandler(controllerUsers.getRechargeUser));
router.post('/api/update-user', authUser, asyncHandler(controllerUsers.updateUser));
router.post('/api/change-password', authUser, asyncHandler(controllerUsers.changePassword));

router.post('/api/forgot-password', asyncHandler(controllerUsers.forgotPassword));
router.post('/api/reset-password', asyncHandler(controllerUsers.resetPassword));

// ADMIN
router.get('/api/get-users', authAdmin, asyncHandler(controllerUsers.getUsers));
router.get('/api/get-admin-stats', authAdmin, asyncHandler(controllerUsers.getAdminStats));
router.get('/api/get-recharge-stats', authAdmin, asyncHandler(controllerUsers.getRechargeStats));
router.post('/api/admin/ban-user', authAdmin, asyncHandler(controllerUsers.adminBanUser));
router.post('/api/admin/delete-user', authAdmin, asyncHandler(controllerUsers.adminDeleteUser));
router.post('/api/admin/update-user', authAdmin, asyncHandler(controllerUsers.adminUpdateUser));
router.post('/api/admin/create-user', authAdmin, asyncHandler(controllerUsers.adminCreateUser));
router.post('/api/admin/reset-password', authAdmin, asyncHandler(controllerUsers.adminResetPassword));

router.get('/api/get-hot-search', asyncHandler(controllerUsers.getHotSearch));
router.get('/api/search', asyncHandler(controllerUsers.searchKeyword));

router.post('/api/add-search-keyword', asyncHandler(controllerUsers.addSearchKeyword));
router.get('/api/get-search-keyword', asyncHandler(controllerUsers.searchKeyword));

router.get('/admin', authAdmin, (req, res) => {
    res.status(200).json({ message: true });
});

module.exports = router;
