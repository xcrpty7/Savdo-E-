const auditService = require('../services/audit.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getAuditLogs = asyncHandler(async (req, res) => {
  const data = await auditService.getAuditLogs(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Audit logs retrieved'));
});

const getAuditLogsExport = asyncHandler(async (req, res) => {
  const csv = await auditService.getAuditLogsExport(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
  res.status(200).send(csv);
});

module.exports = { getAuditLogs, getAuditLogsExport };
