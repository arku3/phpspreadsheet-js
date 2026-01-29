import { Spreadsheet } from '../core/spreadsheet.ts';
import { Worksheet } from '../core/worksheet.ts';

/**
 * Supervisor style component.
 */
export abstract class Supervisor {
    /**
     * Is supervisor?
     */
    protected isSupervisor: boolean;

    /**
     * Parent.
     */
    protected parent: any = null;

    /**
     * Create a new Supervisor.
     *
     * @param isSupervisor Flag indicating if this is a supervisor or not
     */
    constructor(isSupervisor: boolean = false) {
        this.isSupervisor = isSupervisor;
    }

    /**
     * Bind parent.
     *
     * @param parent Parent object
     * @param parentPropertyName Property name on parent
     */
    public bindParent(parent: any, parentPropertyName?: string): this {
        this.parent = parent;
        return this;
    }

    /**
     * Get is supervisor.
     */
    public getIsSupervisor(): boolean {
        return this.isSupervisor;
    }

    /**
     * Get parent.
     */
    public getParent(): any {
        return this.parent;
    }

    /**
     * Get active sheet.
     */
    public getActiveSheet(): Worksheet {
        if (!this.parent) {
            throw new Error('No parent found.');
        }

        return this.parent.getActiveSheet();
    }

    /**
     * Get selected cells.
     */
    public getSelectedCells(): string {
        if (!this.parent) {
            throw new Error('No parent found.');
        }

        return this.parent.getSelectedCells();
    }

    /**
     * Get shared component.
     */
    public abstract getSharedComponent(): any;

    /**
     * Build style array from subcomponents.
     */
    public abstract getStyleArray(array: any): any;

    /**
     * Apply styles from array.
     */
    public abstract applyFromArray(styleArray: any): any;
}
