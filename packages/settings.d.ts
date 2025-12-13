// deno-lint-ignore-file no-empty-interface

/**
 * A virtual module declaration for adding Revelry Engine settings to the global interface.
 *
 * @module @revelryengine/settings
 *
 * @mergeTarget
 */

declare module '@revelryengine/settings' {
    /**
     * Revelry Engine settings interface.
     */
    interface RevelryEngineSettings {}

    global {
        /**
         * Global Revelry Engine settings variable.
         */
        var REV: RevelryEngineSettings | undefined;
    }
}
