
import React, { useState, useEffect } from 'react';
import { Automation, TriggerType, ActionType } from './types.ts';
import { JobStatus } from '../lib/db.ts';

interface AutomationEditorProps {
    existingAutomation: Automation | null;
    onSave: (automation: Omit<Automation, 'id'> | Automation) => void;
    onCancel: () => void;
}

const EMPTY_AUTOMATION: Omit<Automation, 'id'> = {
    name: '',
    description: '',
    trigger_type: 'new_customer',
    trigger_config: {},
    action_type: 'create_task',
    action_config: {},
    conditions: [],
    is_enabled: true,
};

const JOB_STATUSES: JobStatus[] = ['estimate', 'sold', 'invoiced', 'paid'];

const AutomationEditor: React.FC<AutomationEditorProps> = ({ existingAutomation, onSave, onCancel }) => {
    const [automation, setAutomation] = useState(existingAutomation || EMPTY_AUTOMATION);

    useEffect(() => {
        setAutomation(existingAutomation || EMPTY_AUTOMATION);
    }, [existingAutomation]);
    
    const handleFieldChange = <T extends keyof Automation>(field: T, value: Automation[T]) => {
        setAutomation(prev => ({...prev, [field]: value}));
    };
    
    const handleConfigChange = <T extends 'trigger_config' | 'action_config'>(configType: T, field: keyof Automation[T], value: any) => {
        setAutomation(prev => ({
            ...prev,
            [configType]: { ...prev[configType], [field]: value }
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(automation);
    };

    const labelClass = "text-sm font-medium text-slate-600 dark:text-slate-300";
    const inputClass = "mt-1 w-full rounded-lg border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600/50 px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white";
    const selectClass = `${inputClass} appearance-none`;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
            <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-800 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400">&times;</button>
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold dark:text-white">{existingAutomation ? 'Edit Automation' : 'Create Automation'}</h2>
                    <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <label className="block">
                            <span className={labelClass}>Automation Name</span>
                            <input type="text" value={automation.name} onChange={e => handleFieldChange('name', e.target.value)} className={inputClass} required />
                        </label>

                        <label className="block">
                            <span className={labelClass}>Description (Optional)</span>
                            <input type="text" value={automation.description || ''} onChange={e => handleFieldChange('description', e.target.value)} className={inputClass} placeholder="Brief description of what this automation does" />
                        </label>
                        
                        <div className="p-4 border rounded-lg border-slate-200 dark:border-slate-600">
                            <h3 className="font-semibold text-lg">When...</h3>
                            <label className="block mt-2">
                                <span className={labelClass}>This happens (Trigger)</span>
                                <select value={automation.trigger_type} onChange={e => handleFieldChange('trigger_type', e.target.value as TriggerType)} className={selectClass}>
                                    <option value="new_customer">A new customer is created</option>
                                    <option value="job_created">A new job is created</option>
                                    <option value="job_status_updated">A job's status is updated</option>
                                    <option value="task_completed">A task is completed</option>
                                    <option value="invoice_overdue">An invoice becomes overdue</option>
                                    <option value="scheduled_time">At a scheduled time (daily)</option>
                                    <option value="inventory_low">Inventory falls below threshold</option>
                                </select>
                            </label>
                            {automation.trigger_type === 'job_status_updated' && (
                                <>
                                    <label className="block mt-2">
                                        <span className={labelClass}>From Status (Optional)</span>
                                        <select value={automation.trigger_config.from_status || ''} onChange={e => handleConfigChange('trigger_config', 'from_status', e.target.value)} className={selectClass}>
                                            <option value="">Any Status</option>
                                            {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </label>
                                    <label className="block mt-2">
                                        <span className={labelClass}>To Status</span>
                                        <select value={automation.trigger_config.to_status || ''} onChange={e => handleConfigChange('trigger_config', 'to_status', e.target.value)} className={selectClass} required>
                                            <option value="">-- Select Status --</option>
                                            {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </label>
                                </>
                            )}
                            {automation.trigger_type === 'invoice_overdue' && (
                                <label className="block mt-2">
                                    <span className={labelClass}>Days Overdue</span>
                                    <input type="number" min="1" value={automation.trigger_config.days_overdue || 30} onChange={e => handleConfigChange('trigger_config', 'days_overdue', parseInt(e.target.value))} className={inputClass} />
                                </label>
                            )}
                            {automation.trigger_type === 'scheduled_time' && (
                                <label className="block mt-2">
                                    <span className={labelClass}>Time (24-hour format)</span>
                                    <input type="time" value={automation.trigger_config.time || '09:00'} onChange={e => handleConfigChange('trigger_config', 'time', e.target.value)} className={inputClass} />
                                </label>
                            )}
                            {automation.trigger_type === 'inventory_low' && (
                                <>
                                    <label className="block mt-2">
                                        <span className={labelClass}>Item Name</span>
                                        <input type="text" value={automation.trigger_config.item_name || ''} onChange={e => handleConfigChange('trigger_config', 'item_name', e.target.value)} className={inputClass} placeholder="e.g., Open-Cell Set" required />
                                    </label>
                                    <label className="block mt-2">
                                        <span className={labelClass}>Stock Threshold</span>
                                        <input type="number" min="0" value={automation.trigger_config.stock_threshold || 10} onChange={e => handleConfigChange('trigger_config', 'stock_threshold', parseInt(e.target.value))} className={inputClass} />
                                    </label>
                                </>
                            )}
                            {(automation.trigger_type === 'job_created' || automation.trigger_type === 'job_status_updated') && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Additional Conditions (Optional)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="block">
                                            <span className="text-xs text-slate-600 dark:text-slate-300">Min Job Value</span>
                                            <input type="number" min="0" step="100" value={automation.trigger_config.job_value_min || ''} onChange={e => handleConfigChange('trigger_config', 'job_value_min', e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClass} placeholder="$0" />
                                        </label>
                                        <label className="block">
                                            <span className="text-xs text-slate-600 dark:text-slate-300">Max Job Value</span>
                                            <input type="number" min="0" step="100" value={automation.trigger_config.job_value_max || ''} onChange={e => handleConfigChange('trigger_config', 'job_value_max', e.target.value ? parseFloat(e.target.value) : undefined)} className={inputClass} placeholder="Unlimited" />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border rounded-lg border-slate-200 dark:border-slate-600">
                            <h3 className="font-semibold text-lg">Then...</h3>
                             <label className="block mt-2">
                                <span className={labelClass}>Do this (Action)</span>
                                <select value={automation.action_type} onChange={e => handleFieldChange('action_type', e.target.value as ActionType)} className={selectClass}>
                                    <option value="create_task">Create a new task</option>
                                    <option value="send_email">Send an email</option>
                                    <option value="send_sms">Send an SMS</option>
                                    <option value="update_job_status">Update job status</option>
                                    <option value="assign_team">Assign team to job</option>
                                    <option value="create_invoice">Create an invoice</option>
                                    <option value="update_inventory">Update inventory stock</option>
                                    <option value="add_to_schedule">Add job to schedule</option>
                                    <option value="webhook">Trigger a webhook</option>
                                </select>
                            </label>
                            {automation.action_type === 'webhook' && (
                                <label className="block mt-2">
                                    <span className={labelClass}>Webhook URL</span>
                                    <input type="url" value={automation.action_config.url || ''} onChange={e => handleConfigChange('action_config', 'url', e.target.value)} className={inputClass} placeholder="https://..." required />
                                </label>
                            )}
                            {automation.action_type === 'create_task' && (
                                <div className="mt-2 space-y-2">
                                    <label className="block">
                                        <span className={labelClass}>Task Title</span>
                                        <input type="text" value={automation.action_config.task_title || ''} onChange={e => handleConfigChange('action_config', 'task_title', e.target.value)} className={inputClass} required />
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Task Description (Optional)</span>
                                        <textarea value={automation.action_config.task_description || ''} onChange={e => handleConfigChange('action_config', 'task_description', e.target.value)} rows={2} className={inputClass}></textarea>
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Priority</span>
                                        <select value={automation.action_config.task_priority || 'medium'} onChange={e => handleConfigChange('action_config', 'task_priority', e.target.value)} className={selectClass}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use placeholders: [customer_name], [job_number], [job_value]</p>
                                </div>
                            )}
                            {automation.action_type === 'send_email' && (
                                <div className="mt-2 space-y-2">
                                    <label className="block">
                                        <span className={labelClass}>Send To</span>
                                        <select value={automation.action_config.email_recipient || 'customer'} onChange={e => handleConfigChange('action_config', 'email_recipient', e.target.value)} className={selectClass}>
                                            <option value="customer">Customer</option>
                                            <option value="team">Team Members</option>
                                            <option value="custom">Custom Email</option>
                                        </select>
                                    </label>
                                    {automation.action_config.email_recipient === 'custom' && (
                                        <label className="block">
                                            <span className={labelClass}>Email Address</span>
                                            <input type="email" value={automation.action_config.custom_email || ''} onChange={e => handleConfigChange('action_config', 'custom_email', e.target.value)} className={inputClass} required />
                                        </label>
                                    )}
                                    <label className="block">
                                        <span className={labelClass}>Email Subject</span>
                                        <input type="text" value={automation.action_config.email_subject || ''} onChange={e => handleConfigChange('action_config', 'email_subject', e.target.value)} className={inputClass} required />
                                    </label>
                                    <label className="block">
                                        <span className={labelClass}>Email Body</span>
                                        <textarea value={automation.action_config.email_body || ''} onChange={e => handleConfigChange('action_config', 'email_body', e.target.value)} rows={4} className={inputClass} required></textarea>
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Use placeholders: [customer_name], [job_number], [job_value], [company_name]</p>
                                </div>
                            )}
                            {automation.action_type === 'send_sms' && (
                                <div className="mt-2 space-y-2">
                                    <label className="block">
                                        <span className={labelClass}>Send To</span>
                                        <select value={automation.action_config.sms_recipient || 'customer'} onChange={e => handleConfigChange('action_config', 'sms_recipient', e.target.value)} className={selectClass}>
                                            <option value="customer">Customer</option>
                                            <option value="team">Team Members</option>
                                            <option value="custom">Custom Phone</option>
                                        </select>
                                    </label>
                                    {automation.action_config.sms_recipient === 'custom' && (
                                        <label className="block">
                                            <span className={labelClass}>Phone Number</span>
                                            <input type="tel" value={automation.action_config.custom_phone || ''} onChange={e => handleConfigChange('action_config', 'custom_phone', e.target.value)} className={inputClass} placeholder="+1234567890" required />
                                        </label>
                                    )}
                                    <label className="block">
                                        <span className={labelClass}>SMS Message</span>
                                        <textarea value={automation.action_config.sms_message || ''} onChange={e => handleConfigChange('action_config', 'sms_message', e.target.value)} rows={3} className={inputClass} maxLength={160} required></textarea>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Max 160 characters. Use placeholders: [customer_name], [job_number]</p>
                                    </label>
                                </div>
                            )}
                            {automation.action_type === 'update_job_status' && (
                                <label className="block mt-2">
                                    <span className={labelClass}>New Status</span>
                                    <select value={automation.action_config.new_status || ''} onChange={e => handleConfigChange('action_config', 'new_status', e.target.value)} className={selectClass} required>
                                        <option value="">-- Select Status --</option>
                                        {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                            )}
                            {automation.action_type === 'assign_team' && (
                                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <p className="text-sm text-slate-700 dark:text-slate-200">This action will assign the job to selected team members.</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Team selection happens at runtime based on availability.</p>
                                </div>
                            )}
                            {automation.action_type === 'create_invoice' && (
                                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <p className="text-sm text-slate-700 dark:text-slate-200">This action will automatically create an invoice for the job.</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Invoice will include all job details and pricing.</p>
                                </div>
                            )}
                            {automation.action_type === 'update_inventory' && (
                                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <p className="text-sm text-slate-700 dark:text-slate-200">This action will automatically deduct the required open-cell and closed-cell foam sets for the job from your inventory.</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Requires items named "Open-Cell Set" and "Closed-Cell Set" in your inventory.</p>
                                </div>
                            )}
                            {automation.action_type === 'add_to_schedule' && (
                                <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                                    <p className="text-sm text-slate-700 dark:text-slate-200">This action will add the job to the schedule with today's date.</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You can adjust the dates manually after creation.</p>
                                </div>
                            )}
                            <label className="block mt-3">
                                <span className={labelClass}>Delay Action (Optional)</span>
                                <input type="number" min="0" step="5" value={automation.action_config.delay_minutes || 0} onChange={e => handleConfigChange('action_config', 'delay_minutes', parseInt(e.target.value))} className={inputClass} placeholder="0" />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Wait this many minutes before executing the action (0 = immediate)</p>
                            </label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={automation.is_enabled} onChange={e => handleFieldChange('is_enabled', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            <span className={labelClass}>Enabled</span>
                        </label>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={onCancel}>Cancel</button>
                            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow hover:bg-blue-700">Save Automation</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AutomationEditor;
