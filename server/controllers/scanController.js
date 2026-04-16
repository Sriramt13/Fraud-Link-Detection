import Scan from "../models/Scan.js";
import { callMLService } from "../services/mlService.js";
import { logger } from "../utils/logger.js";
import { recordScanRequest } from "../services/realtimeMetrics.js";

export const scanMessage = async (req, res, mlUrl) => {
  try {
    const { message } = req.body;

    const result = await callMLService(message, mlUrl);

    await Scan.create({
      userId: req.user.id,
      message,
      ...result
    });

    recordScanRequest({ success: true });

    res.json({ success: true, data: { ...result, message } });

  } catch (error) {
    recordScanRequest({ success: false });
    logger.error("Scan Error", { error: error.message });
    res.status(500).json({ success: false, error: "ML service unavailable" });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const scans = await Scan.find({ userId: req.user.id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ scannedAt: -1 });

    const total = await Scan.countDocuments({ userId: req.user.id });
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: scans,
      pagination: { page: parseInt(page), limit: parseInt(limit), pages, total }
    });

  } catch (error) {
    logger.error("History Error", { error: error.message });
    res.status(500).json({ success: false, error: "Failed to fetch history" });
  }
};

export const deleteHistoryItem = async (req, res) => {
  try {
    const { scanId } = req.params;

    const deleted = await Scan.findOneAndDelete({
      _id: scanId,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "History item not found"
      });
    }

    return res.json({
      success: true,
      message: "History item deleted"
    });

  } catch (error) {
    logger.error("Delete History Item Error", { error: error.message });
    return res.status(500).json({ success: false, error: "Failed to delete history item" });
  }
};

export const deleteHistoryBulk = async (req, res) => {
  try {
    const body = req.body || {};
    const query = req.query || {};

    const deleteAll = body.deleteAll === true
      || body.deleteAll === "true"
      || query.deleteAll === "true";

    const ids = Array.isArray(body.ids)
      ? body.ids
      : Array.isArray(query.ids)
        ? query.ids
        : typeof query.ids === "string"
          ? query.ids.split(",")
          : [];

    let filter = { userId: req.user.id };
    let selectedCount = 0;

    if (!deleteAll) {
      const safeIds = Array.isArray(ids) ? [...new Set(ids.filter(Boolean))] : [];
      selectedCount = safeIds.length;

      if (!safeIds.length) {
        return res.status(400).json({
          success: false,
          error: "Provide history ids or set deleteAll=true"
        });
      }

      filter = {
        userId: req.user.id,
        _id: { $in: safeIds }
      };
    }

    const result = await Scan.deleteMany(filter);
    const deletedCount = result.deletedCount || 0;

    if (!deleteAll && deletedCount === 0 && selectedCount > 0) {
      return res.status(404).json({
        success: false,
        error: "Selected history items were not found"
      });
    }

    return res.json({
      success: true,
      message: "History deleted",
      deletedCount
    });

  } catch (error) {
    logger.error("Delete History Bulk Error", { error: error.message });
    return res.status(500).json({ success: false, error: "Failed to delete history" });
  }
};