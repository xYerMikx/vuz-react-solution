import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Link, TextField, Typography } from "@mui/material";

import type { AppRoute } from "@app/routes";
import { readErrorCode, readErrorMessage } from "@shared/api/error-message";

import { credentialsSchema } from "./credentials-schema";
import { EMAIL_TAKEN } from "./error-code";
import type { Credentials } from "./model";

interface CredentialsFormProps {
  title: string;
  submitLabel: string;
  loading: boolean;
  passwordAutoComplete: "current-password" | "new-password";
  alternateHref: AppRoute;
  alternateLabel: string;
  onSubmit: (credentials: Credentials) => Promise<void>;
}

export function CredentialsForm({
  title,
  submitLabel,
  loading,
  passwordAutoComplete,
  alternateHref,
  alternateLabel,
  onSubmit,
}: CredentialsFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const rootError = errors.root?.message;

  const handleClearRootError = () => {
    clearErrors("root");
  };

  const { ref: emailRef, ...emailField } = register("email", {
    onChange: handleClearRootError,
  });
  const { ref: passwordRef, ...passwordField } = register("password", {
    onChange: handleClearRootError,
  });

  const handleFormSubmit = handleSubmit(async (credentials) => {
    try {
      await onSubmit(credentials);
    } catch (error) {
      const message = readErrorMessage(error);

      if (readErrorCode(error) === EMAIL_TAKEN) {
        setError("email", { message });

        return;
      }

      setError("root", { message });
    }
  });

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleFormSubmit}
      sx={{
        display: "grid",
        gap: 2,
        maxWidth: 360,
        mx: "auto",
        mt: 8,
        p: 2,
      }}
    >
      <Typography component="h1" variant="h5">
        {title}
      </Typography>
      <TextField
        {...emailField}
        inputRef={emailRef}
        label="Email"
        type="email"
        autoComplete="email"
        error={Boolean(errors.email) || Boolean(rootError)}
        helperText={errors.email?.message}
        required
      />
      <TextField
        {...passwordField}
        inputRef={passwordRef}
        label="Password"
        type="password"
        autoComplete={passwordAutoComplete}
        error={Boolean(errors.password) || Boolean(rootError)}
        helperText={errors.password?.message}
        required
      />
      {rootError && <Typography color="error">{rootError}</Typography>}
      <Button type="submit" variant="contained" loading={loading}>
        {submitLabel}
      </Button>
      <Link component={RouterLink} to={alternateHref}>
        {alternateLabel}
      </Link>
    </Box>
  );
}
