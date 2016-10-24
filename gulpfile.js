const gulp = require("gulp");
const series = gulp.series;
const parallel = gulp.parallel;
const mocha = require("gulp-mocha");
const tsConfig = require("./tsconfig.json")
const ts = require("gulp-typescript");
const rollup = require("rollup");
const typescript = require("typescript");

function clean() {
  return require("del")(["dist", "build"]);
}

function test() {
  require("ts-node/register");

  return gulp.src("tests/**/*.spec.ts", { read: false })
    .pipe(mocha({ reporter: "progress" }));
}

function buildES5() {
  return gulp.src(["src/**/*.ts"])
    .pipe(ts(Object.assign({}, tsConfig.compilerOptions, {
      typescript: typescript,
      target: "es5",
      module: "es6",
    })))
    .pipe(gulp.dest("build/es5"));
};

function buildES6() {
  const merge = require("merge2");

  const result = gulp.src(["src/**/*.ts"])
    .pipe(ts(Object.assign({}, tsConfig.compilerOptions, {
      typescript: typescript,
      target: "es6",
      declaration: true,
    })));

  return merge([
    result.dts.pipe(gulp.dest("dist/typings")),
    result.js.pipe(gulp.dest("build/es6")),
  ]);
}

function distES5() {
  return rollup.rollup({
    entry: "build/es5/ndx.js",
  }).then((bundle) => bundle.write({
    format: "umd",
    moduleName: "ndx",
    dest: "dist/umd/ndx.js",
  }));
}

function distES6() {
  return rollup.rollup({
    entry: "build/es6/ndx.js",
  }).then((bundle) => bundle.write({
    format: "es",
    dest: "dist/es6/ndx.js",
  }));
}

function minifyUMD() {
  const uglify = require("gulp-uglify");
  const rename = require("gulp-rename");

  return gulp.src(["dist/umd/ndx.js"])
    .pipe(uglify())
    .pipe(rename({
      suffix: ".min",
    }))
    .pipe(gulp.dest("dist/umd"));
}

const dist = series(parallel(buildES5, buildES6), parallel(distES5, distES6), minifyUMD);

exports.clean = clean;
exports.test = test;
exports.dist = exports.default = series(clean, dist);
