const gulp = require("gulp");
const series = gulp.series;
const parallel = gulp.parallel;
const mocha = require("gulp-mocha");
const tsConfig = require("./tsconfig.json")

function clean() {
  return require("del")(["dist", "build"]);
}

function test() {
  require("ts-node/register");

  return gulp.src("tests/**/*.spec.ts", { read: false })
    .pipe(mocha({ reporter: "progress" }));
}

function buildES6() {
  const ts = require("gulp-typescript");
  const merge = require("merge2");

  const result = gulp.src(["src/**/*.ts"])
    .pipe(ts(Object.assign({}, tsConfig.compilerOptions, {
      typescript: require("typescript"),
      target: "es6",
      declaration: true,
    })));

  return merge([
    result.dts.pipe(gulp.dest("dist/typings")),
    result.js.pipe(gulp.dest("build/es6")),
  ]);
}

function dist() {
  const rollup = require("rollup");

  return rollup.rollup({
    entry: "build/es6/ndx.js",
  }).then((bundle) => Promise.all([
    bundle.write({
      format: "es",
      dest: "dist/es6/ndx.js",
    }),
    bundle.write({
      format: "umd",
      moduleName: "ndx",
      dest: "dist/umd/ndx.js",
    }),
  ]));
}

exports.clean = clean;
exports.test = test;
exports.dist = exports.default = series(clean, buildES6, dist);
