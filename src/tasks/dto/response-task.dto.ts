export class TaskResponseDto {
    id: string;
    type: string;
    status: string;
    payload: any;
    result?: any;
    error?: string;
    created_at: Date;
    updated_at: Date;
    completed_at?: Date;
  }
  