export class Pane {
    #sqref: string;
    #activeCell: string;
    #position: string;

    constructor(position: string, sqref: string = '', activeCell: string = '') {
        this.#position = position;
        this.#sqref = sqref;
        this.#activeCell = activeCell;
    }

    public getPosition(): string {
        return this.#position;
    }

    public getSqref(): string {
        return this.#sqref;
    }

    public setSqref(sqref: string): this {
        this.#sqref = sqref;
        return this;
    }

    public getActiveCell(): string {
        return this.#activeCell;
    }

    public setActiveCell(activeCell: string): this {
        this.#activeCell = activeCell;
        return this;
    }
}
