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
