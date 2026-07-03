import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Switch, TextField, MenuItem, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Tooltip, IconButton, Card, CardContent
} from "@mui/material";
import {
  FaPlay, FaEdit, FaHistory, FaClock, FaCheckCircle, 
  FaTimesCircle, FaInfoCircle, FaSyncAlt
} from "react-icons/fa";
import toast from "../utils/toast.jsx";
import { 
  getCronJobs, updateCronJob, triggerCronJob, getCronLogs 
} from "../services/cron_service";
import { 
  COLORS, outlinedBtnSx, primaryBtnSx, premiumDialogPaperSx, 
  premiumDialogTitleSx, denseCellSx, chipSx
} from "../theme/tokens";
import PageHeader from "../components/common/PageHeader";
import TableCard from "../components/common/TableCard";
import TablePagination from "../components/common/TablePagination";
import StatCard from "../components/common/StatCard";
import SkeletonLoader from "../components/common/SkeletonLoader";
import ErrorState from "../components/common/ErrorState";

const CRON_PRESETS = [
  { label: "Every 10 Seconds (testing)", value: "0/10 * * * * *" },
  { label: "Every Minute", value: "0 * * * * *" },
  { label: "Hourly (at minute 0)", value: "0 0 * * * *" },
  { label: "Daily at 8:00 AM", value: "0 0 8 * * *" },
  { label: "Daily at 9:00 AM", value: "0 0 9 * * *" },
  { label: "Weekly on Sundays at Midnight", value: "0 0 0 * * SUN" },
  { label: "Monthly on 1st at Midnight", value: "0 0 0 1 * *" },
];

