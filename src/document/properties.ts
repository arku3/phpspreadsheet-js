import { createHash } from 'node:crypto';

export class Properties {
    /** constants */
    public static readonly PROPERTY_TYPE_BOOLEAN = 'b';
    public static readonly PROPERTY_TYPE_INTEGER = 'i';
    public static readonly PROPERTY_TYPE_FLOAT = 'f';
    public static readonly PROPERTY_TYPE_DATE = 'd';
    public static readonly PROPERTY_TYPE_STRING = 's';
    public static readonly PROPERTY_TYPE_UNKNOWN = 'u';

    private static readonly VALID_PROPERTY_TYPE_LIST = [
        Properties.PROPERTY_TYPE_BOOLEAN,
        Properties.PROPERTY_TYPE_INTEGER,
        Properties.PROPERTY_TYPE_FLOAT,
        Properties.PROPERTY_TYPE_DATE,
        Properties.PROPERTY_TYPE_STRING,
    ];

    #creator: string = 'Unknown Creator';
    #lastModifiedBy: string;
    #created: number;
    #modified: number;
    #title: string = 'Untitled Spreadsheet';
    #description: string = '';
    #subject: string = '';
    #keywords: string = '';
    #category: string = '';
    #manager: string = '';
    #company: string = '';
    #customProperties: Map<string, { value: boolean | number | string | null; type: string }> = new Map();
    #hyperlinkBase: string = '';
    #viewport: string = '';

    constructor() {
        this.#lastModifiedBy = this.#creator;
        this.#created = Math.floor(Date.now() / 1000);
        this.#modified = this.#created;
    }

    public getCreator(): string {
        return this.#creator;
    }

    public setCreator(creator: string): this {
        this.#creator = creator;
        return this;
    }

    public getLastModifiedBy(): string {
        return this.#lastModifiedBy;
    }

    public setLastModifiedBy(modifiedBy: string): this {
        this.#lastModifiedBy = modifiedBy;
        return this;
    }

    public getCreated(): number {
        return this.#created;
    }

    public setCreated(timestamp: number | string | null): this {
        this.#created = this.#parseTimestamp(timestamp);
        return this;
    }

    public getModified(): number {
        return this.#modified;
    }

    public setModified(timestamp: number | string | null): this {
        this.#modified = this.#parseTimestamp(timestamp);
        return this;
    }

    public getTitle(): string {
        return this.#title;
    }

    public setTitle(title: string): this {
        this.#title = title;
        return this;
    }

    public getDescription(): string {
        return this.#description;
    }

    public setDescription(description: string): this {
        this.#description = description;
        return this;
    }

    public getSubject(): string {
        return this.#subject;
    }

    public setSubject(subject: string): this {
        this.#subject = subject;
        return this;
    }

    public getKeywords(): string {
        return this.#keywords;
    }

    public setKeywords(keywords: string): this {
        this.#keywords = keywords;
        return this;
    }

    public getCategory(): string {
        return this.#category;
    }

    public setCategory(category: string): this {
        this.#category = category;
        return this;
    }

    public getCompany(): string {
        return this.#company;
    }

    public setCompany(company: string): this {
        this.#company = company;
        return this;
    }

    public getManager(): string {
        return this.#manager;
    }

    public setManager(manager: string): this {
        this.#manager = manager;
        return this;
    }

    public getCustomProperties(): string[] {
        return Array.from(this.#customProperties.keys());
    }

    public isCustomPropertySet(propertyName: string): boolean {
        return this.#customProperties.has(propertyName);
    }

    public getCustomPropertyValue(propertyName: string): boolean | number | string | null {
        return this.#customProperties.get(propertyName)?.value ?? null;
    }

    public getCustomPropertyType(propertyName: string): string | null {
        return this.#customProperties.get(propertyName)?.type ?? null;
    }

    public setCustomProperty(propertyName: string, propertyValue: boolean | number | string | null = '', propertyType: string | null = null): this {
        if (propertyType === null || !Properties.VALID_PROPERTY_TYPE_LIST.includes(propertyType)) {
            propertyType = this.#identifyPropertyType(propertyValue);
        }

        this.#customProperties.set(propertyName, {
            value: this.#convertProperty(propertyValue, propertyType),
            type: propertyType,
        });

        return this;
    }

    public getHyperlinkBase(): string {
        return this.#hyperlinkBase;
    }

    public setHyperlinkBase(hyperlinkBase: string): this {
        this.#hyperlinkBase = hyperlinkBase;
        return this;
    }

    public getViewport(): string {
        return this.#viewport;
    }

    public setViewport(viewport: string): this {
        this.#viewport = viewport;
        return this;
    }

    #parseTimestamp(timestamp: number | string | null): number {
        if (timestamp === null) {
            return Math.floor(Date.now() / 1000);
        }
        if (typeof timestamp === 'number') {
            return timestamp;
        }
        const parsed = new Date(timestamp).getTime();
        return isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000);
    }

    #identifyPropertyType(propertyValue: boolean | number | string | null): string {
        if (typeof propertyValue === 'number') {
            return Number.isInteger(propertyValue) ? Properties.PROPERTY_TYPE_INTEGER : Properties.PROPERTY_TYPE_FLOAT;
        }
        if (typeof propertyValue === 'boolean') {
            return Properties.PROPERTY_TYPE_BOOLEAN;
        }
        return Properties.PROPERTY_TYPE_STRING;
    }

    #convertProperty(propertyValue: boolean | number | string | null, propertyType: string): boolean | number | string | null {
        switch (propertyType) {
            case Properties.PROPERTY_TYPE_INTEGER:
                return Math.floor(Number(propertyValue));
            case Properties.PROPERTY_TYPE_FLOAT:
                return Number(propertyValue);
            case Properties.PROPERTY_TYPE_BOOLEAN:
                return typeof propertyValue === 'boolean' ? propertyValue : propertyValue === 'true';
            case Properties.PROPERTY_TYPE_DATE:
                return this.#parseTimestamp(propertyValue as string | number | null);
            default:
                return propertyValue;
        }
    }

    public getHashCode(): string {
        const hash = createHash('md5');
        hash.update(this.#creator);
        hash.update(this.#lastModifiedBy);
        hash.update(String(this.#created));
        hash.update(String(this.#modified));
        hash.update(this.#title);
        hash.update(this.#description);
        hash.update(this.#subject);
        hash.update(this.#keywords);
        hash.update(this.#category);
        hash.update(this.#manager);
        hash.update(this.#company);
        
        const sortedCustom = Array.from(this.#customProperties.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [key, value] of sortedCustom) {
            hash.update(key);
            hash.update(String(value.value));
            hash.update(value.type);
        }

        hash.update(this.#hyperlinkBase);
        hash.update(this.#viewport);
        
        return hash.digest('hex');
    }
}
