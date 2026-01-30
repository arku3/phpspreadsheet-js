import { Pane } from './pane.ts';

export class SheetView {
    public static readonly SHEETVIEW_NORMAL = 'normal';
    public static readonly SHEETVIEW_PAGE_LAYOUT = 'pageLayout';
    public static readonly SHEETVIEW_PAGE_BREAK_PREVIEW = 'pageBreakPreview';

    private static readonly SHEET_VIEW_TYPES = [
        SheetView.SHEETVIEW_NORMAL,
        SheetView.SHEETVIEW_PAGE_LAYOUT,
        SheetView.SHEETVIEW_PAGE_BREAK_PREVIEW,
    ] as const;

    #zoomScale: number | null = 100;
    #zoomScaleNormal: number | null = 100;
    #zoomScalePageLayoutView: number = 100;
    #zoomScaleSheetLayoutView: number = 100;
    #showZeros: boolean = true;
    #sheetviewType: (typeof SheetView.SHEET_VIEW_TYPES)[number] = SheetView.SHEETVIEW_NORMAL;

    public getZoomScale(): number | null {
        return this.#zoomScale;
    }

    public setZoomScale(zoomScale: number | null): this {
        if (zoomScale === null || zoomScale >= 1) {
            this.#zoomScale = zoomScale;
        } else {
            throw new Error('Scale must be greater than or equal to 1.');
        }
        return this;
    }

    public getZoomScaleNormal(): number | null {
        return this.#zoomScaleNormal;
    }

    public setZoomScaleNormal(zoomScaleNormal: number | null): this {
        if (zoomScaleNormal === null || zoomScaleNormal >= 1) {
            this.#zoomScaleNormal = zoomScaleNormal;
        } else {
            throw new Error('Scale must be greater than or equal to 1.');
        }
        return this;
    }

    public getZoomScalePageLayoutView(): number {
        return this.#zoomScalePageLayoutView;
    }

    public setZoomScalePageLayoutView(zoomScalePageLayoutView: number): this {
        if (zoomScalePageLayoutView >= 1) {
            this.#zoomScalePageLayoutView = zoomScalePageLayoutView;
        } else {
            throw new Error('Scale must be greater than or equal to 1.');
        }
        return this;
    }

    public getZoomScaleSheetLayoutView(): number {
        return this.#zoomScaleSheetLayoutView;
    }

    public setZoomScaleSheetLayoutView(zoomScaleSheetLayoutView: number): this {
        if (zoomScaleSheetLayoutView >= 1) {
            this.#zoomScaleSheetLayoutView = zoomScaleSheetLayoutView;
        } else {
            throw new Error('Scale must be greater than or equal to 1.');
        }
        return this;
    }

    public setShowZeros(showZeros: boolean): void {
        this.#showZeros = showZeros;
    }

    public getShowZeros(): boolean {
        return this.#showZeros;
    }

    public getView(): string {
        return this.#sheetviewType;
    }

    public setView(sheetViewType: string | null): this {
        if (sheetViewType === null) {
            sheetViewType = SheetView.SHEETVIEW_NORMAL;
        }
        if ((SheetView.SHEET_VIEW_TYPES as readonly string[]).includes(sheetViewType)) {
            this.#sheetviewType = sheetViewType as any;
        } else {
            throw new Error('Invalid sheetview layout type.');
        }
        return this;
    }
}
