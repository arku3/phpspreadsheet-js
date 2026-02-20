import type { CellCache } from '../caching/cell-cache.ts';
import { Calculation } from '../calculation/calculation.ts';
import { Properties } from '../document/properties.ts';
import { Security } from '../document/security.ts';
import { Style } from '../style/style.ts';
import { Theme } from '../style/theme.ts';
import { DefaultValueBinder } from './default-value-binder.ts';
import { DefinedName } from './defined-name.ts';
import type { IValueBinder } from './i-value-binder.ts';
import { NamedFormula } from './named-formula.ts';
import { NamedRange } from './named-range.ts';
import { Worksheet } from './worksheet.ts';

/**
 * Spreadsheet workbook.
 */
export class Spreadsheet {
    // Visibility constants
    public static readonly VISIBILITY_VISIBLE = 'visible';
    public static readonly VISIBILITY_HIDDEN = 'hidden';
    public static readonly VISIBILITY_VERY_HIDDEN = 'veryHidden';

    #workSheetCollection: Worksheet[] = [];
    #activeSheetIndex: number = 0;
    #cellXfCollection: Style[] = [];
    #cellStyleXfCollection: Style[] = [];
    #cellXfSupervisor: Style | null = null;
    #calculationEngine: Calculation;
    #definedNames: DefinedName[] = [];
    #valueBinder: IValueBinder | null;
    #properties: Properties;
    #security: Security;
    #theme: Theme;
    #defaultCacheStrategy: CellCache | null = null;
    #hasMacros: boolean = false;
    #macrosCode: string | null = null;
    #macrosCertificate: string | null = null;
    #ribbonXMLData: { target: string; data: string } | null = null;
    #ribbonBinObjects: { names: unknown; data: Record<string, unknown> } | null = null;
    #unparsedLoadedData: unknown[] = [];

    // Workbook view properties
    #autoFilterDateGrouping: boolean = true;
    #firstSheetIndex: number = 0;
    #minimized: boolean = false;
    #showHorizontalScroll: boolean = true;
    #showSheetTabs: boolean = true;
    #showVerticalScroll: boolean = true;
    #tabRatio: number = 600;
    #visibility: string = Spreadsheet.VISIBILITY_VISIBLE;

    constructor() {
        this.#calculationEngine = new Calculation();
        this.#valueBinder = new DefaultValueBinder();
        this.#properties = new Properties();
        this.#security = new Security();
        this.#theme = new Theme();

        // Initialise worksheet collection and add one worksheet
        const initialSheet = new Worksheet(this, 'Worksheet 1');
        this.#workSheetCollection.push(initialSheet);
        this.#activeSheetIndex = 0;

        // Create the default style
        this.addCellXf(new Style());
        this.addCellStyleXf(new Style());
    }

    public hasMacros(): boolean {
        return this.#hasMacros;
    }

    public setHasMacros(hasMacros: boolean): void {
        this.#hasMacros = Boolean(hasMacros);
    }

    public setMacrosCode(macroCode: string | null): void {
        this.#macrosCode = macroCode;
        this.setHasMacros(macroCode !== null);
    }

    public getMacrosCode(): string | null {
        return this.#macrosCode;
    }

    public setMacrosCertificate(certificate: string | null): void {
        this.#macrosCertificate = certificate;
    }

    public hasMacrosCertificate(): boolean {
        return this.#macrosCertificate !== null;
    }

    public getMacrosCertificate(): string | null {
        return this.#macrosCertificate;
    }

    public discardMacros(): void {
        this.#hasMacros = false;
        this.#macrosCode = null;
        this.#macrosCertificate = null;
    }

    public setRibbonXMLData(target: string | null, xmlData: string | null): void {
        if (target !== null && xmlData !== null) {
            this.#ribbonXMLData = { target, data: xmlData };
        } else {
            this.#ribbonXMLData = null;
        }
    }

    public getRibbonXMLData(what: 'all' | 'target' | 'data' = 'all'): null | { target: string; data: string } | string {
        const normalized = what.toLowerCase();
        if (normalized === 'all') {
            return this.#ribbonXMLData;
        }
        if ((normalized === 'target' || normalized === 'data') && this.#ribbonXMLData) {
            return this.#ribbonXMLData[normalized];
        }
        return null;
    }

    public setRibbonBinObjects(binObjectsNames: unknown, binObjectsData: Record<string, unknown> | null): void {
        if (binObjectsNames !== null && binObjectsData !== null) {
            this.#ribbonBinObjects = { names: binObjectsNames, data: binObjectsData };
        } else {
            this.#ribbonBinObjects = null;
        }
    }

