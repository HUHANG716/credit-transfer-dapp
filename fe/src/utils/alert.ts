import { enqueueSnackbar } from "notistack";

const err = (msg: string) =>
  enqueueSnackbar(msg, {
    variant: "error",
  });
const success = (msg: string) =>
  enqueueSnackbar(msg, {
    variant: "success",
  });
const info = (msg: string) =>
  enqueueSnackbar(msg, {
    variant: "info",
  });

const warn = (msg: string) =>
  enqueueSnackbar(msg, {
    variant: "warning",
  });

export { err, success, info, warn };
