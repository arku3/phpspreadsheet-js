import { Worksheet } from './worksheet.ts';
import { Style } from '../style/style.ts';
import { Calculation } from '../calculation/calculation.ts';
import { DefinedName } from './defined-name.ts';
import { NamedRange } from './named-range.ts';
import type { IValueBinder } from './i-value-binder.ts';
import { DefaultValueBinder } from './default-value-binder.ts';

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

    constructor() {
        this.#calculationEngine = new Calculation();
        this.#valueBinder = new DefaultValueBinder();
        
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
}
