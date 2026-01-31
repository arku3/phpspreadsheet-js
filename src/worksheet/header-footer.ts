/**
 * Worksheet header/footer settings and text.
 */
export class HeaderFooter {
    #differentOddEven: boolean = false;
    #differentFirst: boolean = false;
    #scaleWithDocument: boolean = true;
    #alignWithMargins: boolean = true;

    #oddHeader: string = '';
    #oddFooter: string = '';
    #evenHeader: string = '';
    #evenFooter: string = '';
    #firstHeader: string = '';
    #firstFooter: string = '';

    public getDifferentOddEven(): boolean {
        return this.#differentOddEven;
    }

    public setDifferentOddEven(value: boolean): this {
        this.#differentOddEven = value;
        return this;
    }

    public getDifferentFirst(): boolean {
        return this.#differentFirst;
    }

    public setDifferentFirst(value: boolean): this {
        this.#differentFirst = value;
        return this;
    }

    public getScaleWithDocument(): boolean {
        return this.#scaleWithDocument;
    }

    public setScaleWithDocument(value: boolean): this {
        this.#scaleWithDocument = value;
        return this;
    }

    public getAlignWithMargins(): boolean {
        return this.#alignWithMargins;
    }

    public setAlignWithMargins(value: boolean): this {
        this.#alignWithMargins = value;
        return this;
    }

    public getOddHeader(): string {
        return this.#oddHeader;
    }

    public setOddHeader(value: string): this {
        this.#oddHeader = value;
        return this;
    }

    public getOddFooter(): string {
        return this.#oddFooter;
    }

    public setOddFooter(value: string): this {
        this.#oddFooter = value;
        return this;
    }

    public getEvenHeader(): string {
        return this.#evenHeader;
    }

    public setEvenHeader(value: string): this {
        this.#evenHeader = value;
        return this;
    }

    public getEvenFooter(): string {
        return this.#evenFooter;
    }

    public setEvenFooter(value: string): this {
        this.#evenFooter = value;
        return this;
    }

    public getFirstHeader(): string {
        return this.#firstHeader;
    }

    public setFirstHeader(value: string): this {
        this.#firstHeader = value;
        return this;
    }

    public getFirstFooter(): string {
        return this.#firstFooter;
    }

    public setFirstFooter(value: string): this {
        this.#firstFooter = value;
        return this;
    }
}
