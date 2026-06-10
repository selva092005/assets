import React from "react";
import { Controller } from "react-hook-form";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
} from "@mui/material";
import { inputSx, selectSx, COLORS } from "../theme/tokens";

// ── Reusable Text Field Wrapper ──────────────────────────────────────────────
export const FormTextField = ({
  name,
  control,
  rules,
  label,
  defaultValue = "",
  labelSx = {},
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const { onChange, ...fieldRest } = field;

        return (
          <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
            {label && (
              <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600, ...labelSx }}>
                {label}
              </Typography>
            )}
            <TextField
              {...props}
              {...fieldRest}
              error={!!error}
              helperText={error?.message || props.helperText}
              onChange={(e) => {
                // If there's a custom onChange from parent, call it with event and RHF onChange
                if (props.onChange) {
                  props.onChange(e, onChange);
                } else {
                  onChange(e);
                }
              }}
              size="small"
              sx={{
                ...inputSx,
                ...props.sx,
              }}
            />
          </FormControl>
        );
      }}
    />
  );
};

// ── Reusable Select Field Wrapper ────────────────────────────────────────────
export const FormSelect = ({
  name,
  control,
  rules,
  label,
  defaultValue = "",
  options = [], // Can be array of strings or { value, label }
  labelSx = {},
  children,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue}
      render={({ field, fieldState: { error } }) => {
        const { onChange, ...fieldRest } = field;

        return (
          <FormControl fullWidth error={!!error} sx={{ mb: 1.5 }}>
            {label && (
              <Typography sx={{ fontSize: 11.5, color: COLORS.textMuted, mb: 0.5, fontWeight: 600, ...labelSx }}>
                {label}
              </Typography>
            )}
            <Select
              {...props}
              {...fieldRest}
              onChange={(e) => {
                if (props.onChange) {
                  props.onChange(e, onChange);
                } else {
                  onChange(e);
                }
              }}
              size="small"
              sx={{
                ...selectSx,
                height: 30, // Override default token height to align with TextField
                ...props.sx,
              }}
            >
              {children
                ? children
                : options.map((opt) => {
                    const val = typeof opt === "object" ? opt.value : opt;
                    const lbl = typeof opt === "object" ? opt.label : opt;
                    return (
                      <MenuItem key={val} value={val} sx={{ fontSize: 12 }}>
                        {lbl}
                      </MenuItem>
                    );
                  })}
            </Select>
            {error && (
              <FormHelperText error sx={{ mx: 0, mt: 0.5, fontSize: 11 }}>
                {error.message}
              </FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
};
