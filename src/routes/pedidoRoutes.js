const express = require('express');
const pedidoController = require('../controllers/pedidoController');

const router = express.Router();

router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.consultar);
router.post('/', pedidoController.criar);
router.patch('/:id/status', pedidoController.atualizarStatus);

module.exports = router;
