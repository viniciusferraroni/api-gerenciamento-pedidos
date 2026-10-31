const express = require('express');
const pedidosController = require('../controllers/pedidosController');

const router = express.Router();

router.post('/', pedidosController.criarPedido);
router.get('/', pedidosController.listarPedidos);
router.get('/:id', pedidosController.buscarPedidoPorId);
router.patch('/:id/status', pedidosController.atualizarStatusPedido);

module.exports = router;
