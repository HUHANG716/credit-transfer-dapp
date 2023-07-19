const fs = require("fs");

const buildDir = "../be/src/contracts";
const secondDir = "../fe/src/contracts";

// Create the target directory if it does not exist
fs.mkdirSync(secondDir, { recursive: true });
fs.readdir(buildDir, (err, files) => {
  if (err) throw err;

  for (const file of files) {
    fs.copyFile(`${buildDir}/${file}`, `${secondDir}/${file}`, (err) => {
      if (err) throw err;
      console.log(`${file} was copied to ${secondDir}`);
    });
  }
});
