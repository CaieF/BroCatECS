export interface ItemInventoryEntry {
    itemKey: string;
    count: number;
}

export interface ItemInventory {
    items: ItemInventoryEntry[];
}