export default function CronManagement() {
  const { userRole } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logSize] = useState(10);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [cronExpression, setCronExpression] = useState("");
  const [presetValue, setPresetValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Message details modal state
  const [msgOpen, setMsgOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState("");

  // Redirect if not ADMIN
  if (userRole !== "admin") {
    return <Navigate to="/home" replace />;
  }

  // ── Queries ──────────────────────────────────────────────────────────
  const { 
    data: jobs = [], 
    isLoading: loadingJobs, 
    isError: isJobsError, 
    error: jobsError, 
    refetch: refetchJobs 
  } = useQuery({
    queryKey: ["cronJobs"],
    queryFn: async () => {
      const res = await getCronJobs();
      return res.data || [];
    },
    refetchInterval: 30000, // Auto refresh every 30s
  });

  const { 
    data: logsData, 
    isLoading: loadingLogs, 
    isError: isLogsError, 
    error: logsError, 
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ["cronLogs", logPage, logSize],
    queryFn: async () => {
      const res = await getCronLogs({ page: logPage, size: logSize });
      return {
        content: res.data?.content || res.content || [],
        totalPages: res.data?.totalPages || res.totalPages || 0,
      };
    },
    enabled: tabValue === 1,
  });

  const logs = logsData?.content || [];
  const totalPages = logsData?.totalPages || 0;

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleToggleActive = async (job, enabled) => {
    try {
      await updateCronJob(job.id, {
        cronExpression: job.cronExpression,
        enabled: enabled
      });
      toast.success(`${job.jobName} has been ${enabled ? "enabled" : "disabled"}`);
      queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update job status");
    }
  };

  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setCronExpression(job.cronExpression);
    // Find preset if matches
    const preset = CRON_PRESETS.find(p => p.value === job.cronExpression);
    setPresetValue(preset ? preset.value : "custom");
    setEditOpen(true);
  };

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setPresetValue(val);
    if (val !== "custom") {
      setCronExpression(val);
    }
  };

  const handleSaveEdit = async () => {
    if (!cronExpression.trim()) {
      toast.error("Cron expression cannot be empty");
      return;
    }
    try {
      setSubmitting(true);
      await updateCronJob(editingJob.id, {
        cronExpression: cronExpression,
        enabled: editingJob.enabled
      });
      toast.success("Schedule updated successfully");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update schedule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerNow = async (job) => {
    try {
      toast.info(`Triggered run for: ${job.jobName}`);
      await triggerCronJob(job.id);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["cronJobs"] });
        queryClient.invalidateQueries({ queryKey: ["cronLogs"] });
      }, 1000);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to trigger job");
    }
  };

  const handleShowMsg = (msg) => {
    setSelectedMsg(msg);
    setMsgOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const activeCount = jobs.filter(j => j.enabled).length;
  const disabledCount = jobs.filter(j => !j.enabled).length;

  return (
    <Box sx={{ p: 0 }}>
      <PageHeader
        title="Cron Management"
        subtitle="Manage background automations, system cleanups, and audit execution logs"
        actions={
          <Button
            variant="outlined"
            startIcon={<FaSyncAlt />}
            onClick={() => {
              refetchJobs();
              if (tabValue === 1) refetchLogs();
              toast.success("Refreshed data");
            }}
            sx={outlinedBtnSx}
          >
            Refresh
          </Button>
        }
      />

      {/* ── Stats Ribbon ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
        gap: 2,
        mb: 3
      }}>
        <StatCard label="Total Scheduler Jobs" value={jobs.length} icon={<FaClock />} iconColor="#2563eb" />
        <StatCard label="Active Schedules" value={activeCount} icon={<FaCheckCircle />} iconColor="#10b981" />
        <StatCard label="Disabled/Paused" value={disabledCount} icon={<FaTimesCircle />} iconColor="#ef4444" />
      </Box>

      {/* ── Tabs Bar ── */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, val) => setTabValue(val)} 
          textColor="primary" 
          indicatorColor="primary"
          sx={{ minHeight: 36, "& .MuiTab-root": { py: 1, minHeight: 36, fontSize: "11px", fontWeight: 600 } }}
        >
          <Tab icon={<FaClock style={{ marginRight: 6 }} />} iconPosition="start" label="Schedules" />
          <Tab icon={<FaHistory style={{ marginRight: 6 }} />} iconPosition="start" label="Execution Logs" />
        </Tabs>
      </Box>

      {/* ── Schedules Tab ── */}
      {tabValue === 0 && (
        <TableCard>
          {loadingJobs ? (
            <SkeletonLoader variant="list" columnCount={6} />
          ) : isJobsError ? (
            <ErrorState message={jobsError?.message} onRetry={refetchJobs} />
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: 0 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: COLORS.bg }}>
                  <TableRow>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Job Details</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Schedule</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Last Run</TableCell>
                    <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Next Run</TableCell>
                    <TableCell align="right" sx={{ ...denseCellSx, fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id} hover>
                      <TableCell sx={denseCellSx}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "11px" }}>
                          {job.jobName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "9.5px", maxWidth: 300 }}>
                          {job.description}
                        </Typography>
                      </TableCell>
                      <TableCell sx={denseCellSx}>
                        <code style={{ background: COLORS.bg, padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }}>
                          {job.cronExpression}
                        </code>
                      </TableCell>
                      <TableCell sx={denseCellSx}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Switch
                            size="small"
                            checked={job.enabled}
                            onChange={(e) => handleToggleActive(job, e.target.checked)}
                          />
                          <span style={{ 
                            fontSize: "10px", 
                            fontWeight: 600, 
                            color: job.enabled ? COLORS.primary : COLORS.textMuted 
                          }}>
                            {job.enabled ? "Active" : "Paused"}
                          </span>
                        </Box>
                      </TableCell>
                      <TableCell sx={denseCellSx}>
                        {formatDate(job.lastRunTime)}
                      </TableCell>
                      <TableCell sx={denseCellSx}>
                        {job.enabled ? formatDate(job.nextRunTime) : <span style={{ color: COLORS.textMuted }}>Paused</span>}
                      </TableCell>
                      <TableCell align="right" sx={denseCellSx}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                          <Tooltip title="Trigger Immediately">
                            <IconButton 
                              size="small" 
                              onClick={() => handleTriggerNow(job)} 
                              sx={{ color: COLORS.primary }}
                            >
                              <FaPlay size={10} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Schedule">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenEdit(job)}
                              sx={{ color: COLORS.textMuted }}
                            >
                              <FaEdit size={10} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No cron jobs registered.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TableCard>
      )}

      {/* ── Execution History Tab ── */}
      {tabValue === 1 && (
        <TableCard>
          {loadingLogs ? (
            <SkeletonLoader variant="list" columnCount={7} />
          ) : isLogsError ? (
            <ErrorState message={logsError?.message} onRetry={refetchLogs} />
          ) : (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: 0 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: COLORS.bg }}>
                    <TableRow>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Job Name</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Triggered By</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Start Time</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>End Time</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Duration</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ ...denseCellSx, fontWeight: 700 }}>Result/Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell sx={denseCellSx}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "11px" }}>
                            {log.jobName}
                          </Typography>
                        </TableCell>
                        <TableCell sx={denseCellSx}>
                          <span style={{ fontSize: "10px", fontWeight: 600 }}>
                            {log.triggeredBy}
                          </span>
                        </TableCell>
                        <TableCell sx={denseCellSx}>
                          {formatDate(log.startTime)}
                        </TableCell>
                        <TableCell sx={denseCellSx}>
                          {formatDate(log.endTime)}
                        </TableCell>
                        <TableCell sx={denseCellSx}>
                          {log.durationMs !== null ? `${log.durationMs}ms` : "—"}
                        </TableCell>
                        <TableCell sx={denseCellSx}>
                          <Box sx={{
                            display: "inline-flex",
                            px: 1,
                            py: 0.25,
                            borderRadius: "12px",
                            fontSize: "9px",
                            fontWeight: 700,
                            backgroundColor: log.status === "SUCCESS" ? "#e8f5e9" : log.status === "RUNNING" ? "#e3f2fd" : "#ffebee",
                            color: log.status === "SUCCESS" ? "#2e7d32" : log.status === "RUNNING" ? "#1565c0" : "#c62828"
                          }}>
                            {log.status}
                          </Box>
                        </TableCell>
                        <TableCell sx={denseCellSx}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, maxWidth: 250 }}>
                            <Typography noWrap variant="caption" sx={{ fontSize: "10px", color: "text.secondary" }}>
                              {log.message || "—"}
                            </Typography>
                            {log.message && log.message.length > 50 && (
                              <IconButton size="small" onClick={() => handleShowMsg(log.message)}>
                                <FaInfoCircle size={10} color={COLORS.primary} />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          No execution logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination 
                page={logPage} 
                totalPages={totalPages} 
                onPageChange={(pg) => setLogPage(pg)} 
              />
            </>
          )}
        </TableCard>
      )}

      {/* ── Edit Schedule Dialog ── */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)}
        PaperProps={{ sx: premiumDialogPaperSx }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Edit Schedule — {editingJob?.jobName}</span>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: "16px !important", minWidth: 320 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, fontSize: "11px" }}>
            Select a common preset schedule or write a custom Spring/Quartz cron expression.
          </Typography>

          <TextField
            select
            fullWidth
            label="Schedule Preset"
            value={presetValue}
            onChange={handlePresetChange}
            size="small"
            sx={{ mb: 2.5, "& .MuiInputLabel-root": { fontSize: 12 }, "& .MuiOutlinedInput-input": { fontSize: 11 } }}
          >
            {CRON_PRESETS.map((p) => (
              <MenuItem key={p.value} value={p.value} sx={{ fontSize: 11 }}>{p.label}</MenuItem>
            ))}
            <MenuItem value="custom" sx={{ fontSize: 11 }}>Custom Expression</MenuItem>
          </TextField>

          {presetValue === "custom" && (
            <TextField
              fullWidth
              label="Cron Expression"
              placeholder="e.g. 0 0 8 * * *"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              size="small"
              sx={{ "& .MuiInputLabel-root": { fontSize: 12 }, "& .MuiOutlinedInput-input": { fontSize: 11 } }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
          <Button variant="outlined" onClick={() => setEditOpen(false)} sx={outlinedBtnSx}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit} 
            disabled={submitting}
            sx={primaryBtnSx}
          >
            {submitting ? <CircularProgress size={12} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Log Message Detail Dialog ── */}
      <Dialog 
        open={msgOpen} 
        onClose={() => setMsgOpen(false)}
        PaperProps={{ sx: { ...premiumDialogPaperSx, maxWidth: 500 } }}
      >
        <DialogTitle sx={premiumDialogTitleSx}>
          <span>Log Details</span>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: "16px !important" }}>
          <Box sx={{ 
            backgroundColor: COLORS.bg, 
            p: 1.5, 
            borderRadius: "6px", 
            border: `1px solid ${COLORS.border}`,
            maxHeight: 300,
            overflowY: "auto"
          }}>
            <pre style={{ 
              margin: 0, 
              fontSize: "10.5px", 
              fontFamily: "monospace", 
              whiteSpace: "pre-wrap",
              wordBreak: "break-all"
            }}>
              {selectedMsg}
            </pre>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setMsgOpen(false)} sx={primaryBtnSx}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