    public getRibbonBinObjects(what: 'all' | 'names' | 'data' | 'types' = 'all'): unknown {
        const normalized = what.toLowerCase();
        if (normalized === 'all') {
            return this.#ribbonBinObjects;
        }
        if (normalized === 'names' || normalized === 'data') {
            return this.#ribbonBinObjects?.[normalized] ?? null;
        }
        if (normalized === 'types') {
            if (!this.#ribbonBinObjects?.data) {
                return [];
            }
            const keys = Object.keys(this.#ribbonBinObjects.data);
            const types = new Set(keys.map((key) => key.split('.').pop() ?? ''));
            types.delete('');
            return Array.from(types);
        }
        return null;
    }

    public hasRibbon(): boolean {
        return this.#ribbonXMLData !== null;
    }

    public hasRibbonBinObjects(): boolean {
        return this.#ribbonBinObjects !== null;
    }

    public hasInCellDrawings(): boolean {
        for (const sheet of this.#workSheetCollection) {
            if (sheet.getDrawingCollection().length > 0) {
                return true;
            }
        }
        return false;
    }

    public getUnparsedLoadedData(): unknown[] {
        return this.#unparsedLoadedData;
    }

    public setUnparsedLoadedData(unparsedLoadedData: unknown[]): void {
        this.#unparsedLoadedData = unparsedLoadedData;
    }

    /**
     * Get value binder.
     */
    public getValueBinder(): IValueBinder | null {
        return this.#valueBinder;
    }

    /**
     * Set value binder.
     */
    public setValueBinder(binder: IValueBinder | null): this {
        this.#valueBinder = binder;
        return this;
    }

    /**
     * Set the default cell cache strategy for all new worksheets.
     * This cache will be applied to worksheets created after this call.
     * Existing worksheets are not affected.
     *
     * @param cache - CellCache implementation to use by default
     * @returns this
     */
    public setDefaultCacheStrategy(cache: CellCache): this {
        this.#defaultCacheStrategy = cache;
        return this;
    }

    /**
     * Get the default cell cache strategy.
     * @returns Current default CellCache or null if not set
     */
    public getDefaultCacheStrategy(): CellCache | null {
        return this.#defaultCacheStrategy;
    }

    /**
     * Get defined names.
     */
    public getDefinedNames(): DefinedName[] {
        return this.#definedNames;
    }

    /**
     * Add a defined name.
     */
    public addDefinedName(definedName: DefinedName): void {
        const nameKey = definedName.getName().toUpperCase();
        let scopedName = nameKey;
        if (definedName.getLocalOnly()) {
            const scope = definedName.getScope() ?? definedName.getWorksheet();
            if (!scope) {
                throw new Error('Defined name scope is required for local-only names.');
            }
            scopedName = `${scope.getTitle().toUpperCase()}!${nameKey}`;
        }
        this.#definedNames = this.#definedNames.filter((item) => {
            if (definedName.getLocalOnly() !== item.getLocalOnly()) {
                return true;
            }
            if (definedName.getLocalOnly()) {
                const itemScope = item.getScope() ?? item.getWorksheet();
                const definedScope = definedName.getScope() ?? definedName.getWorksheet();
                return !(item.getName().toUpperCase() === nameKey && itemScope === definedScope);
            }
            return item.getName().toUpperCase() !== scopedName;
        });
        this.#definedNames.push(definedName);
    }

    /**
     * Get a defined name by name.
     */
    public getDefinedName(name: string, worksheet: Worksheet | null = null): DefinedName | undefined {
        const nameKey = Spreadsheet.#normalizeDefinedName(name).toUpperCase();
        if (worksheet) {
            const local = this.#definedNames.find((dn) => {
                if (dn.getName().toUpperCase() !== nameKey) return false;
                if (!dn.getLocalOnly()) return false;
                const scope = dn.getScope() ?? dn.getWorksheet();
                return scope === worksheet;
            });
            if (local) return local;
        }

        return this.#definedNames.find((dn) => dn.getName().toUpperCase() === nameKey && !dn.getLocalOnly());
    }

    /**
     * Get named ranges.
     */
    public getNamedRanges(): NamedRange[] {
        return this.#definedNames.filter((dn) => dn instanceof NamedRange) as NamedRange[];
    }

    public getNamedFormulae(): NamedFormula[] {
        return this.#definedNames.filter((dn) => dn instanceof NamedFormula) as NamedFormula[];
    }

    /**
     * Add a named range.
     */
    public addNamedRange(namedRange: NamedRange): void {
        this.addDefinedName(namedRange);
    }

    public addNamedFormula(namedFormula: NamedFormula): void {
        this.addDefinedName(namedFormula);
    }

    /**
     * Get a named range by name.
     */
    public getNamedRange(name: string, worksheet: Worksheet | null = null): NamedRange | undefined {
        const normalized = Spreadsheet.#normalizeDefinedName(name);
        if (normalized === '') {
            return undefined;
        }
        const nameKey = normalized.toUpperCase();
        const global = this.getGlobalDefinedNameByType(nameKey, 'range');
        const local = this.getLocalDefinedNameByType(nameKey, 'range', worksheet);
        const dn = local ?? global;
        return dn instanceof NamedRange ? dn : undefined;
    }

    public getNamedFormula(name: string, worksheet: Worksheet | null = null): NamedFormula | undefined {
        const normalized = Spreadsheet.#normalizeDefinedName(name);
        if (normalized === '') {
            return undefined;
        }
        const nameKey = normalized.toUpperCase();
        const global = this.getGlobalDefinedNameByType(nameKey, 'formula');
        const local = this.getLocalDefinedNameByType(nameKey, 'formula', worksheet);
        const dn = local ?? global;
        return dn instanceof NamedFormula ? dn : undefined;
    }

    public removeNamedRange(name: string, worksheet: Worksheet | null = null): this {
        const dn = this.getNamedRange(name, worksheet);
        if (dn) {
            this.removeDefinedName(dn.getName(), worksheet);
        }
        return this;
    }

    public removeNamedFormula(name: string, worksheet: Worksheet | null = null): this {
        const dn = this.getNamedFormula(name, worksheet);
        if (dn) {
            this.removeDefinedName(dn.getName(), worksheet);
        }
        return this;
    }

    public removeDefinedName(name: string, worksheet: Worksheet | null = null): this {
        const nameKey = Spreadsheet.#normalizeDefinedName(name).toUpperCase();
        if (worksheet) {
            const beforeCount = this.#definedNames.length;
            this.#definedNames = this.#definedNames.filter((dn) => {
                if (!dn.getLocalOnly()) return true;
                if (dn.getScope() !== worksheet) return true;
                return dn.getName().toUpperCase() !== nameKey;
            });
            if (this.#definedNames.length === beforeCount) {
                this.#definedNames = this.#definedNames.filter((dn) => {
                    if (dn.getLocalOnly()) return true;
                    return dn.getName().toUpperCase() !== nameKey;
                });
            }
            return this;
        }
        this.#definedNames = this.#definedNames.filter((dn) => {
            if (dn.getLocalOnly()) return true;
            return dn.getName().toUpperCase() !== nameKey;
        });
        return this;
    }

    static #normalizeDefinedName(name: string): string {
        const trimmed = name.trim();
        if (trimmed.includes('!')) {
            const parts = trimmed.split('!');
            return parts[parts.length - 1] ?? '';
        }
        return trimmed;
    }

    private getGlobalDefinedNameByType(name: string, kind: 'range' | 'formula'): DefinedName | undefined {
        const dn = this.#definedNames.find((item) => !item.getLocalOnly() && item.getName().toUpperCase() === name);
        if (!dn) {
            return undefined;
        }
        const isFormula = dn instanceof NamedFormula;
        return kind === 'formula' ? (isFormula ? dn : undefined) : !isFormula ? dn : undefined;
    }

    private getLocalDefinedNameByType(
        name: string,
        kind: 'range' | 'formula',
        worksheet: Worksheet | null = null,
    ): DefinedName | undefined {
        if (!worksheet) {
            return undefined;
        }
        const dn = this.#definedNames.find((item) => {
            if (!item.getLocalOnly()) return false;
            if (item.getName().toUpperCase() !== name) return false;
            const scope = item.getScope() ?? item.getWorksheet();
            return scope === worksheet;
        });
        if (!dn) {
            return undefined;
        }
        const isFormula = dn instanceof NamedFormula;
        return kind === 'formula' ? (isFormula ? dn : undefined) : !isFormula ? dn : undefined;
    }

    /**
     * Get calculation engine.
     */
    public getCalculationEngine(): Calculation {
        return this.#calculationEngine;
    }

    public getCalculationEngineOrNull(): Calculation | null {
        return this.#calculationEngine ?? null;
    }

    /**
     * Clear calculation cache.
     */
    public clearCalculationCache(): void {
        this.#calculationEngine.clearCache();
        for (const worksheet of this.#workSheetCollection) {
            worksheet.clearCalculationCache();
        }
    }

    /**
     * Get active sheet.
     */
    public getActiveSheet(): Worksheet {
        return this.getSheet(this.#activeSheetIndex);
    }

    /**
     * Get selected cells for the active sheet.
     */
    public getSelectedCells(): string {
        return this.getActiveSheet().getSelectedCells();
    }

    /**
     * Get sheet by name.
     */
    public getSheetByName(name: string): Worksheet | undefined {
        const trimmedName = name
            .trim()
            .replace(/^'+|'+$/g, '')
            .toUpperCase();
        return this.#workSheetCollection.find((sheet) => sheet.getTitle().toUpperCase() === trimmedName);
    }

    /**
     * Add a worksheet.
     */
    public addSheet(worksheet: Worksheet, index?: number, retitleIfNeeded: boolean = false): Worksheet {
        if (retitleIfNeeded) {
            let title = worksheet.getTitle();
            if (this.sheetNameExists(title)) {
                let counter = 1;
                let newTitle = `${title} ${counter}`;
                while (this.sheetNameExists(newTitle)) {
                    counter += 1;
                    newTitle = `${title} ${counter}`;
                }
                worksheet.setTitle(newTitle, true, true);
            }
        }

        if (this.sheetNameExists(worksheet.getTitle())) {
            throw new Error(
                `Workbook already contains a worksheet named '${worksheet.getTitle()}'. Rename the external sheet first.`,
            );
        }

        if (index === undefined) {
            if (this.#activeSheetIndex < 0) {
                this.#activeSheetIndex = 0;
            }
            this.#workSheetCollection.push(worksheet);
        } else {
            this.#workSheetCollection.splice(index, 0, worksheet);
            if (this.#activeSheetIndex >= index) {
                this.#activeSheetIndex++;
            }
            if (this.#activeSheetIndex < 0) {
                this.#activeSheetIndex = 0;
            }
        }

        if (!worksheet.getParent()) {
            worksheet.rebindParent(this);
        }
        return worksheet;
    }

    /**
     * Create a new sheet and add it to the workbook.
     */
    public createSheet(index?: number | null): Worksheet {
        const newSheet = new Worksheet(this);
        // Apply default cache strategy if set
        if (this.#defaultCacheStrategy) {
            newSheet.setCacheStrategy(this.#defaultCacheStrategy);
        }
        this.addSheet(newSheet, index ?? undefined, true);
        return newSheet;
    }

    /**
     * Get cell Xf by index.
     */
    public getCellXfByIndex(index: number): Style {
        if (index < 0 || index >= this.#cellXfCollection.length) {
            throw new Error(`CellXf index ${index} is out of bounds.`);
        }
        return this.#cellXfCollection[index]!;
    }

    /**
     * Get cell Xf by index or null.
     */
    public getCellXfByIndexOrNull(index: number | null): Style | null {
        if (index === null) return null;
        return this.#cellXfCollection[index] ?? null;
    }

    /**
     * Get cell Xf by hash code.
     */
    public getCellXfByHashCode(hashCode: string): Style | false {
        for (const style of this.#cellXfCollection) {
            if (style.getHashCode() === hashCode) {
                return style;
            }
        }
        return false;
    }

    /**
     * Get default style.
     */
    public getDefaultStyle(): Style {
        if (this.#cellXfCollection.length > 0) {
            return this.#cellXfCollection[0]!;
        }
        throw new Error('No default style found for this workbook.');
    }

    /**
     * Get cell Xf supervisor.
     */
    public getCellXfSupervisor(): Style {
        if (!this.#cellXfSupervisor) {
            this.#cellXfSupervisor = new Style(true);
            this.#cellXfSupervisor.bindParent(this);
        }
        return this.#cellXfSupervisor;
    }

    /**
     * Add a cell style (Xf).
     */
    public addCellXf(style: Style): void {
        this.#cellXfCollection.push(style);
        style.setIndex(this.#cellXfCollection.length - 1);
    }

    /**
     * Remove cell Xf by index.
     */
    public removeCellXfByIndex(index: number): void {
        if (index < 0 || index >= this.#cellXfCollection.length) {
            throw new Error(`CellXf index ${index} is out of bounds.`);
        }

        this.#cellXfCollection.splice(index, 1);

        // Update indices for the remaining styles
        for (let i = index; i < this.#cellXfCollection.length; i++) {
            this.#cellXfCollection[i]!.setIndex(i);
        }

        // Update cell Xf indices in all worksheets
        for (const worksheet of this.#workSheetCollection) {
            for (const cell of worksheet.getCellCollection().getCells()) {
                const xfIndex = cell.getXfIndex();
                if (xfIndex > index) {
                    cell.setXfIndex(xfIndex - 1);
                } else if (xfIndex === index) {
                    cell.setXfIndex(0);
                }
            }
        }
    }

    /**
     * Get cell style Xf collection.
     */
    public getCellStyleXfCollection(): Style[] {
        return this.#cellStyleXfCollection;
    }

    /**
     * Get cell Xf collection.
     */
    public getCellXfCollection(): Style[] {
        return this.#cellXfCollection;
    }

    /**
     * Get sheet count.
     */
    public getSheetCount(): number {
        return this.#workSheetCollection.length;
    }

    /**
     * Get all sheets.
     */
    public getAllSheets(): Worksheet[] {
        return this.#workSheetCollection;
    }

    /**
     * Get sheet by index.
     */
    public getSheet(index: number): Worksheet {
        if (!this.#workSheetCollection[index]) {
            const numSheets = this.getSheetCount();
            throw new Error(
                `Your requested sheet index: ${index} is out of bounds. The actual number of sheets is ${numSheets}.`,
            );
        }
        return this.#workSheetCollection[index]!;
    }

    public getSheetByNameOrThrow(name: string): Worksheet {
        const sheet = this.getSheetByName(name);
        if (!sheet) {
            throw new Error(`Workbook does not contain sheet: ${name}`);
        }
        return sheet;
    }

    public getWorksheetIterator(): IterableIterator<Worksheet> {
        return this.#workSheetCollection[Symbol.iterator]();
    }

    public copy(): Spreadsheet {
        const clone = new Spreadsheet();

        const properties = new Properties();
        properties
            .setCreator(this.#properties.getCreator())
            .setLastModifiedBy(this.#properties.getLastModifiedBy())
            .setCreated(this.#properties.getCreated())
            .setModified(this.#properties.getModified())
            .setTitle(this.#properties.getTitle())
            .setDescription(this.#properties.getDescription())
            .setSubject(this.#properties.getSubject())
            .setKeywords(this.#properties.getKeywords())
            .setCategory(this.#properties.getCategory())
            .setManager(this.#properties.getManager())
            .setCompany(this.#properties.getCompany())
            .setHyperlinkBase(this.#properties.getHyperlinkBase())
            .setViewport(this.#properties.getViewport());
        for (const key of this.#properties.getCustomProperties()) {
            properties.setCustomProperty(
                key,
                this.#properties.getCustomPropertyValue(key),
                this.#properties.getCustomPropertyType(key),
            );
        }

        const security = new Security();
        security
            .setLockRevision(this.#security.getLockRevision())
            .setLockStructure(this.#security.getLockStructure())
            .setLockWindows(this.#security.getLockWindows())
            .setWorkbookAlgorithmName(this.#security.getWorkbookAlgorithmName())
            .setWorkbookSpinCount(this.#security.getWorkbookSpinCount())
            .setWorkbookSaltValue(this.#security.getWorkbookSaltValue(), false)
            .setRevisionsAlgorithmName(this.#security.getRevisionsAlgorithmName())
            .setRevisionsSpinCount(this.#security.getRevisionsSpinCount())
            .setRevisionsSaltValue(this.#security.getRevisionsSaltValue(), false);
        const workbookHash = this.#security.getWorkbookHashValue();
        if (workbookHash) {
            security.setWorkbookPassword(workbookHash, true);
        }
        const revisionsHash = this.#security.getRevisionsHashValue();
        if (revisionsHash) {
            security.setRevisionsPassword(revisionsHash, true);
        }

        const theme = new Theme();
        theme
            .setThemeColorName(this.#theme.getThemeColorName(), this.#theme.getThemeColors())
            .setMajorFontValues(
                this.#theme.getMajorFontLatin(),
                this.#theme.getMajorFontEastAsian(),
                this.#theme.getMajorFontComplexScript(),
                this.#theme.getMajorFontSubstitutions(),
            )
            .setMinorFontValues(
                this.#theme.getMinorFontLatin(),
                this.#theme.getMinorFontEastAsian(),
                this.#theme.getMinorFontComplexScript(),
                this.#theme.getMinorFontSubstitutions(),
            )
            .setThemeFontName(this.#theme.getThemeFontName());

        clone.#properties = properties;
        clone.#security = security;
        clone.#theme = theme;
        clone.#autoFilterDateGrouping = this.#autoFilterDateGrouping;
        clone.#firstSheetIndex = this.#firstSheetIndex;
        clone.#minimized = this.#minimized;
        clone.#showHorizontalScroll = this.#showHorizontalScroll;
        clone.#showSheetTabs = this.#showSheetTabs;
        clone.#showVerticalScroll = this.#showVerticalScroll;
        clone.#tabRatio = this.#tabRatio;
        clone.#visibility = this.#visibility;
        clone.#defaultCacheStrategy = this.#defaultCacheStrategy;
        clone.#hasMacros = this.#hasMacros;
        clone.#macrosCode = this.#macrosCode;
        clone.#macrosCertificate = this.#macrosCertificate;
        clone.#ribbonXMLData = this.#ribbonXMLData ? { ...this.#ribbonXMLData } : null;
        clone.#ribbonBinObjects = this.#ribbonBinObjects
            ? { names: this.#ribbonBinObjects.names, data: { ...this.#ribbonBinObjects.data } }
            : null;
        clone.#unparsedLoadedData = [...this.#unparsedLoadedData];

        clone.#workSheetCollection = [];
        for (const worksheet of this.#workSheetCollection) {
            const newSheet = new Worksheet(clone, worksheet.getTitle());
            if (worksheet.hasCodeName()) {
                newSheet.setCodeName(worksheet.getCodeName() ?? worksheet.getTitle());
            }
            newSheet.setSheetState(worksheet.getSheetState());
            if (worksheet.isTabColorSet()) {
                newSheet.getTabColor().setARGB(worksheet.getTabColor().getARGB());
            }
            newSheet.setShowSummaryRight(worksheet.getShowSummaryRight());
            newSheet.setShowSummaryBelow(worksheet.getShowSummaryBelow());
            newSheet.setPrintGridlines(worksheet.getPrintGridlines());
            newSheet.setShowGridlines(worksheet.getShowGridlines());
            newSheet.setShowRowColHeaders(worksheet.getShowRowColHeaders());
            newSheet.setRightToLeft(worksheet.getRightToLeft());
            newSheet.setPageSetup(worksheet.getPageSetup());
            newSheet.setPageMargins(worksheet.getPageMargins());
            newSheet.setHeaderFooter(worksheet.getHeaderFooter());
            newSheet.setSheetView(worksheet.getSheetView());

            for (const cell of worksheet.getCellCollection().getCells()) {
                newSheet.setCellValueExplicit(cell.getCoordinate(), cell.getValue(), cell.getDataType());
                newSheet.getCell(cell.getCoordinate()).setXfIndex(cell.getXfIndex());
            }

            for (const mergeRange of Object.keys(worksheet.getMergeCells())) {
                newSheet.mergeCells(mergeRange);
            }

            for (const [rowIndex, rowDimension] of worksheet.getRowDimensions()) {
                const dimension = newSheet.getRowDimension(rowIndex);
                dimension.setRowHeight(rowDimension.getRowHeight());
                dimension.setZeroHeight(rowDimension.getZeroHeight());
                dimension.setVisible(rowDimension.getVisible());
                dimension.setOutlineLevel(rowDimension.getOutlineLevel());
                dimension.setCollapsed(rowDimension.getCollapsed());
                dimension.setVisibleAfterFilter(rowDimension.getVisibleAfterFilter());
                const xfIndex = rowDimension.getXfIndex();
                if (xfIndex !== null) {
                    dimension.setXfIndex(xfIndex);
                }
            }

            for (const [columnKey, columnDimension] of worksheet.getColumnDimensions()) {
                const dimension = newSheet.getColumnDimension(columnKey);
                dimension.setWidth(columnDimension.getWidth());
                dimension.setAutoSize(columnDimension.getAutoSize());
                dimension.setVisible(columnDimension.getVisible());
                dimension.setOutlineLevel(columnDimension.getOutlineLevel());
                dimension.setCollapsed(columnDimension.getCollapsed());
                const xfIndex = columnDimension.getXfIndex();
                if (xfIndex !== null) {
                    dimension.setXfIndex(xfIndex);
                }
            }

            for (const drawing of worksheet.getDrawingCollection()) {
                newSheet.addDrawing(drawing.clone());
            }

            for (const chart of worksheet.getChartCollection()) {
                newSheet.addChart(chart.clone());
            }

            clone.#workSheetCollection.push(newSheet);
        }

        clone.#activeSheetIndex = this.#activeSheetIndex;

        clone.#cellStyleXfCollection = [];
        for (const style of this.#cellStyleXfCollection) {
            clone.#cellStyleXfCollection.push(style.clone());
        }

        clone.#cellXfCollection = [];
        for (const style of this.#cellXfCollection) {
            clone.#cellXfCollection.push(style.clone());
        }

        clone.#cellXfSupervisor = new Style(true);
        clone.#cellXfSupervisor.bindParent(clone);

        clone.#definedNames = [];
        for (const definedName of this.#definedNames) {
            const worksheet = definedName.getWorksheet();
            const scope = definedName.getScope();
            const newWorksheet = worksheet ? (clone.getSheetByName(worksheet.getTitle()) ?? null) : null;
            const newScope = scope ? (clone.getSheetByName(scope.getTitle()) ?? null) : null;
            let newDefined: DefinedName;
            if (definedName instanceof NamedRange) {
                newDefined = new NamedRange(
                    definedName.getName(),
                    newWorksheet,
                    definedName.getValue(),
                    definedName.getLocalOnly(),
                    newScope,
                );
            } else if (definedName instanceof NamedFormula) {
                newDefined = new NamedFormula(
                    definedName.getName(),
                    newWorksheet,
                    definedName.getValue(),
                    definedName.getLocalOnly(),
                    newScope,
                );
            } else {
                newDefined = new DefinedName(
                    definedName.getName(),
                    newWorksheet,
                    definedName.getValue(),
                    definedName.getLocalOnly(),
                    newScope,
                );
            }
            clone.#definedNames.push(newDefined);
        }

        return clone;
    }

    public setIndexByName(sheetName: string, newIndex: number): number {
        const sheet = this.getSheetByNameOrThrow(sheetName);
        if (newIndex < 0 || newIndex >= this.#workSheetCollection.length) {
            throw new Error('Position is out of bounds.');
        }
        const currentIndex = this.#workSheetCollection.indexOf(sheet);
        if (currentIndex === -1) {
            throw new Error('Sheet does not exist.');
        }
        this.#workSheetCollection.splice(currentIndex, 1);
        this.#workSheetCollection.splice(newIndex, 0, sheet);
        return newIndex;
    }

    public addExternalSheet(worksheet: Worksheet, index?: number): Worksheet {
        if (this.sheetNameExists(worksheet.getTitle())) {
            throw new Error(
                `Workbook already contains a worksheet named '${worksheet.getTitle()}'. Rename this worksheet first.`,
            );
        }

        const externalParent = worksheet.getParent();
        if (!externalParent) {
            throw new Error('Worksheet has no parent spreadsheet.');
        }
        const cellXfCount = this.#cellXfCollection.length;
        if (externalParent !== this) {
            for (const style of externalParent.getCellXfCollection()) {
                this.addCellXf(style.clone());
            }
        }

        worksheet.rebindParent(this);

        if (cellXfCount > 0) {
            for (const cell of worksheet.getCellCollection().getCells()) {
                cell.setXfIndex(cell.getXfIndex() + cellXfCount);
            }
            for (const rowDimension of worksheet.getRowDimensions().values()) {
                const xfIndex = rowDimension.getXfIndex();
                if (xfIndex !== null) {
                    rowDimension.setXfIndex(xfIndex + cellXfCount);
                }
            }
            for (const columnDimension of worksheet.getColumnDimensions().values()) {
                const xfIndex = columnDimension.getXfIndex();
                if (xfIndex !== null) {
                    columnDimension.setXfIndex(xfIndex + cellXfCount);
                }
            }
        }

        return this.addSheet(worksheet, index);
    }

    /**
     * Garbage collect.
     */
    public garbageCollect(): void {
        const countReferencesCellXf = new Map<number, number>();
        for (let i = 0; i < this.#cellXfCollection.length; i++) {
            countReferencesCellXf.set(i, 0);
        }

        for (const sheet of this.#workSheetCollection) {
            // from cells
            for (const cell of sheet.getCellCollection().getCells()) {
                const xfIndex = cell.getXfIndex();
                countReferencesCellXf.set(xfIndex, (countReferencesCellXf.get(xfIndex) || 0) + 1);
            }

            // from row dimensions
            for (const rowDimension of sheet.getRowDimensions().values()) {
                const xfIndex = rowDimension.getXfIndex();
                if (xfIndex !== null) {
                    countReferencesCellXf.set(xfIndex, (countReferencesCellXf.get(xfIndex) || 0) + 1);
                }
            }

            // from column dimensions
            for (const columnDimension of sheet.getColumnDimensions().values()) {
                const xfIndex = columnDimension.getXfIndex();
                if (xfIndex !== null) {
                    countReferencesCellXf.set(xfIndex, (countReferencesCellXf.get(xfIndex) || 0) + 1);
                }
            }
        }

        // remove cellXfs without references and create mapping so we can update xfIndex
        // for all cells and columns
        const newCellXfCollection: Style[] = [];
        const map = new Map<number, number>();

        let countNeededCellXfs = 0;
        for (let i = 0; i < this.#cellXfCollection.length; i++) {
            const style = this.#cellXfCollection[i]!;
            if ((countReferencesCellXf.get(i) || 0) > 0 || i === 0) {
                newCellXfCollection.push(style);
                countNeededCellXfs++;
            }
            map.set(i, countNeededCellXfs - 1);
        }

        this.#cellXfCollection = newCellXfCollection;

        // update the index for all cellXfs
        for (let i = 0; i < this.#cellXfCollection.length; i++) {
            this.#cellXfCollection[i]!.setIndex(i);
        }

        // make sure there is always at least one cellXf
        if (this.#cellXfCollection.length === 0) {
            this.addCellXf(new Style());
        }

        // update the xfIndex for all cells, row dimensions, column dimensions
        for (const sheet of this.#workSheetCollection) {
            // for all cells
            for (const cell of sheet.getCellCollection().getCells()) {
                cell.setXfIndex(map.get(cell.getXfIndex())!);
            }

            // for all row dimensions
            for (const rowDimension of sheet.getRowDimensions().values()) {
                const xfIndex = rowDimension.getXfIndex();
                if (xfIndex !== null) {
                    rowDimension.setXfIndex(map.get(xfIndex)!);
                }
            }

            // for all column dimensions
            for (const columnDimension of sheet.getColumnDimensions().values()) {
                const xfIndex = columnDimension.getXfIndex();
                if (xfIndex !== null) {
                    columnDimension.setXfIndex(map.get(xfIndex)!);
                }
            }

            // also do garbage collection for all the sheets
            sheet.garbageCollect();
        }
    }

    /**
     * Get active sheet index.
     */
    public getActiveSheetIndex(): number {
        return this.#activeSheetIndex;
    }

    /**
     * Get index of worksheet.
     */
    public getIndex(worksheet: Worksheet, noThrow: boolean = false): number {
        const index = this.#workSheetCollection.indexOf(worksheet);
        if (index === -1 && !noThrow) {
            throw new Error('Sheet does not exist.');
        }
        return index;
    }

    /**
     * Get theme.
     */
    public getTheme(): Theme {
        return this.#theme;
    }

    /**
     * Get properties.
     */
    public getProperties(): Properties {
        return this.#properties;
    }

    /**
     * Set properties.
     */
    public setProperties(properties: Properties): void {
        this.#properties = properties;
    }

    /**
     * Get security.
     */
    public getSecurity(): Security {
        return this.#security;
    }

    /**
     * Set security.
     */
    public setSecurity(security: Security): void {
        this.#security = security;
    }

    /**
     * Get cell style Xf by index.
     */
    public getCellStyleXfByIndex(index: number): Style {
        if (index < 0 || index >= this.#cellStyleXfCollection.length) {
            throw new Error(`CellStyleXf index ${index} is out of bounds.`);
        }
        return this.#cellStyleXfCollection[index]!;
    }

    /**
     * Get cell style Xf by hash code.
     */
    public getCellStyleXfByHashCode(hashCode: string): Style | false {
        for (const style of this.#cellStyleXfCollection) {
            if (style.getHashCode() === hashCode) {
                return style;
            }
        }
        return false;
    }

    /**
     * Add a cell style Xf.
     */
    public addCellStyleXf(style: Style): void {
        this.#cellStyleXfCollection.push(style);
        style.setIndex(this.#cellStyleXfCollection.length - 1);
    }

    /**
     * Get auto filter date grouping.
     */
    public getAutoFilterDateGrouping(): boolean {
        return this.#autoFilterDateGrouping;
    }

    /**
     * Set auto filter date grouping.
     */
    public setAutoFilterDateGrouping(value: boolean): void {
        this.#autoFilterDateGrouping = value;
    }

    /**
     * Get first sheet index.
     */
    public getFirstSheetIndex(): number {
        return this.#firstSheetIndex;
    }

    /**
     * Set first sheet index.
     */
    public setFirstSheetIndex(value: number): void {
        if (value < 0) {
            throw new Error('First sheet index must be a positive integer.');
        }
        this.#firstSheetIndex = value;
    }

    /**
     * Get minimized.
     */
    public getMinimized(): boolean {
        return this.#minimized;
    }

    /**
     * Set minimized.
     */
    public setMinimized(value: boolean): void {
        this.#minimized = value;
    }

    /**
     * Get show horizontal scroll.
     */
    public getShowHorizontalScroll(): boolean {
        return this.#showHorizontalScroll;
    }

    /**
     * Set show horizontal scroll.
     */
    public setShowHorizontalScroll(value: boolean): void {
        this.#showHorizontalScroll = value;
    }

    /**
     * Get show sheet tabs.
     */
    public getShowSheetTabs(): boolean {
        return this.#showSheetTabs;
    }

    /**
     * Set show sheet tabs.
     */
    public setShowSheetTabs(value: boolean): void {
        this.#showSheetTabs = value;
    }

    /**
     * Get show vertical scroll.
     */
    public getShowVerticalScroll(): boolean {
        return this.#showVerticalScroll;
    }

    /**
     * Set show vertical scroll.
     */
    public setShowVerticalScroll(value: boolean): void {
        this.#showVerticalScroll = value;
    }

    /**
     * Get tab ratio.
     */
    public getTabRatio(): number {
        return this.#tabRatio;
    }

    /**
     * Set tab ratio.
     */
    public setTabRatio(value: number): void {
        if (value < 0 || value > 1000) {
            throw new Error('Tab ratio must be between 0 and 1000.');
        }
        this.#tabRatio = value;
    }

    /**
     * Get visibility.
     */
    public getVisibility(): string {
        return this.#visibility;
    }

    /**
     * Set visibility.
     */
    public setVisibility(value: string | null): void {
        const visibilityValue = value ?? Spreadsheet.VISIBILITY_VISIBLE;
        if (
            visibilityValue !== Spreadsheet.VISIBILITY_VISIBLE &&
            visibilityValue !== Spreadsheet.VISIBILITY_HIDDEN &&
            visibilityValue !== Spreadsheet.VISIBILITY_VERY_HIDDEN
        ) {
            throw new Error('Invalid visibility value.');
        }
        this.#visibility = visibilityValue;
    }

    /**
     * Check if a sheet name exists.
     *
     * @param sheetName The name to check
     * @returns True if the sheet name exists
     */
    public sheetNameExists(sheetName: string): boolean {
        return this.getSheetByName(sheetName) !== undefined;
    }

    /**
     * Get all sheet names.
     *
     * @returns Array of sheet names
     */
    public getSheetNames(): string[] {
        return this.#workSheetCollection.map((sheet) => sheet.getTitle());
    }

    /**
     * Get sheet by code name.
     *
     * @param codeName The code name (deprecated property, currently uses title)
     * @returns The worksheet or undefined
     */
    public getSheetByCodeName(codeName: string): Worksheet | undefined {
        return this.#workSheetCollection.find((sheet) => sheet.getCodeName() === codeName);
    }

    public sheetCodeNameExists(codeName: string): boolean {
        return this.getSheetByCodeName(codeName) !== undefined;
    }

    /**
     * Remove a sheet by index.
     *
     * @param index The index of the sheet to remove
     * @returns This spreadsheet for chaining
     */
    public removeSheetByIndex(index: number): void {
        const numSheets = this.#workSheetCollection.length;
        if (index < 0 || index > numSheets - 1) {
            throw new Error(
                `You tried to remove a sheet by the out of bounds index: ${index}. The actual number of sheets is ${numSheets}.`,
            );
        }
        this.#workSheetCollection.splice(index, 1);

        if (this.#activeSheetIndex >= index && (this.#activeSheetIndex > 0 || numSheets <= 1)) {
            this.#activeSheetIndex--;
        }
    }

    /**
     * Duplicate a worksheet by title.
     *
     * @param sheetTitle The title of the sheet to duplicate
     * @returns The new worksheet
     */
    public duplicateWorksheetByTitle(sheetTitle: string): Worksheet {
        const sourceSheet = this.getSheetByName(sheetTitle);
        if (!sourceSheet) {
            throw new Error(`Sheet "${sheetTitle}" does not exist.`);
        }

        // Generate new title
        let newTitle = sheetTitle;
        let counter = 1;
        while (this.sheetNameExists(newTitle)) {
            newTitle = `${sheetTitle} (${counter})`;
            counter++;
        }

        // Create new sheet with copied data
        const newSheet = new Worksheet(this, newTitle);

        // Copy cell values (basic implementation)
        for (const cell of sourceSheet.getCellCollection().getCells()) {
            const coord = cell.getCoordinate();
            const value = cell.getValue();
            newSheet.getCell(coord).setValue(value);
        }

        // Copy merge cells
        const mergeCells = sourceSheet.getMergeCells();
        for (const range of Object.keys(mergeCells)) {
            newSheet.mergeCells(range);
        }

        this.addSheet(newSheet);
        return newSheet;
    }

    /**
     * Disconnect all worksheets from this spreadsheet.
     *
     * This method breaks the circular references between cells, worksheets, and the
     * spreadsheet to prevent memory leaks when the spreadsheet is no longer needed.
     *
     * After calling this method, the spreadsheet and its worksheets become unusable.
     *
     * @returns void
     */
    public disconnectWorksheets(): void {
        // Call disconnectCells on each worksheet to break cell references
        for (const worksheet of this.#workSheetCollection) {
            worksheet.disconnectCells();
        }

        // Clear the worksheet collection
        this.#workSheetCollection = [];
        this.#activeSheetIndex = 0;
    }

    /**
     * Set the active sheet index.
     *
     * @param index The index to set as active
     * @returns This spreadsheet for chaining
     */
    public setActiveSheetIndex(index: number): Worksheet {
        const numSheets = this.#workSheetCollection.length;
        if (index > numSheets - 1) {
            throw new Error(
                `You tried to set a sheet active by the out of bounds index: ${index}. The actual number of sheets is ${numSheets}.`,
            );
        }
        this.#activeSheetIndex = index;
        return this.getActiveSheet();
    }

    /**
     * Set the active sheet index by name.
     *
     * @param sheetName The name of the sheet to activate
     * @returns This spreadsheet for chaining
     */
    public setActiveSheetIndexByName(sheetName: string): Worksheet {
        const sheet = this.getSheetByName(sheetName);
        if (!sheet) {
            throw new Error(`Workbook does not contain sheet: ${sheetName}`);
        }

        const index = this.#workSheetCollection.indexOf(sheet);
        this.#activeSheetIndex = index;
        return sheet;
    }
}
