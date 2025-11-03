import React, { useState } from 'react';
import type { ActivityLogEntry } from '../types';
import { useDataContext } from '../contexts/DataContext';

interface ActivityLogProps {}

const ACTIVITY_TYPES = ['Horeca Visit', 'New Wholesale Lead', 'Website Visitor Block'];

const ActivityLog: React.FC<ActivityLogProps> = () => {
    const { activityLogData: logData, setActivityLogData: setLogData } = useDataContext();
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<ActivityLogEntry | null>(null);

    const handleEdit = (item: ActivityLogEntry) => {
        setEditingRowId(item.id);
        setEditedData({ ...item });
    };

    const handleCancel = () => {
        setEditingRowId(null);
        setEditedData(null);
    };

    const handleSave = () => {
        if (!editedData) return;
        setLogData(prev => prev.map(item => item.id === editedData.id ? editedData : item));
        handleCancel();
    };

    const handleEditChange = (field: keyof ActivityLogEntry, value: any) => {
        if (editedData) {
            setEditedData({ ...editedData, [field]: value });
        }
    };

    const handleAddRow = () => {
        const newId = (Math.random() + 1).toString(36).substring(7);
        const newItem: ActivityLogEntry = {
            id: newId,
            date: new Date().toISOString().split('T')[0],
            type: 'Horeca Visit',
            value: 1,
            notes: ''
        };
        setLogData(prev => [...prev, newItem]);
    };

    const handleDeleteRow = (id: string) => {
        if (window.confirm('Are you sure you want to delete this activity log? This cannot be undone.')) {
            setLogData(prev => prev.filter(item => item.id !== id));
        }
    };

    return (
        <div className="overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 text-brand-text-primary">Activity Log (Non-Financial)</h3>
            <table className="w-full min-w-[700px] text-sm text-left text-brand-text-secondary">
                <thead className="text-xs text-brand-text-primary uppercase bg-gray-700/50">
                    <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Activity Type</th>
                        <th className="p-2">Value</th>
                        <th className="p-2">Notes</th>
                        <th className="p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {logData.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center p-4 text-brand-text-secondary">
                                No activities logged yet. Click "Add Activity" to get started.
                            </td>
                        </tr>
                    ) : (
                        logData.map(item => {
                            const isEditing = item.id === editingRowId;
                            return isEditing && editedData ? (
                                <tr key={item.id} className="bg-gray-700/50">
                                    <td className="p-1 w-40"><input type="date" value={editedData.date} onChange={e => handleEditChange('date', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1 w-48">
                                        <select value={editedData.type} onChange={e => handleEditChange('type', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary">
                                            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-1 w-24"><input type="number" value={editedData.value} onChange={e => handleEditChange('value', parseInt(e.target.value) || 0)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary text-right"/></td>
                                    <td className="p-1"><input type="text" value={editedData.notes} onChange={e => handleEditChange('notes', e.target.value)} className="bg-brand-surface p-2 rounded-md w-full text-xs outline-none focus:ring-1 focus:ring-brand-primary"/></td>
                                    <td className="p-1 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-lg"><i className="fas fa-check-circle"></i></button>
                                            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-300 text-lg"><i className="fas fa-times-circle"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={item.id} className="border-b border-brand-border hover:bg-gray-700/30">
                                    <td className="p-2">{item.date}</td>
                                    <td className="p-2">{item.type}</td>
                                    <td className="p-2 text-right">{item.value}</td>
                                    <td className="p-2">{item.notes}</td>
                                    <td className="p-1 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button onClick={() => handleEdit(item)} className="text-brand-accent/70 hover:text-brand-accent text-base"><i className="fas fa-pencil-alt"></i></button>
                                            <button onClick={() => handleDeleteRow(item.id)} className="text-red-500/60 hover:text-red-500 text-base"><i className="fas fa-trash-alt"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
             <div className="mt-4">
                <button onClick={handleAddRow} className="bg-brand-primary/20 text-brand-primary hover:bg-brand-primary/40 font-bold py-2 px-4 rounded-lg text-sm">
                    + Add Activity
                </button>
            </div>
        </div>
    );
};

export default ActivityLog;