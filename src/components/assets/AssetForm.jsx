import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, Select, MenuItem,
} from "@mui/material";
import { inputSx, selectSx } from "../../theme/tokens";

export default function AssetForm({ open, form, types, onChange, onSave, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
        {form.assetId ? "Edit Asset" : "Add New Asset"}
      </DialogTitle>

      <DialogContent sx={{ pt: "8px !important" }}>
        <Grid container spacing={1.25}>
          {[["assetName","Asset Name"],["serialNumber","Serial Number"],["brand","Brand"],["model","Model"]].map(([n, l]) => (
            <Grid item xs={6} key={n}>
              <TextField name={n} placeholder={l} value={form[n]} onChange={onChange} size="small" fullWidth sx={inputSx} />
            </Grid>
          ))}

          <Grid item xs={6}>
            <TextField name="purchaseDate"  type="date" value={form.purchaseDate}  onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>
          <Grid item xs={6}>
            <TextField name="warrantyExpiry" type="date" value={form.warrantyExpiry} onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>
          <Grid item xs={6}>
            <TextField name="cost" type="number" placeholder="Cost" value={form.cost} onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>

          <Grid item xs={6}>
            <Select name="status" value={form.status} onChange={onChange} size="small" fullWidth sx={selectSx}>
              {["AVAILABLE","ASSIGNED","DAMAGED"].map((s) => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={6}>
            <Select name="assetCondition" value={form.assetCondition} onChange={onChange} size="small" fullWidth sx={selectSx}>
              {["GOOD","FAIR","POOR"].map((c) => <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>)}
            </Select>
          </Grid>

          <Grid item xs={6}>
            <Select name="typeId" value={form.typeId} onChange={onChange} displayEmpty size="small" fullWidth sx={selectSx}>
              <MenuItem value="" disabled sx={{ fontSize: 13 }}>Select Type</MenuItem>
              {types.map((t) => <MenuItem key={t.typeId} value={String(t.typeId)} sx={{ fontSize: 13 }}>{t.typeName}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={6}>
            <TextField name="locationName" placeholder="Location Name" value={form.locationName} onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="notes" placeholder="Notes" value={form.notes} onChange={onChange} size="small" fullWidth sx={inputSx} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ textTransform: "none", fontSize: 13, borderColor: "#e0e0e0", color: "#555", borderRadius: "8px" }}>Cancel</Button>
        <Button onClick={onSave}  variant="contained" sx={{ textTransform: "none", fontSize: 13, fontWeight: 600, borderRadius: "8px", background: "#1976d2", boxShadow: "none", "&:hover": { background: "#1565c0" } }}>
          {form.assetId ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
