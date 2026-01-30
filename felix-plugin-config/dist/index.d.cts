import { BuildContext, ModelSpec } from '@sdeverywhere/build';

interface ConfigProcessorOutputPaths {
    /** The absolute path to the directory where model spec files will be written. */
    modelSpecsDir?: string;
    /** The absolute path to the directory where config spec files will be written. */
    configSpecsDir?: string;
    /** The absolute path to the directory where translated strings will be written. */
    stringsDir?: string;
}
interface ConfigProcessorOptions {
    /**
     * The absolute path to the directory containing the CSV config files.
     */
    config: string;
    /**
     * Either a single path to a base output directory (in which case, the recommended
     * directory structure will be used) or a `ConfigProcessorOutputPaths` containing specific paths.
     * If a single string is provided, the following subdirectories will be used:
     * ```
     *   <out-dir>/
     *     src/
     *       config/
     *         generated/
     *       model/
     *         generated/
     *     strings/
     * ```
     */
    out?: string | ConfigProcessorOutputPaths;
    /**
     * Additional options included with the SDE `spec.json` file.
     * @hidden This is not part of the public API because we are aiming to merge
     * the `spec.json` file format with the `sde.config.js` format.  This is exposed
     * temporarily to allow for configuring additional settings like `directData`
     * for which we don't currently have a way to configure via config files.
     */
    spec?: {
        [key: string]: any;
    };
}
/**
 * Returns a function that can be passed as the `modelSpec` function for the SDEverywhere
 * `UserConfig`.  The returned function:
 *   - reads CSV files from a `config` directory
 *   - writes JS files to the configured output directories
 *   - returns a `ModelSpec` that guides the rest of the `sde` build process
 */
declare function configProcessor(options: ConfigProcessorOptions): (buildContext: BuildContext) => Promise<ModelSpec>;

export { type ConfigProcessorOptions, type ConfigProcessorOutputPaths, configProcessor };
