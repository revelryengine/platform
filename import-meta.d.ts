interface ImportMeta {
    /**
     * import.meta.resolve() is a built-in function defined on the import.meta object of a JavaScript module that resolves a module specifier to a URL using the current module's URL as base.
     * @param moduleName
     */
    resolve(moduleName: string): string
}