const { Router } = require('express');
const processController = require('../controllers/processController.jsx');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth.jsx');
const validateRequest = require('../middlewares/validateRequest.jsx');
const asyncHandler = require('../utils/asyncHandler.jsx');
const {
  addDocumentBody,
  addUpdateBody,
  createProcessBody,
  getByClientParams,
  processIdParams,
  processListQuery,
  processStatusQuery,
  updateProcessBody,
  updateStatusBody,
} = require('../validators/processValidators.jsx');

const router = Router();

router.use(authMiddleware);

router.get('/my', authorizeRoles('CLIENT'), validateRequest({ query: processListQuery }), asyncHandler((req, res) => processController.getMyProcesses(req, res)));
router.get('/', authorizeRoles('ADMIN', 'LAWYER'), validateRequest({ query: processStatusQuery }), asyncHandler((req, res) => processController.listAll(req, res)));
router.post('/', authorizeRoles('LAWYER'), validateRequest({ body: createProcessBody }), asyncHandler((req, res) => processController.create(req, res)));
router.get('/client/:clientId', authorizeRoles('ADMIN', 'LAWYER'), validateRequest({ params: getByClientParams, query: processListQuery }), asyncHandler((req, res) => processController.getByClientId(req, res)));
router.get('/:id', validateRequest({ params: processIdParams }), asyncHandler((req, res) => processController.getById(req, res)));
router.get('/:id/logs', validateRequest({ params: processIdParams, query: processListQuery }), asyncHandler((req, res) => processController.getLogs(req, res)));
router.put('/:id', authorizeRoles('LAWYER'), validateRequest({ params: processIdParams, body: updateProcessBody }), asyncHandler((req, res) => processController.update(req, res)));
router.patch('/:id/status', authorizeRoles('LAWYER'), validateRequest({ params: processIdParams, body: updateStatusBody }), asyncHandler((req, res) => processController.updateStatus(req, res)));
router.delete('/:id', authorizeRoles('ADMIN'), validateRequest({ params: processIdParams }), asyncHandler((req, res) => processController.delete(req, res)));
router.post('/:id/documents', authorizeRoles('LAWYER'), validateRequest({ params: processIdParams, body: addDocumentBody }), asyncHandler((req, res) => processController.addDocument(req, res)));
router.post('/:id/updates', authorizeRoles('LAWYER'), validateRequest({ params: processIdParams, body: addUpdateBody }), asyncHandler((req, res) => processController.addUpdate(req, res)));

module.exports = router;
