import validateOptions from 'schema-utils';
import path from "path";
import yaml from "js-yaml";
import fs from "fs";

class DrupalLibrarifyWebpackPlugin {

  constructor(opts = {}) {
    const options = {
      prefix: 'drupal.',
      ...opts
    };

    validateOptions(schema, options, {
      name: 'Drupal Librarify Plugin',
      baseDataPath: 'options'
    });

    this.options = options || {};
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('DrupalLibrarifyWebpackPlugin', afterEmitTapCallback.bind(this))
  }

  afterEmitTapCallback(compilation, callback) {
    this.generateYamlFile(compilation);
    callback();
  }

  generateYamlFile(compilation) {
    const modulePathname = path.resolve(process.cwd());
    const moduleBasename = path.basename(path.resolve(process.cwd()));
    const yamlFilepath = modulePathname + "/" + moduleBasename + ".libraries.yml";

    if (fs.existsSync(yamlFilepath)) {
      let libraries = yaml.safeLoad(fs.readFileSync(yamlFilepath, "utf8"));

      if (typeof libraries[this.options.prefix + moduleBasename] === "undefined") {
        libraries[this.options.prefix + moduleBasename] = {};
      }

      libraries[this.options.prefix + moduleBasename].js = {};
      libraries[this.options.prefix + moduleBasename].css = { theme: {} };

      compilation.chunks.forEach(function(chunk) {
        // Explore each asset filename generated by the chunk.
        chunk.files.forEach(function(filename) {

          const basename = path.basename(filename);
          const extname = path.extname(filename);
          const pathname = path.relative(basename, filename);
          switch (extname) {
            case ".js":
              libraries[this.options.prefix + moduleBasename].js[pathname] = {
                preprocess: false
              };
              break;

            case ".css":
              libraries[this.options.prefix + moduleBasename].css.theme[pathname] = {
                minified: true
              };
              break;

            default:
              // None.
              break;
          }

        });
      });

      fs.writeFileSync(yamlFilepath, yaml.dump(libraries));
    }
  }

}

export default DrupalLibrarifyWebpackPlugin;
