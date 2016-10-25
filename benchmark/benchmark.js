const fs = require("fs");
const ndx = require("../dist/umd/ndx");

function measure(name, fn) {
  const t1 = process.hrtime();
  fn();
  const t2 = process.hrtime(t1);
  console.log(name, Math.round((t2[0] * 1000) + (t2[1] / 1000000)));
};

const data = JSON.parse(fs.readFileSync("./reddit_comments.json").toString());

console.log("Documents:", data.length);

const index = new ndx.DocumentIndex();
index.addField("author");
index.addField("body");

if (global.gc !== undefined) {
  gc();
}
console.log("Initial Memory:", process.memoryUsage());

measure("Index Time:", function () {
  for (let i = 0; i < data.length; i++) {
    index.add(i, data[i]);
  }
});

if (global.gc) {
  gc();
}
console.log("Index Memory:", process.memoryUsage());

let result;
measure("Search Time:", function () {
  result = index.search("a b c");
});

if (global.gc) {
  gc();
}
console.log("Finish Memory", process.memoryUsage());
console.log("Results", result.length);
