const { Router } = require('express');
const processController = require('../controllers/processController');
const { authMiddleware, authorizeRoles } = require('../middlewares/auth');

const router = Router();

router.use(authMiddleware);

// Client: ver seus próprios processos
router.get('/my', authorizeRoles('CLIENT'), (req, res) => processController.getMyProcesses(req, res));

// Admin/Lawyer: listar todos e criar processos
router.get('/', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.listAll(req, res));
router.post('/', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.create(req, res));

// Admin/Lawyer: processos por cliente
router.get('/client/:clientId', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.getByClientId(req, res));

// Detalhes do processo (autenticado)
router.get('/:id', (req, res) => processController.getById(req, res));

// Admin/Lawyer: atualizar e deletar
router.put('/:id', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.update(req, res));
router.patch('/:id/status', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.updateStatus(req, res));
router.delete('/:id', authorizeRoles('ADMIN'), (req, res) => processController.delete(req, res));

// Documentos e atualizações do processo
router.post('/:id/documents', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.addDocument(req, res));
router.post('/:id/updates', authorizeRoles('ADMIN', 'LAWYER'), (req, res) => processController.addUpdate(req, res));

module.exports = router;
