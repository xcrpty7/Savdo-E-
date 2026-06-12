const reportService = require('../services/report.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getSummary = asyncHandler(async (req, res) => {
  const data = await reportService.getSummary(req.user.id);
  res.status(200).json(new ApiResponse(200, data, 'Summary retrieved'));
});

const getDailyReport = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const data = await reportService.getDailyReport(req.user.id, date);
  res.status(200).json(new ApiResponse(200, data, 'Daily report retrieved'));
});

const getMonthlyReport = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const data = await reportService.getMonthlyReport(req.user.id, month);
  res.status(200).json(new ApiResponse(200, data, 'Monthly report retrieved'));
});

const getAdminOverview = asyncHandler(async (req, res) => {
  const data = await reportService.getAdminOverview(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Overview retrieved'));
});

const getAdminActivity = asyncHandler(async (req, res) => {
  const data = await reportService.getAdminActivity(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Admin activity retrieved'));
});

const getSecurityReport = asyncHandler(async (req, res) => {
  const data = await reportService.getSecurityReport(req.query);
  res.status(200).json(new ApiResponse(200, data, 'Security report retrieved'));
});

const exportReport = asyncHandler(async (req, res) => {
  const csv = await reportService.exportReport(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
  res.status(200).send(csv);
});

module.exports = { getSummary, getDailyReport, getMonthlyReport, getAdminOverview, getAdminActivity, getSecurityReport, exportReport };
