import { Worksheet } from './worksheet.ts';
import { Style } from '../style/style.ts';
import { Calculation } from '../calculation/calculation.ts';
import { DefinedName } from './defined-name.ts';
import { NamedRange } from './named-range.ts';
import type { IValueBinder } from './i-value-binder.ts';
import { DefaultValueBinder } from './default-value-binder.ts';
import { Properties } from '../document/properties.ts';
import { Security } from '../document/security.ts';
import { Theme } from '../style/theme.ts';

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
    #valueBinder: IValueBinder;
    #properties: Properties;
    #security: Security;
    #theme: Theme;

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

    /**
     * Get value binder.
     */
    public getValueBinder(): IValueBinder {
        return this.#valueBinder;
    }

    /**
     * Set value binder.
     */
    public setValueBinder(binder: IValueBinder): void {
        this.#valueBinder = binder;
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
        this.#definedNames.push(definedName);
    }

    /**
     * Get a defined name by name.
     */
    public getDefinedName(name: string, worksheet: Worksheet | null = null): DefinedName | undefined {
        return this.#definedNames.find(dn => {
            if (dn.getName() !== name) return false;
            if (dn.getLocalOnly()) {
                return dn.getScope() === worksheet;
            }
            return true;
        });
    }

    /**
     * Get named ranges.
     */
    public getNamedRanges(): NamedRange[] {
        return this.#definedNames.filter(dn => dn instanceof NamedRange) as NamedRange[];
    }

    /**
     * Add a named range.
     */
    public addNamedRange(namedRange: NamedRange): void {
        this.addDefinedName(namedRange);
    }

    /**
     * Get a named range by name.
     */
    public getNamedRange(name: string, worksheet: Worksheet | null = null): NamedRange | undefined {
        const dn = this.getDefinedName(name, worksheet);
        return dn instanceof NamedRange ? dn : undefined;
    }

    /**
     * Get calculation engine.
     */
    public getCalculationEngine(): Calculation {
        return this.#calculationEngine;
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
     * Get sheet by index.
     */
    public getSheet(index: number): Worksheet {
        if (index < 0 || index >= this.#workSheetCollection.length) {
            throw new Error(`Sheet index ${index} is out of bounds.`);
        }
        return this.#workSheetCollection[index]!;
    }

    /**
     * Get sheet by name.
     */
    public getSheetByName(name: string): Worksheet | undefined {
        return this.#workSheetCollection.find(sheet => sheet.getTitle() === name);
    }

    /**
     * Add a worksheet.
     */
    public addSheet(worksheet: Worksheet, index?: number): Worksheet {
        if (index === undefined) {
            this.#workSheetCollection.push(worksheet);
        } else {
            this.#workSheetCollection.splice(index, 0, worksheet);
            if (this.#activeSheetIndex >= index) {
                this.#activeSheetIndex++;
            }
        }
        return worksheet;
    }

    /**
     * Create a new sheet and add it to the workbook.
     */
    public createSheet(title?: string, index?: number): Worksheet {
        const newSheet = new Worksheet(this, title);
        this.addSheet(newSheet, index);
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
    public getIndex(worksheet: Worksheet): number {
        return this.#workSheetCollection.indexOf(worksheet);
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
    public setVisibility(value: string): void {
        this.#visibility = value;
    }

    /**
     * Check if a sheet name exists.
     *
     * @param sheetName The name to check
     * @returns True if the sheet name exists
     */
    public sheetNameExists(sheetName: string): boolean {
        return this.#workSheetCollection.some(sheet => sheet.getTitle() === sheetName);
    }

    /**
     * Get all sheet names.
     *
     * @returns Array of sheet names
     */
    public getSheetNames(): string[] {
        return this.#workSheetCollection.map(sheet => sheet.getTitle());
    }

    /**
     * Get sheet by code name.
     *
     * @param codeName The code name (deprecated property, currently uses title)
     * @returns The worksheet or undefined
     */
    public getSheetByCodeName(codeName: string): Worksheet | undefined {
        // In PHP this uses a separate codeName property, but we'll use title as fallback
        return this.getSheetByName(codeName);
    }

    /**
     * Remove a sheet by index.
     *
     * @param index The index of the sheet to remove
     * @returns This spreadsheet for chaining
     */
    public removeSheetByIndex(index: number): this {
        if (index < 0 || index >= this.#workSheetCollection.length) {
            throw new Error(`Sheet index ${index} is out of bounds.`);
        }

        // Remove the sheet
        this.#workSheetCollection.splice(index, 1);

        // Adjust active sheet index
        if (this.#activeSheetIndex >= index && this.#activeSheetIndex > 0) {
            this.#activeSheetIndex--;
        }

        // Ensure we always have at least one sheet
        if (this.#workSheetCollection.length === 0) {
            const newSheet = new Worksheet(this, 'Worksheet 1');
            this.#workSheetCollection.push(newSheet);
            this.#activeSheetIndex = 0;
        }

        return this;
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
    public setActiveSheetIndex(index: number): this {
        if (index < 0 || index >= this.#workSheetCollection.length) {
            throw new Error(`Sheet index ${index} is out of bounds.`);
        }
        this.#activeSheetIndex = index;
        return this;
    }

    /**
     * Set the active sheet index by name.
     *
     * @param sheetName The name of the sheet to activate
     * @returns This spreadsheet for chaining
     */
    public setActiveSheetIndexByName(sheetName: string): this {
        const sheet = this.getSheetByName(sheetName);
        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" does not exist.`);
        }
        
        const index = this.#workSheetCollection.indexOf(sheet);
        this.#activeSheetIndex = index;
        return this;
    }

}
