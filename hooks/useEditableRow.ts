
import { useState } from 'react';

export const useEditableRow = <T extends { id: string }>() => {
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<T | null>(null);

    const handleEdit = (item: T) => {
        setEditingRowId(item.id);
        setEditedData(JSON.parse(JSON.stringify(item))); // Deep copy to avoid modifying original state until save
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditedData(null);
    };
    
    const handleEditChange = (field: string, value: any) => {
        if (editedData) {
            const keys = field.split('.');
            const newData = { ...editedData };
            let current: any = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            setEditedData(newData);
        }
    };
    
    // The save function itself is defined in the component, which has access to the context setter.
    // This hook just manages the temporary state of editing.
    return {
        editingRowId,
        editedData,
        handleEdit,
        handleCancel,
        handleEditChange,
        setEditedData // Expose setter for more complex updates if needed (e.g., in InventoryLedger)
    };
};
