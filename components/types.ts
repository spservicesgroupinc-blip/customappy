
export interface Job {
    id: string;
    name: string;
    start: string; // "YYYY-MM-DD"
    end: string; // "YYYY-MM-DD"
    color: string;
    links: string[];
    assignedTeam?: number[];
}

export interface EditingJob extends Partial<Job> {
    id: string; // id is not partial
}

export interface Employee {
    id?: number;
    name: string;
    role: string;
    pin: string; // 4-digit PIN for time clock
}

export interface TimeEntry {
    id?: number;
    employeeId: number;
    jobId: number;
    startTime: string; // ISO string
    endTime?: string; // ISO string
    startLat?: number;
    startLng?: number;
    endLat?: number;
    endLng?: number;
    durationHours?: number;
}

export interface Task {
    id?: number;
    title: string;
    description?: string;
    dueDate?: string; // YYYY-MM-DD
    completed: boolean;
    assignedTo: number[]; // empty array means for all admins/unassigned
    createdAt: string; // ISO string
    completedAt?: string; // ISO string
}

export interface DriveFile {
  id?: number;
  customerId: number;
  fileId: string;
  fileName: string;
  webLink: string;
  iconLink: string;
}

// --- Automation Types ---
export type TriggerType =
  | 'new_customer'
  | 'job_status_updated'
  | 'job_created'
  | 'task_completed'
  | 'invoice_overdue'
  | 'scheduled_time'
  | 'inventory_low';

export type ActionType =
  | 'webhook'
  | 'create_task'
  | 'add_to_schedule'
  | 'send_email'
  | 'update_inventory'
  | 'send_sms'
  | 'update_job_status'
  | 'assign_team'
  | 'create_invoice';

export interface Automation {
    id?: number;
    name: string;
    description?: string;
    trigger_type: TriggerType;
    trigger_config: {
        to_status?: string;
        from_status?: string;
        job_value_min?: number;
        job_value_max?: number;
        time?: string;
        days_overdue?: number;
        stock_threshold?: number;
        item_name?: string;
    };
    action_type: ActionType;
    action_config: {
        url?: string;
        task_title?: string;
        task_description?: string;
        task_priority?: 'low' | 'medium' | 'high';
        email_subject?: string;
        email_body?: string;
        email_recipient?: 'customer' | 'team' | 'custom';
        custom_email?: string;
        sms_message?: string;
        sms_recipient?: 'customer' | 'team' | 'custom';
        custom_phone?: string;
        new_status?: string;
        team_ids?: number[];
        delay_minutes?: number;
    };
    conditions?: {
        field?: string;
        operator?: 'equals' | 'greater_than' | 'less_than' | 'contains';
        value?: any;
    }[];
    is_enabled: boolean;
}
