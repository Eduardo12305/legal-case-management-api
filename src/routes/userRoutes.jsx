const { Router } = require('express');
const userController = require('../controllers/userController.jsx');
const { authMiddleware, authorizePermissions, authorizeRoles } = require('../middlewares/auth.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const { Permissions } = require('../modules/access-control/permissions.jsx');
const {
  changePasswordBody,
  listUsersQuery,
  setStaffPermissionsBody,
  toggleUserParams,
  updateClientBody,
  updateProfileBody,
} = require('../validators/userValidators.jsx');

const router = Router();

router.use(authMiddleware);

router.get('/profile', asyncHandler((req, res) => userController.getProfile(req, res)));
router.put('/profile', validateRequest({ body: updateProfileBody }), asyncHandler((req, res) => userController.updateProfile(req, res)));
router.put('/profile/client', authorizeRoles('CLIENT'), validateRequest({ body: updateClientBody }), asyncHandler((req, res) => userController.updateClientData(req, res)));
router.put('/change-password', validateRequest({ body: changePasswordBody }), asyncHandler((req, res) => userController.changePassword(req, res)));

router.get('/', authorizeRoles('ADMIN', 'LAWYER'), validateRequest({ query: listUsersQuery }), asyncHandler((req, res) => userController.listUsers(req, res)));
router.patch('/:id/toggle-active', authorizeRoles('ADMIN'), validateRequest({ params: toggleUserParams }), asyncHandler((req, res) => userController.toggleUserActive(req, res)));
router.put('/:id/staff-permissions', authorizePermissions(Permissions.STAFF_PERMISSION_MANAGE), validateRequest({ params: toggleUserParams, body: setStaffPermissionsBody }), asyncHandler((req, res) => userController.setStaffPermissions(req, res)));

module.exports = router;
