
import { Automation, Task, Job } from '../components/types.ts';
import { EstimateRecord } from './db.ts';
import { CustomerInfo } from '../components/PDF.tsx';
import { fmtInput } from '../components/utils.ts';

// Type for the action handler functions passed from App.tsx
interface ActionHandlers {
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>) => Promise<Task>;
    addToSchedule: (job: Omit<Job, 'id'>) => Job;
    sendEmail: (to: string, subject: string, body: string) => Promise<void>;
    deductInventoryForJob: (job: EstimateRecord) => Promise<void>;
}

// Function to replace placeholders like [customer_name] in strings
const replacePlaceholders = (text: string, data: any): string => {
    if (!text) return '';
    let result = text;
    result = result.replace(/\[customer_name\]/g, data.calcData?.customer?.name || data.name || '');
    result = result.replace(/\[customer_address\]/g, data.calcData?.customer?.address || data.address || '');
    result = result.replace(/\[job_number\]/g, data.estimateNumber || '');
    result = result.replace(/\[job_value\]/g, data.costsData?.finalQuote?.toFixed(2) || '');
    return result;
};


export const processAutomations = (
    triggerType: 'new_customer' | 'job_status_updated' | 'job_created' | 'task_completed' | 'invoice_overdue' | 'scheduled_time' | 'inventory_low',
    data: CustomerInfo | EstimateRecord | any,
    allAutomations: Automation[],
    handlers: ActionHandlers
) => {
    const automationsToRun = allAutomations.filter(a => a.is_enabled && a.trigger_type === triggerType);

    for (const automation of automationsToRun) {
        let shouldRun = false;

        // Check conditions
        if (triggerType === 'new_customer') {
            shouldRun = true;
        } else if (triggerType === 'job_created') {
            const job = data as EstimateRecord;
            shouldRun = true;
            // Check job value conditions
            if (automation.trigger_config.job_value_min) {
                const jobValue = job.costsData?.finalQuote || 0;
                if (jobValue < automation.trigger_config.job_value_min) shouldRun = false;
            }
            if (automation.trigger_config.job_value_max) {
                const jobValue = job.costsData?.finalQuote || 0;
                if (jobValue > automation.trigger_config.job_value_max) shouldRun = false;
            }
        } else if (triggerType === 'job_status_updated') {
            const job = data as EstimateRecord;
            if (job.status === automation.trigger_config.to_status) {
                // Check if from_status condition is met
                if (automation.trigger_config.from_status) {
                    // This would require tracking previous status - for now, just run
                    shouldRun = true;
                } else {
                    shouldRun = true;
                }
            }
            // Check job value conditions for status updates too
            if (shouldRun && automation.trigger_config.job_value_min) {
                const jobValue = job.costsData?.finalQuote || 0;
                if (jobValue < automation.trigger_config.job_value_min) shouldRun = false;
            }
            if (shouldRun && automation.trigger_config.job_value_max) {
                const jobValue = job.costsData?.finalQuote || 0;
                if (jobValue > automation.trigger_config.job_value_max) shouldRun = false;
            }
        } else if (triggerType === 'task_completed') {
            shouldRun = true;
        } else if (triggerType === 'invoice_overdue') {
            shouldRun = true;
        } else if (triggerType === 'scheduled_time') {
            shouldRun = true;
        } else if (triggerType === 'inventory_low') {
            shouldRun = true;
        }

        if (shouldRun) {
            console.log(`Running automation: ${automation.name}`);
            // Apply delay if configured
            if (automation.action_config.delay_minutes && automation.action_config.delay_minutes > 0) {
                setTimeout(() => {
                    executeAction(automation, data, handlers);
                }, automation.action_config.delay_minutes * 60 * 1000);
            } else {
                executeAction(automation, data, handlers);
            }
        }
    }
};

const executeAction = async (automation: Automation, data: CustomerInfo | EstimateRecord | any, handlers: ActionHandlers) => {
    try {
        switch (automation.action_type) {
            case 'webhook':
                if (automation.action_config.url) {
                    try {
                        await fetch(automation.action_config.url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                automation: automation.name,
                                trigger: automation.trigger_type,
                                data: data
                            }),
                        });
                        console.log(`Webhook sent successfully for "${automation.name}"`);
                    } catch (error) {
                        console.error(`Webhook for automation "${automation.name}" failed:`, error);
                    }
                }
                break;

            case 'create_task':
                if (automation.action_config.task_title) {
                    const title = replacePlaceholders(automation.action_config.task_title, data);
                    const description = replacePlaceholders(automation.action_config.task_description || '', data);
                    await handlers.createTask({
                        title,
                        description,
                        assignedTo: [],
                    });
                    console.log(`Task created: "${title}"`);
                }
                break;

            case 'add_to_schedule':
                const jobData = data as EstimateRecord;
                if (jobData && jobData.calcData?.customer) {
                    const jobName = replacePlaceholders("[customer_name] - [job_number]", jobData);
                    handlers.addToSchedule({
                        name: jobName,
                        start: fmtInput(new Date()),
                        end: fmtInput(new Date()),
                        color: '#3498DB',
                        links: [],
                    });
                    console.log(`Job added to schedule: "${jobName}"`);
                }
                break;

            case 'send_email':
                let emailRecipient = '';
                if (automation.action_config.email_recipient === 'custom') {
                    emailRecipient = automation.action_config.custom_email || '';
                } else if (automation.action_config.email_recipient === 'team') {
                    emailRecipient = 'team@example.com'; // Would need actual team emails
                } else {
                    emailRecipient = (data as any).calcData?.customer?.email || (data as CustomerInfo).email;
                }

                if (emailRecipient && automation.action_config.email_subject) {
                    const subject = replacePlaceholders(automation.action_config.email_subject, data);
                    const body = replacePlaceholders(automation.action_config.email_body || '', data);
                    await handlers.sendEmail(emailRecipient, subject, body);
                    console.log(`Email sent to ${emailRecipient}`);
                } else {
                    console.warn(`Automation "${automation.name}" skipped: No email recipient found.`);
                }
                break;

            case 'send_sms':
                // SMS implementation would require SMS service integration
                console.log(`SMS action triggered for automation "${automation.name}" (not yet implemented)`);
                break;

            case 'update_job_status':
                // This would require a handler to update job status
                console.log(`Update job status to "${automation.action_config.new_status}" (requires implementation)`);
                break;

            case 'assign_team':
                // This would require a handler to assign team
                console.log(`Assign team action triggered for automation "${automation.name}" (requires implementation)`);
                break;

            case 'create_invoice':
                // This would require a handler to create invoice
                console.log(`Create invoice action triggered for automation "${automation.name}" (requires implementation)`);
                break;

            case 'update_inventory':
                if ('estimateNumber' in data) {
                    await handlers.deductInventoryForJob(data as EstimateRecord);
                    console.log(`Inventory updated for job ${data.estimateNumber}`);
                } else {
                    console.warn(`Automation "${automation.name}" skipped: 'update_inventory' action can only be triggered by job-related events.`);
                }
                break;
        }
    } catch (error) {
        console.error(`Failed to execute automation "${automation.name}":`, error);
    }
};
