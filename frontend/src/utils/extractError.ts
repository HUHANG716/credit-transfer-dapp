export const extractError: (msg: any) => string = (msg: any) => {
  const regex = /___(.*?)___/;
  const result = msg.match(regex);
  return result ? result[1] : msg;
};
