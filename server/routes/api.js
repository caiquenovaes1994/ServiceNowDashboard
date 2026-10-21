import express from 'express';
import IncidentController from '../controllers/IncidentController.js';
import HotelController from '../controllers/HotelController.js';
import ResponsibleController from '../controllers/ResponsibleController.js';
import MajorIncidentController from '../controllers/MajorIncidentController.js';

const router = express.Router();

// ── Rotas de Incidentes ───────────────────────────────────────────────────────
router.get('/incidentes', IncidentController.getAll);
router.post('/incidentes', IncidentController.create);
router.put('/incidentes/reordenar', IncidentController.reorder);
router.put('/incidentes/:id', IncidentController.update);
router.delete('/incidentes/:id', IncidentController.delete);
router.get('/incidentes/:id/historico', IncidentController.getHistory);
router.get('/incidentes/:id/chamados', IncidentController.getChamadosFilhos);
router.post('/incidentes/:id/chamados', IncidentController.addChamadoFilho);
router.delete('/incidentes/chamados/:idChamado', IncidentController.removeChamadoFilho);

// ── Rotas de Hotéis ───────────────────────────────────────────────────────────
router.get('/hoteis', HotelController.getAll);
router.post('/hoteis', HotelController.create);
router.put('/hoteis/:id', HotelController.update);
router.delete('/hoteis/:id', HotelController.delete);

// ── Rotas de Responsáveis ─────────────────────────────────────────────────────
router.get('/responsaveis', ResponsibleController.getAll);
router.post('/responsaveis', ResponsibleController.create);
router.put('/responsaveis/:id', ResponsibleController.update);
router.delete('/responsaveis/:id', ResponsibleController.delete);

// ── Rotas de Major Incidents ──────────────────────────────────────────────────
router.get('/incidentes-maiores', MajorIncidentController.getAll);
router.post('/incidentes-maiores/:numero/toggle', MajorIncidentController.toggleResponsibility);

export default router;
