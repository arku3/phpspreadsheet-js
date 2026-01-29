import { Worksheet } from './worksheet.ts';
import { Style } from '../style/style.ts';
import { Calculation } from '../calculation/calculation.ts';
import { DefinedName } from './defined-name.ts';
import { NamedRange } from './named-range.ts';

/**
 * Spreadsheet workbook.
 */
export class Spreadsheet {
    #workSheetCollection: Worksheet[] = [];
    #activeSheetIndex: number = 0;
    #cellXfCollection: Style[] = [];
    #cellStyleXfCollection: Style[] = [];
    #calculationEngine: Calculation;
    #definedNames: DefinedName[] = [];

    constructor() {
        this.#calculationEngine = new Calculation();
        // Initialise worksheet collection and add one worksheet
        const initialSheet = new Worksheet(this, 'Worksheet 1');
        this.#workSheetCollection.push(initialSheet);
        this.#activeSheetIndex = 0;

        // Create the default style
        this.addCellXf(new Style());
        this.addCellStyleXf(new Style());
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
     * Add a cell style (Xf).
     */
    public addCellXf(style: Style): void {
        this.#cellXfCollection.push(style);
        style.setIndex(this.#cellXfCollection.length - 1);
    }

    /**
     * Add a cell style Xf.
     */
    public addCellStyleXf(style: Style): void {
        this.#cellStyleXfCollection.push(style);
        style.setIndex(this.#cellStyleXfCollection.length - 1);
    }

    /**
     * Get cell Xf collection.
     */
    public getCellXfCollection(): Style[] {
        return this.#cellXfCollection;
    }
}
