import { Spreadsheet } from './spreadsheet.ts';
import { CellCollection } from './cell-collection.ts';
import { Cell, DataType } from './cell.ts';
import { Coordinate } from '../utils/coordinate.ts';

/**
 * Worksheet in a Spreadsheet.
 */
export class Worksheet {
    #parent: Spreadsheet;
    #title: string;
    #cellCollection: CellCollection;

    constructor(parent: Spreadsheet, title: string = 'Worksheet') {
        this.#parent = parent;
        this.#title = title;
        this.#cellCollection = new CellCollection();
    }

    /**
     * Get parent spreadsheet.
     */
    public getParent(): Spreadsheet {
        return this.#parent;
    }

    /**
     * Get title.
     */
    public getTitle(): string {
        return this.#title;
    }

    /**
     * Set title.
     */
    public setTitle(title: string): void {
        this.#title = title;
    }

    /**
     * Get cell by coordinate.
     */
    public getCell(coordinate: string): Cell {
        let cell = this.#cellCollection.get(coordinate);
        if (!cell) {
            const [col, row] = Coordinate.coordinateFromString(coordinate);
            cell = new Cell(null, DataType.TYPE_NULL, this, col, row);
            this.#cellCollection.add(coordinate, cell);
        }
        return cell;
    }

    /**
     * Set cell value.
     */
    public setCellValue(coordinate: string, value: any): Worksheet {
        const cell = this.getCell(coordinate);
        cell.setValue(value);
        // Basic type detection could be added here
        if (typeof value === 'number') {
            cell.setDataType(DataType.TYPE_NUMERIC);
        } else if (typeof value === 'string') {
            if (value.startsWith('=')) {
                cell.setDataType(DataType.TYPE_FORMULA);
            } else {
                cell.setDataType(DataType.TYPE_STRING);
            }
        } else if (value === null) {
            cell.setDataType(DataType.TYPE_NULL);
        } else if (typeof value === 'boolean') {
            cell.setDataType(DataType.TYPE_BOOL);
        }
        return this;
    }

    /**
     * Get cell collection.
     */
    public getCellCollection(): CellCollection {
        return this.#cellCollection;
    }
}
