import { Border } from './border.ts';
import { createHash } from 'node:crypto';

/**
 * Borders style.
 */
export class Borders {
    // Diagonal directions
    public static readonly DIAGONAL_NONE = 0;
    public static readonly DIAGONAL_UP = 1;
    public static readonly DIAGONAL_DOWN = 2;
    public static readonly DIAGONAL_BOTH = 3;

    /**
     * Left.
     */
    #left: Border;

    /**
     * Right.
     */
    #right: Border;

    /**
     * Top.
     */
    #top: Border;

    /**
     * Bottom.
     */
    #bottom: Border;

    /**
     * Diagonal.
     */
    #diagonal: Border;

    /**
     * DiagonalDirection.
     */
    #diagonalDirection: number = Borders.DIAGONAL_NONE;

    /**
     * Create a new Borders.
     */
    constructor() {
        this.#left = new Border();
        this.#right = new Border();
        this.#top = new Border();
        this.#bottom = new Border();
        this.#diagonal = new Border();
    }

    /**
     * Get Left.
     */
    public getLeft(): Border {
        return this.#left;
    }

    /**
     * Get Right.
     */
    public getRight(): Border {
        return this.#right;
    }

    /**
     * Get Top.
     */
    public getTop(): Border {
        return this.#top;
    }

    /**
     * Get Bottom.
     */
    public getBottom(): Border {
        return this.#bottom;
    }

    /**
     * Get Diagonal.
     */
    public getDiagonal(): Border {
        return this.#diagonal;
    }

    /**
     * Get DiagonalDirection.
     */
    public getDiagonalDirection(): number {
        return this.#diagonalDirection;
    }

    /**
     * Set DiagonalDirection.
     */
    public setDiagonalDirection(direction: number): this {
        this.#diagonalDirection = direction;
        return this;
    }

    /**
     * Apply styles from array.
     *
     * @param styleArray Array containing style information
     */
    public applyFromArray(styleArray: Record<string, unknown>): this {
        if (styleArray.left !== undefined && typeof styleArray.left === 'object') {
            this.getLeft().applyFromArray(styleArray.left as Record<string, unknown>);
        }
        if (styleArray.right !== undefined && typeof styleArray.right === 'object') {
            this.getRight().applyFromArray(styleArray.right as Record<string, unknown>);
        }
        if (styleArray.top !== undefined && typeof styleArray.top === 'object') {
            this.getTop().applyFromArray(styleArray.top as Record<string, unknown>);
        }
        if (styleArray.bottom !== undefined && typeof styleArray.bottom === 'object') {
            this.getBottom().applyFromArray(styleArray.bottom as Record<string, unknown>);
        }
        if (styleArray.diagonal !== undefined && typeof styleArray.diagonal === 'object') {
            this.getDiagonal().applyFromArray(styleArray.diagonal as Record<string, unknown>);
        }
        if (styleArray.diagonalDirection !== undefined) {
            this.setDiagonalDirection(Number(styleArray.diagonalDirection));
        }
        if (styleArray.allBorders !== undefined && typeof styleArray.allBorders === 'object') {
            const allBorders = styleArray.allBorders as Record<string, unknown>;
            this.getLeft().applyFromArray(allBorders);
            this.getRight().applyFromArray(allBorders);
            this.getTop().applyFromArray(allBorders);
            this.getBottom().applyFromArray(allBorders);
        }
        return this;
    }

    /**
     * Get hash code.
     */
    public getHashCode(): string {
        return createHash('md5')
            .update(
                this.#left.getHashCode() +
                this.#right.getHashCode() +
                this.#top.getHashCode() +
                this.#bottom.getHashCode() +
                this.#diagonal.getHashCode() +
                this.#diagonalDirection +
                'Borders'
            )
            .digest('hex');
    }
}
