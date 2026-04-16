import { motion } from "framer-motion";
import { FaCopy, FaSearch, FaTrash } from "react-icons/fa";
import "./HistoryCard.css";

function HistoryCard({
  scan,
  index = 0,
  onSelect,
  isSelected = false,
  onDelete,
  isSelectionMode = false,
  isChecked = false,
  onToggleSelect
}) {
  const safeScan = scan || {};
  const safeCategory = String(safeScan.category || "Unknown");
  const safeMessage = String(safeScan.message || "No message available");
  const safeRiskScore = Number(safeScan.risk_score) || 0;

  const getCategoryColor = (category) => {
    const lowerCat = String(category || "").toLowerCase();
    if (lowerCat.includes("safe")) return "#22c55e";
    if (lowerCat.includes("suspicious")) return "#ffa500";
    return "#ef4444";
  };

  const getCategoryClass = (category) => {
    const lowerCat = String(category || "").toLowerCase();
    if (lowerCat.includes("safe")) return "safe";
    if (lowerCat.includes("suspicious")) return "suspicious";
    return "high-risk";
  };

  const extractUrl = (text = "") => {
    const match = String(text).match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);
    if (!match) return "";
    const raw = match[0].trim().replace(/[),.;]+$/, "");
    return raw.startsWith("http") ? raw : `https://${raw}`;
  };

  const handleCopyUrl = async (event) => {
    event.stopPropagation();
    const candidate = safeScan.url_found || extractUrl(safeMessage);
    if (!candidate) return;

    try {
      await navigator.clipboard.writeText(candidate);
    } catch {
      // Ignore clipboard errors silently to avoid interrupting normal flow.
    }
  };

  const handleAnalyzeAgain = (event) => {
    event.stopPropagation();
    onSelect?.(safeScan);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    onDelete?.(safeScan);
  };

  const handleToggle = (event) => {
    event.stopPropagation();
    onToggleSelect?.(safeScan._id);
  };

  const scannedAt = safeScan.scannedAt ? new Date(safeScan.scannedAt) : null;
  const safeDate = scannedAt && !Number.isNaN(scannedAt.getTime())
    ? scannedAt.toLocaleDateString()
    : "Unknown date";

  return (
    <motion.div
      className={`history-card ${getCategoryClass(safeCategory)} ${isSelected ? "selected" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -5, boxShadow: "0 12px 30px rgba(0, 212, 255, 0.2)" }}
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelect?.(safeScan._id);
          return;
        }

        onSelect?.(safeScan);
      }}
    >
      {isSelectionMode && (
        <label className="history-select-control" onClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleToggle}
          />
          Select
        </label>
      )}

      <div className="history-message">
        {safeMessage.length > 100
          ? safeMessage.substring(0, 100) + "..."
          : safeMessage}
      </div>

      <div className="history-meta">
        <motion.span
          className={`category ${getCategoryClass(safeCategory)}`}
          style={{ borderLeftColor: getCategoryColor(safeCategory) }}
          whileHover={{ scale: 1.05 }}
        >
          {safeCategory}
        </motion.span>

        <motion.span className="score" whileHover={{ scale: 1.1 }}>
          {Math.round(safeRiskScore)}%
        </motion.span>
      </div>

      <div className="history-date">
        {safeDate}
      </div>

      <div className="history-actions">
        <button type="button" className="history-action-btn" onClick={handleCopyUrl}>
          <FaCopy />
          Copy
        </button>
        <button type="button" className="history-action-btn" onClick={handleAnalyzeAgain}>
          <FaSearch />
          Analyze again
        </button>
        <button type="button" className="history-action-btn danger" onClick={handleDelete}>
          <FaTrash />
          Delete
        </button>
      </div>

      <div className="history-click-hint">Click to view full breakdown</div>
    </motion.div>
  );
}

export default HistoryCard;