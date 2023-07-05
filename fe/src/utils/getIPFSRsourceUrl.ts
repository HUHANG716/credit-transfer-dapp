export const getIPFSResourceUrl = (hash: string) => {
  return `${process.env.REACT_APP_IPFS_GATEWAY}/${hash}`;
};
