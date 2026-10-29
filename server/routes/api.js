import express from 'express';
import IncidentController from '../controllers/IncidentController.js';
import HotelController from '../controllers/HotelController.js';
import ResponsibleController from '../controllers/ResponsibleController.js';
import MajorIncidentController from '../controllers/MajorIncidentController.js';
import OvertimeAuthController from '../controllers/OvertimeAuthController.js';
import OvertimeController from '../controllers/OvertimeController.js';
import BackupController from '../controllers/BackupController.js';

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

// ── Rotas de Horas Extras ─────────────────────────────────────────────────────
router.get('/overtime/auth/status', OvertimeAuthController.getStatus);
router.post('/overtime/auth/setup', OvertimeAuthController.setup);
router.post('/overtime/auth/verify', OvertimeAuthController.verify);
router.put('/overtime/auth/config', OvertimeAuthController.updateConfig);

router.get('/overtime/chamados', OvertimeController.getChamados);
router.post('/overtime/chamados', OvertimeController.createChamado);
router.put('/overtime/chamados/:id', OvertimeController.updateChamado);
router.delete('/overtime/chamados/:id', OvertimeController.deleteChamado);
router.post('/overtime/chamados/bulk-delete', OvertimeController.bulkDeleteChamados);
router.get('/overtime/download-pdf', OvertimeController.downloadPdf);

// ── Rotas de Backup Integrado do Sistema ──────────────────────────────────────
router.get('/backup/download', BackupController.downloadBackup);

export default router;

