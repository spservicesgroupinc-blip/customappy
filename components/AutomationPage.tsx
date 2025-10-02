
import React, { useState } from 'react';
import { Automation } from './types.ts';
import AutomationEditor from './AutomationEditor.tsx';

interface AutomationPageProps {
  automations: Automation[];
  onAddAutomation: (automation: Omit<Automation, 'id'>) => Promise<void>;
  onUpdateAutomation: (automation: Automation) => Promise<void>;
  onDeleteAutomation: (automationId: number) => Promise<void>;
}

const getTriggerDescription = (automation: Automation): string => {
    switch (automation.trigger_type) {
        case 'new_customer':
            return 'When a new customer is created';
        case 'job_created':
            const jobConditions = [];
            if (automation.trigger_config.job_value_min) jobConditions.push(`value ≥ $${automation.trigger_config.job_value_min}`);
            if (automation.trigger_config.job_value_max) jobConditions.push(`value ≤ $${automation.trigger_config.job_value_max}`);
            return `When a new job is created${jobConditions.length ? ` (${jobConditions.join(', ')})` : ''}`;
        case 'job_status_updated':
            const fromStatus = automation.trigger_config.from_status ? ` from '${automation.trigger_config.from_status}'` : '';
            return `When a job status changes${fromStatus} to '${automation.trigger_config.to_status}'`;
        case 'task_completed':
            return 'When a task is marked as completed';
        case 'invoice_overdue':
            return `When an invoice is ${automation.trigger_config.days_overdue || 30} days overdue`;
        case 'scheduled_time':
            return `Daily at ${automation.trigger_config.time || '09:00'}`;
        case 'inventory_low':
            return `When ${automation.trigger_config.item_name || 'item'} stock falls below ${automation.trigger_config.stock_threshold || 10}`;
        default:
            return 'Unknown Trigger';
    }
};

const getActionDescription = (automation: Automation): string => {
    const delay = automation.action_config.delay_minutes ? ` (after ${automation.action_config.delay_minutes}m)` : '';
    switch (automation.action_type) {
        case 'webhook':
            return `Trigger a webhook${delay}`;
        case 'create_task':
            const priority = automation.action_config.task_priority ? ` [${automation.action_config.task_priority} priority]` : '';
            return `Create task: "${automation.action_config.task_title}"${priority}${delay}`;
        case 'add_to_schedule':
            return `Add job to the schedule${delay}`;
        case 'send_email':
            const emailTo = automation.action_config.email_recipient === 'custom' ? automation.action_config.custom_email : automation.action_config.email_recipient || 'customer';
            return `Send email to ${emailTo}: "${automation.action_config.email_subject}"${delay}`;
        case 'send_sms':
            const smsTo = automation.action_config.sms_recipient === 'custom' ? automation.action_config.custom_phone : automation.action_config.sms_recipient || 'customer';
            return `Send SMS to ${smsTo}${delay}`;
        case 'update_job_status':
            return `Update job status to '${automation.action_config.new_status}'${delay}`;
        case 'assign_team':
            return `Assign team to job${delay}`;
        case 'create_invoice':
            return `Create an invoice${delay}`;
        case 'update_inventory':
            return `Deduct foam sets from inventory${delay}`;
        default:
            return 'Unknown Action';
    }
};

const AutomationPage: React.FC<AutomationPageProps> = ({ automations, onAddAutomation, onUpdateAutomation, onDeleteAutomation }) => {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);

    const handleOpenEditor = (automation: Automation | null) => {
        setEditingAutomation(automation);
        setIsEditorOpen(true);
    };

    const handleSave = async (automation: Omit<Automation, 'id'> | Automation) => {
        if ('id' in automation) {
            await onUpdateAutomation(automation);
        } else {
            await onAddAutomation(automation);
        }
        setIsEditorOpen(false);
    };

    const handleToggle = (automation: Automation) => {
        onUpdateAutomation({ ...automation, is_enabled: !automation.is_enabled });
    };
    
    const card = "rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm";

    return (
        <>
            <div className="mx-auto max-w-4xl p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Automations</h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Create powerful workflows to automate your business processes.
                        </p>
                    </div>
                    <button onClick={() => handleOpenEditor(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-semibold shadow hover:bg-blue-700">
                        + Create Automation
                    </button>
                </div>

                {automations.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Active Automations: {automations.filter(a => a.is_enabled).length} of {automations.length}</p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Automations run automatically when their triggers are activated.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className={`${card} p-4`}>
                    <div className="space-y-3">
                        {automations.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">
                                No automations created yet. Get started by creating one!
                            </p>
                        ) : (
                            automations.map(auto => (
                                <div key={auto.id} className={`p-4 rounded-lg border bg-gradient-to-r transition-all ${auto.is_enabled ? 'from-white to-slate-50 dark:from-slate-700 dark:to-slate-700/50 border-slate-200 dark:border-slate-600 shadow-sm' : 'from-slate-100 to-slate-100 dark:from-slate-800 dark:to-slate-800 border-slate-300 dark:border-slate-700'}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <label className="flex items-start cursor-pointer pt-1">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only" checked={auto.is_enabled} onChange={() => handleToggle(auto)} />
                                                <div className={`block w-11 h-6 rounded-full transition ${auto.is_enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-500'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${auto.is_enabled ? 'translate-x-5' : ''}`}></div>
                                            </div>
                                        </label>
                                        <div className="flex-grow mx-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className={`font-semibold text-base text-slate-900 dark:text-slate-100 ${!auto.is_enabled ? 'opacity-50' : ''}`}>{auto.name}</p>
                                                    {auto.description && (
                                                        <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 ${!auto.is_enabled ? 'opacity-50' : ''}`}>{auto.description}</p>
                                                    )}
                                                </div>
                                                {auto.is_enabled && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-start gap-2">
                                                    <svg className={`w-4 h-4 mt-0.5 ${auto.is_enabled ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className={`text-xs text-slate-600 dark:text-slate-300 ${!auto.is_enabled ? 'opacity-50' : ''}`}>
                                                        <span className="font-medium">When:</span> {getTriggerDescription(auto)}
                                                    </p>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <svg className={`w-4 h-4 mt-0.5 ${auto.is_enabled ? 'text-green-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <p className={`text-xs text-slate-600 dark:text-slate-300 ${!auto.is_enabled ? 'opacity-50' : ''}`}>
                                                        <span className="font-medium">Then:</span> {getActionDescription(auto)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenEditor(auto)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600 transition" title="Edit">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => onDeleteAutomation(auto.id!)} className="p-2 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition" title="Delete">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {isEditorOpen && (
                <AutomationEditor
                    existingAutomation={editingAutomation}
                    onSave={handleSave}
                    onCancel={() => setIsEditorOpen(false)}
                />
            )}
        </>
    );
};

export default AutomationPage;
