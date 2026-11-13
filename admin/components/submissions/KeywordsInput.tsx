"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";

/** Free-form chip input. Enter or comma commits a keyword; pasted comma lists are split. */
export default function KeywordsInput({
  value,
  onChange,
  label = "Keywords",
  helperText,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  helperText?: React.ReactNode;
  error?: boolean;
}) {
  const [input, setInput] = React.useState("");

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const lower = value.map((v) => v.toLowerCase());
    const next = [...value];
    for (const p of parts) {
      if (!lower.includes(p.toLowerCase())) {
        next.push(p);
        lower.push(p.toLowerCase());
      }
    }
    onChange(next);
    setInput("");
  };

  return (
    <Autocomplete<string, true, false, true>
      multiple
      freeSolo
      options={[]}
      value={value}
      inputValue={input}
      onInputChange={(_e, v, reason) => {
        if (reason === "reset") return;
        if (v.includes(",")) add(v);
        else setInput(v);
      }}
      onChange={(_e, next) => {
        const cleaned: string[] = [];
        for (const k of next.map((x) => x.trim()).filter(Boolean)) {
          if (!cleaned.some((c) => c.toLowerCase() === k.toLowerCase())) cleaned.push(k);
        }
        onChange(cleaned);
        setInput("");
      }}
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => {
          const { key, ...rest } = getTagProps({ index });
          return <Chip key={key} label={tag} size="small" {...rest} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length === 0 ? "Type a keyword and press Enter" : undefined}
          helperText={helperText}
          error={error}
          onBlur={() => add(input)}
        />
      )}
    />
  );
}
