/**
 * Worksheet header/footer settings and text.
 */
import type { HeaderFooterDrawing } from './drawing/header-footer-drawing.ts';

export class HeaderFooter {
    public static readonly IMAGE_HEADER_LEFT = 'LH';
    public static readonly IMAGE_HEADER_LEFT_ODD = 'LH';
    public static readonly IMAGE_HEADER_LEFT_FIRST = 'LHFIRST';
    public static readonly IMAGE_HEADER_LEFT_EVEN = 'LHEVEN';
    public static readonly IMAGE_HEADER_CENTER = 'CH';
    public static readonly IMAGE_HEADER_CENTER_ODD = 'CH';
    public static readonly IMAGE_HEADER_CENTER_FIRST = 'CHFIRST';
    public static readonly IMAGE_HEADER_CENTER_EVEN = 'CHEVEN';
    public static readonly IMAGE_HEADER_RIGHT = 'RH';
    public static readonly IMAGE_HEADER_RIGHT_ODD = 'RH';
    public static readonly IMAGE_HEADER_RIGHT_FIRST = 'RHFIRST';
    public static readonly IMAGE_HEADER_RIGHT_EVEN = 'RHEVEN';
    public static readonly IMAGE_FOOTER_LEFT = 'LF';
    public static readonly IMAGE_FOOTER_LEFT_ODD = 'LF';
    public static readonly IMAGE_FOOTER_LEFT_FIRST = 'LFFIRST';
    public static readonly IMAGE_FOOTER_LEFT_EVEN = 'LFEVEN';
    public static readonly IMAGE_FOOTER_CENTER = 'CF';
    public static readonly IMAGE_FOOTER_CENTER_ODD = 'CF';
    public static readonly IMAGE_FOOTER_CENTER_FIRST = 'CFFIRST';
    public static readonly IMAGE_FOOTER_CENTER_EVEN = 'CFEVEN';
    public static readonly IMAGE_FOOTER_RIGHT = 'RF';
    public static readonly IMAGE_FOOTER_RIGHT_ODD = 'RF';
    public static readonly IMAGE_FOOTER_RIGHT_FIRST = 'RFFIRST';
    public static readonly IMAGE_FOOTER_RIGHT_EVEN = 'RFEVEN';

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

    #headerFooterImages: Record<string, HeaderFooterDrawing> = {};

    static readonly #imageSortOrder = [
        HeaderFooter.IMAGE_HEADER_LEFT,
        HeaderFooter.IMAGE_HEADER_LEFT_FIRST,
        HeaderFooter.IMAGE_HEADER_LEFT_EVEN,
        HeaderFooter.IMAGE_HEADER_CENTER,
        HeaderFooter.IMAGE_HEADER_CENTER_FIRST,
        HeaderFooter.IMAGE_HEADER_CENTER_EVEN,
        HeaderFooter.IMAGE_HEADER_RIGHT,
        HeaderFooter.IMAGE_HEADER_RIGHT_FIRST,
        HeaderFooter.IMAGE_HEADER_RIGHT_EVEN,
        HeaderFooter.IMAGE_FOOTER_LEFT,
        HeaderFooter.IMAGE_FOOTER_LEFT_FIRST,
        HeaderFooter.IMAGE_FOOTER_LEFT_EVEN,
        HeaderFooter.IMAGE_FOOTER_CENTER,
        HeaderFooter.IMAGE_FOOTER_CENTER_FIRST,
        HeaderFooter.IMAGE_FOOTER_CENTER_EVEN,
        HeaderFooter.IMAGE_FOOTER_RIGHT,
        HeaderFooter.IMAGE_FOOTER_RIGHT_FIRST,
        HeaderFooter.IMAGE_FOOTER_RIGHT_EVEN,
    ];

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

    public addImage(image: HeaderFooterDrawing, location: string = HeaderFooter.IMAGE_HEADER_LEFT): this {
        this.#headerFooterImages[location] = image;
        return this;
    }

    public removeImage(location: string = HeaderFooter.IMAGE_HEADER_LEFT): this {
        if (this.#headerFooterImages[location]) {
            delete this.#headerFooterImages[location];
        }
        return this;
    }

    public setImages(images: Record<string, HeaderFooterDrawing>): this {
        this.#headerFooterImages = images;
        return this;
    }

    public getImages(): Record<string, HeaderFooterDrawing> {
        const images: Record<string, HeaderFooterDrawing> = {};
        for (const key of HeaderFooter.#imageSortOrder) {
            if (this.#headerFooterImages[key]) {
                images[key] = this.#headerFooterImages[key]!;
            }
        }
        this.#headerFooterImages = images;
        return this.#headerFooterImages;
    }

    public clone(): HeaderFooter {
        const cloned = new HeaderFooter();
        cloned
            .setOddHeader(this.#oddHeader)
            .setOddFooter(this.#oddFooter)
            .setEvenHeader(this.#evenHeader)
            .setEvenFooter(this.#evenFooter)
            .setFirstHeader(this.#firstHeader)
            .setFirstFooter(this.#firstFooter)
            .setDifferentOddEven(this.#differentOddEven)
            .setDifferentFirst(this.#differentFirst)
            .setScaleWithDocument(this.#scaleWithDocument)
            .setAlignWithMargins(this.#alignWithMargins);

        const images: Record<string, HeaderFooterDrawing> = {};
        for (const [key, value] of Object.entries(this.#headerFooterImages)) {
            images[key] = value.clone();
        }
        cloned.setImages(images);
        return cloned;
    }
}
