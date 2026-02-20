import { BaseDrawing } from './base-drawing.ts';

export class MemoryDrawing extends BaseDrawing {
    public static readonly RENDERING_DEFAULT = 'imagepng';
    public static readonly RENDERING_PNG = 'imagepng';
    public static readonly RENDERING_GIF = 'imagegif';
    public static readonly RENDERING_JPEG = 'imagejpeg';

    public static readonly MIMETYPE_DEFAULT = 'image/png';
    public static readonly MIMETYPE_PNG = 'image/png';
    public static readonly MIMETYPE_GIF = 'image/gif';
    public static readonly MIMETYPE_JPEG = 'image/jpeg';

    public static readonly SUPPORTED_MIME_TYPES = [
        MemoryDrawing.MIMETYPE_GIF,
        MemoryDrawing.MIMETYPE_JPEG,
        MemoryDrawing.MIMETYPE_PNG,
    ];

    #imageResource: unknown = null;
    #renderingFunction: string = MemoryDrawing.RENDERING_DEFAULT;
    #mimeType: string = MemoryDrawing.MIMETYPE_DEFAULT;
    #uniqueName: string = Bun.hash(`${Date.now()}${Math.random()}`).toString(16);

    public getImageResource(): unknown {
        return this.#imageResource;
    }

    public setImageResource(resource: unknown): this {
        this.#imageResource = resource;
        return this;
    }

    public getRenderingFunction(): string {
        return this.#renderingFunction;
    }

    public setRenderingFunction(renderingFunction: string): this {
        this.#renderingFunction = renderingFunction;
        return this;
    }

    public getMimeType(): string {
        return this.#mimeType;
    }

    public setMimeType(mimeType: string): this {
        this.#mimeType = mimeType;
        return this;
    }

    public getUniqueName(): string {
        return this.#uniqueName;
    }

    public override clone(): MemoryDrawing {
        const drawing = new MemoryDrawing();
        drawing
            .setName(this.getName())
            .setDescription(this.getDescription())
            .setCoordinates(this.getCoordinates())
            .setOffsetX(this.getOffsetX())
            .setOffsetY(this.getOffsetY())
            .setWidth(this.getWidth())
            .setHeight(this.getHeight())
            .setRenderingFunction(this.#renderingFunction)
            .setMimeType(this.#mimeType)
            .setImageResource(this.#imageResource);

        if (this.getCoordinates2()) {
            drawing
                .setCoordinates2(this.getCoordinates2())
                .setOffsetX2(this.getOffsetX2())
                .setOffsetY2(this.getOffsetY2());
        }

        return drawing;
    }
}
