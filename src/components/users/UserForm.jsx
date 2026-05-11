import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Select, MenuItem,
} from "@mui/material";
import { inputSx } from "../../theme/tokens";

export default function UserForm({ open, form, onChange, onSave, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
        {form.userId ? "Edit User" : "Add New User"}
      </DialogTitle>

      <DialogContent sx={{ pt: "8px !important" }}>
        <Grid container spacing={1.25}>
          <Grid item xs={6}>
            <TextField name="userName"     placeholder="Username" value={form.userName}     onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>
          <Grid item xs={6}>
            <TextField name="userEmail"    placeholder="Email"    type="email" value={form.userEmail} onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>
          {!form.userId && (
            <Grid item xs={6}>
              <TextField name="userPassword" placeholder="Password" type="password" value={form.userPassword} onChange={onChange} size="small" fullWidth sx={inputSx} />
            </Grid>
          )}
          {form.userId && (
            <Grid item xs={6}>
              <TextField name="userPassword" placeholder="Leave blank to keep current" type="password" value={form.userPassword} onChange={onChange} size="small" fullWidth sx={inputSx} />
            </Grid>
          )}
          <Grid item xs={6}>
            <Select name="userRole" value={form.userRole} onChange={onChange} size="small" fullWidth
              sx={{ borderRadius: "8px", fontSize: 13, height: 36, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" } }}>
              {["ADMIN","USER"].map((r) => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
            </Select>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}>Cancel</Button>
        <Button onClick={onSave}  variant="contained" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#1976d2", boxShadow: "none", "&:hover": { background: "#1565c0" } }}>
          {form.userId ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
