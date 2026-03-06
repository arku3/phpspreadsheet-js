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
        const image = resource as { width?: number; height?: number } | null;
        if (image?.width && image?.height) {
            this.setImageDimensions(image.width, image.height);
        }
        if (resource instanceof Uint8Array) {
            const info = MemoryDrawing.detectImageInfo(resource);
            if (info) {
                this.setImageDimensions(info.width, info.height, info.type);
            }
        }
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

    public setUniqueName(uniqueName: string): this {
        this.#uniqueName = uniqueName;
        return this;
    }

    public getIndexedFilename(): string {
        return `${this.#uniqueName}${this.getImageIndex()}.${this.getImageFileExtensionForSave(false)}`;
    }

    public getImageFileExtensionForSave(includeDot: boolean = true): string {
        const mimeType = this.getMimeType();
        const extension = mimeType.includes('/') ? (mimeType.split('/')[1] ?? 'png') : 'png';
        return includeDot ? `.${extension}` : extension;
    }

    public override getHashCode(): string {
        const content = `${this.#renderingFunction}${this.#mimeType}${this.#uniqueName}${super.getHashCode()}MemoryDrawing`;
        return Bun.hash(content).toString(16);
    }

    public static fromString(contents: string): MemoryDrawing {
        const drawing = new MemoryDrawing();
        const buffer = Buffer.from(contents, 'binary');
        const info = (
            BaseDrawing as unknown as { detectImageInfo?: (data: Uint8Array) => { type: number } | null }
        ).detectImageInfo?.(buffer);
        if (info?.type === BaseDrawing.IMAGETYPE_JPEG) {
            drawing.setRenderingFunction(MemoryDrawing.RENDERING_JPEG);
            drawing.setMimeType(MemoryDrawing.MIMETYPE_JPEG);
        } else if (info?.type === BaseDrawing.IMAGETYPE_GIF) {
            drawing.setRenderingFunction(MemoryDrawing.RENDERING_GIF);
            drawing.setMimeType(MemoryDrawing.MIMETYPE_GIF);
        } else {
            drawing.setRenderingFunction(MemoryDrawing.RENDERING_PNG);
            drawing.setMimeType(MemoryDrawing.MIMETYPE_PNG);
        }
        drawing.setImageDimensions(
            (info as { width?: number })?.width ?? 0,
            (info as { height?: number })?.height ?? 0,
            (info as { type?: number })?.type ?? BaseDrawing.IMAGETYPE_UNKNOWN,
        );
        drawing.setImageResource(buffer);
        return drawing;
    }

    public static fromStream(stream: Uint8Array): MemoryDrawing {
        return MemoryDrawing.fromString(Buffer.from(stream).toString('binary'));
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
            .setUniqueName(this.#uniqueName)
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
